import 'server-only'
import sharp from 'sharp'
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { db } from './db'
import { deleteObject, publicUrl, putObject, s3, storageKey } from './storage'
import { env } from './env'
import { mediaIdsInBlock } from './blocks'
import { ALLOWED_TYPES, RENDITION_MAX_BYTES, checkUpload, kindOf } from './upload-policy'

/* Derived sizes so a portfolio card never pulls a full-resolution original
   (§49). Originals are always retained. */
const RENDITIONS = [
  { name: 'thumb', width: 400 },
  { name: 'medium', width: 1000 },
  { name: 'large', width: 2000 },
] as const

export type UploadResult = { ok: true; id: string } | { ok: false; error: string }

/**
 * Presigned PUT straight to MinIO.
 *
 * Large files never pass through the Next process: buffering a 99 MB video in
 * a server action would blow the body limit and hold the whole file in memory.
 * The browser uploads directly and the signature is scoped to one key with a
 * short expiry, so no credential ever reaches the client.
 */
export async function createUploadUrl(filename: string, mimeType: string, size: number) {
  const check = checkUpload(mimeType, size)
  if (!check.ok) return { ok: false as const, error: check.error }

  // Key is generated, never taken from the filename — it ends up in a URL.
  const key = storageKey(filename)
  const url = await getSignedUrl(
    s3,
    new PutObjectCommand({ Bucket: env.MINIO_BUCKET, Key: key, ContentType: mimeType }),
    { expiresIn: 900 },
  )
  return { ok: true as const, url, key }
}

async function fetchObject(key: string): Promise<Buffer | null> {
  try {
    const result = await s3.send(new GetObjectCommand({ Bucket: env.MINIO_BUCKET, Key: key }))
    const bytes = await result.Body?.transformToByteArray()
    return bytes ? Buffer.from(bytes) : null
  } catch {
    return null
  }
}

/** Probes dimensions and writes derived sizes. Best-effort: a file we cannot
 *  process still works fine as an original. */
async function deriveRenditions(key: string, mimeType: string, size: number) {
  const result: { width?: number; height?: number; renditions: Record<string, string> } = {
    renditions: {},
  }

  const isRaster = mimeType.startsWith('image/') && mimeType !== 'image/svg+xml'
  if (!isRaster || size > RENDITION_MAX_BYTES) return result

  const buffer = await fetchObject(key)
  if (!buffer) return result

  try {
    const meta = await sharp(buffer).metadata()
    result.width = meta.width
    result.height = meta.height

    for (const rendition of RENDITIONS) {
      if (!meta.width || meta.width <= rendition.width) continue
      const resized = await sharp(buffer)
        .resize({ width: rendition.width, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer()
      const renditionKey = key.replace(/(\.[a-z0-9]+)$/i, `-${rendition.name}.webp`)
      await putObject(renditionKey, resized, 'image/webp')
      result.renditions[rendition.name] = renditionKey
    }
  } catch {
    /* leave the original as the only representation */
  }

  return result
}

/** Second half of the presigned flow: the object already exists in MinIO, this
 *  records it and derives sizes. */
export async function finalizeUpload(input: {
  key: string
  filename: string
  mimeType: string
  size: number
  altText?: string
}): Promise<UploadResult> {
  const check = checkUpload(input.mimeType, input.size)
  if (!check.ok) return { ok: false, error: check.error }

  // Confirm the client actually uploaded something to the key it claims.
  const stored = await fetchObject(input.key)
  if (!stored) return { ok: false, error: 'The upload did not complete. Try again.' }

  const derived = await deriveRenditions(input.key, input.mimeType, input.size)

  const media = await db.media.create({
    data: {
      storageKey: input.key,
      originalFilename: input.filename,
      mimeType: input.mimeType,
      size: input.size,
      width: derived.width,
      height: derived.height,
      altText: input.altText || null,
      renditions: Object.keys(derived.renditions).length ? derived.renditions : undefined,
    },
  })

  return { ok: true, id: media.id }
}

/**
 * Direct server-side upload. Used by the seed, which reads files off disk and
 * has no browser to presign for.
 */
export async function uploadMedia(file: File, altText?: string): Promise<UploadResult> {
  const check = checkUpload(file.type, file.size)
  if (!check.ok) return { ok: false, error: check.error }

  const buffer = Buffer.from(await file.arrayBuffer())
  const key = storageKey(file.name)
  await putObject(key, buffer, file.type)

  const derived = await deriveRenditions(key, file.type, file.size)

  const media = await db.media.create({
    data: {
      storageKey: key,
      originalFilename: file.name,
      mimeType: file.type,
      size: file.size,
      width: derived.width,
      height: derived.height,
      altText: altText || null,
      renditions: Object.keys(derived.renditions).length ? derived.renditions : undefined,
    },
  })
  return { ok: true, id: media.id }
}

/**
 * Swaps the bytes behind an existing media row, keeping its id.
 *
 * The storage key changes (it carries the extension and a cache-busting
 * timestamp) but the id does not, so every reference follows automatically —
 * which is the whole point of replace as distinct from delete-and-reupload.
 */
export async function replaceMedia(mediaId: string, key: string, filename: string, mimeType: string, size: number) {
  const check = checkUpload(mimeType, size)
  if (!check.ok) return { ok: false as const, error: check.error }

  const existing = await db.media.findUnique({ where: { id: mediaId } })
  if (!existing) return { ok: false as const, error: 'Media not found.' }

  const stored = await fetchObject(key)
  if (!stored) return { ok: false as const, error: 'The upload did not complete. Try again.' }

  const derived = await deriveRenditions(key, mimeType, size)

  await db.media.update({
    where: { id: mediaId },
    data: {
      storageKey: key,
      originalFilename: filename,
      mimeType,
      size,
      width: derived.width ?? null,
      height: derived.height ?? null,
      renditions: Object.keys(derived.renditions).length ? derived.renditions : undefined,
    },
  })

  // Drop the superseded objects only after the row points at the new ones.
  const oldRenditions = (existing.renditions as Record<string, string> | null) ?? {}
  await Promise.allSettled([
    deleteObject(existing.storageKey),
    ...Object.values(oldRenditions).map((k) => deleteObject(k)),
  ])

  return { ok: true as const }
}

export type MediaReference = { label: string; where: string }

/**
 * Everywhere a media asset is used. Deleting without checking would silently
 * blank an image on the live site, so the UI shows this list and steers to
 * archive instead (§38, §12).
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

  // Blocks keep media ids inside JSONB, so they need a scan rather than a join.
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

/** Richer shape for the library screen, which shows filenames and sizes. */
export function mediaDetail(media: {
  id: string
  storageKey: string
  originalFilename: string
  displayName: string | null
  altText: string | null
  caption: string | null
  description: string | null
  width: number | null
  height: number | null
  size: number
  mimeType: string
  renditions: unknown
  archivedAt: Date | null
  createdAt: Date
}) {
  return {
    ...mediaPayload(media),
    originalFilename: media.originalFilename,
    displayName: media.displayName,
    name: media.displayName || media.originalFilename,
    caption: media.caption,
    description: media.description,
    size: media.size,
    kind: kindOf(media.mimeType) ?? 'document',
    extension: ALLOWED_TYPES[media.mimeType]?.ext.replace('.', '').toUpperCase() ?? '?',
    archived: media.archivedAt !== null,
    createdAt: media.createdAt.toISOString(),
  }
}

export type MediaDetail = ReturnType<typeof mediaDetail>
