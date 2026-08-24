import 'server-only'
import sharp from 'sharp'
import { db } from './db'
import { deleteObject, publicUrl, putObject, storageKey } from './storage'
import { mediaIdsInBlock } from './blocks'

/* Allow-list, not a block-list. Anything not named here is rejected, which is
   what keeps executable uploads out (§50). */
const ALLOWED = new Map<string, string>([
  ['image/png', '.png'],
  ['image/jpeg', '.jpg'],
  ['image/webp', '.webp'],
  ['image/avif', '.avif'],
  ['image/svg+xml', '.svg'],
  ['video/mp4', '.mp4'],
  ['application/pdf', '.pdf'],
])

const MAX_BYTES = 200 * 1024 * 1024

/* Derived sizes so a portfolio card never pulls a 5 MB original (§49). */
const RENDITIONS = [
  { name: 'thumb', width: 400 },
  { name: 'medium', width: 1000 },
  { name: 'large', width: 2000 },
] as const

export type UploadResult = { ok: true; id: string } | { ok: false; error: string }

export async function uploadMedia(file: File, altText?: string): Promise<UploadResult> {
  if (!ALLOWED.has(file.type)) {
    return { ok: false, error: `Unsupported file type: ${file.type || 'unknown'}` }
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: `File is larger than ${MAX_BYTES / 1024 / 1024} MB` }
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const key = storageKey(file.name)

  let width: number | undefined
  let height: number | undefined
  const renditions: Record<string, string> = {}

  // SVG has no raster dimensions worth deriving and re-encoding it would strip
  // the vector; PDFs and video are stored as-is.
  const rasterisable = file.type.startsWith('image/') && file.type !== 'image/svg+xml'

  if (rasterisable) {
    try {
      const image = sharp(buffer)
      const meta = await image.metadata()
      width = meta.width
      height = meta.height

      for (const size of RENDITIONS) {
        if (!width || width <= size.width) continue
        const resized = await sharp(buffer)
          .resize({ width: size.width, withoutEnlargement: true })
          .webp({ quality: 82 })
          .toBuffer()
        const renditionKey = key.replace(/(\.[a-z0-9]+)$/i, `-${size.name}.webp`)
        await putObject(renditionKey, resized, 'image/webp')
        renditions[size.name] = renditionKey
      }
    } catch {
      /* A file we cannot process still stores fine as an original. */
    }
  }

  await putObject(key, buffer, file.type)

  const media = await db.media.create({
    data: {
      storageKey: key,
      originalFilename: file.name,
      mimeType: file.type,
      size: file.size,
      width,
      height,
      altText: altText || null,
      renditions: Object.keys(renditions).length ? renditions : undefined,
    },
  })

  return { ok: true, id: media.id }
}

export type MediaReference = { label: string; where: string }

/**
 * Everywhere a media asset is used. Deleting without checking would silently
 * blank an image on the live site, so the UI shows this list and refuses the
 * default path when it is non-empty (§38, §12).
 */
export async function findMediaReferences(mediaId: string): Promise<MediaReference[]> {
  const refs: MediaReference[] = []

  const [projects, caseStudies, experience, mentors, gallery, services, testimonials, hero, about, settings, seo] =
    await Promise.all([
      db.project.findMany({ where: { OR: [{ thumbnailId: mediaId }, { heroId: mediaId }] }, select: { title: true } }),
      db.caseStudy.findMany({ where: { OR: [{ heroId: mediaId }, { thumbnailId: mediaId }] }, select: { title: true } }),
      db.experience.findMany({ where: { logoId: mediaId }, select: { company: true } }),
      db.mentor.findMany({ where: { photoId: mediaId }, select: { name: true } }),
      db.galleryItem.findMany({ where: { imageId: mediaId }, select: { id: true } }),
      db.service.findMany({ where: { iconId: mediaId }, select: { title: true } }),
      db.testimonial.findMany({
        where: { OR: [{ avatarId: mediaId }, { companyLogoId: mediaId }] },
        select: { name: true },
      }),
      db.homepageHero.findMany({ where: { portraitId: mediaId }, select: { id: true } }),
      db.aboutContent.findMany({ where: { portraitId: mediaId }, select: { id: true } }),
      db.siteSettings.findMany({ where: { OR: [{ ogImageId: mediaId }, { faviconId: mediaId }] }, select: { id: true } }),
      db.seoMetadata.findMany({ where: { ogImageId: mediaId }, select: { entityType: true, entityId: true } }),
    ])

  for (const p of projects) refs.push({ label: p.title, where: 'Project' })
  for (const c of caseStudies) refs.push({ label: c.title, where: 'Case study' })
  for (const e of experience) refs.push({ label: e.company, where: 'Experience' })
  for (const m of mentors) refs.push({ label: m.name, where: 'Mentor' })
  for (const _ of gallery) refs.push({ label: 'Gallery item', where: 'Life Outside Figma' })
  for (const s of services) refs.push({ label: s.title, where: 'Service' })
  for (const t of testimonials) refs.push({ label: t.name, where: 'Testimonial' })
  for (const _ of hero) refs.push({ label: 'Hero portrait', where: 'Homepage' })
  for (const _ of about) refs.push({ label: 'About portrait', where: 'About' })
  for (const _ of settings) refs.push({ label: 'OG image or favicon', where: 'Site settings' })
  for (const s of seo) refs.push({ label: `${s.entityType} ${s.entityId}`, where: 'SEO' })

  // Blocks keep their media ids inside JSONB, so they need a scan rather than a
  // join. Case study counts are small enough that this is not worth indexing.
  const blocks = await db.caseStudyBlock.findMany({
    select: { type: true, data: true, caseStudy: { select: { title: true } } },
  })
  for (const block of blocks) {
    if (mediaIdsInBlock(block.type, block.data).includes(mediaId)) {
      refs.push({ label: block.caseStudy.title, where: `Case study block (${block.type})` })
    }
  }

  return refs
}

export async function deleteMedia(mediaId: string) {
  const media = await db.media.findUnique({ where: { id: mediaId } })
  if (!media) return

  const renditions = (media.renditions as Record<string, string> | null) ?? {}
  await Promise.allSettled([
    deleteObject(media.storageKey),
    ...Object.values(renditions).map((key) => deleteObject(key)),
  ])
  await db.media.delete({ where: { id: mediaId } })
}

/** Shape handed to the portfolio and to the CMS picker. */
export function mediaPayload(media: {
  id: string
  storageKey: string
  altText: string | null
  width: number | null
  height: number | null
  mimeType: string
  renditions: unknown
}) {
  const renditions = (media.renditions as Record<string, string> | null) ?? {}
  return {
    id: media.id,
    url: publicUrl(media.storageKey),
    thumbUrl: renditions.thumb ? publicUrl(renditions.thumb) : publicUrl(media.storageKey),
    mediumUrl: renditions.medium ? publicUrl(renditions.medium) : publicUrl(media.storageKey),
    alt: media.altText ?? '',
    width: media.width,
    height: media.height,
    mimeType: media.mimeType,
  }
}
