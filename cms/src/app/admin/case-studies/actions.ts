'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { logActivity } from '@/lib/activity'
import { parseBlock, BLOCK_META } from '@/lib/blocks'
import { slugify } from '@/lib/slug'
import { NEW_DRAFT_TITLE } from '@/lib/constants'

const optionalText = z.string().trim().max(500).optional().or(z.literal('')).transform((v) => v || null)

const detailsSchema = z.object({
  id: z.string().cuid(),
  title: z.string().trim().min(1, 'Title is required').max(200),
  slug: z.string().trim().min(1, 'Slug is required').max(120),
  category: z.enum(['WEB', 'APP']).default('WEB'),
  shortDescription: z.string().trim().max(1000).optional().or(z.literal('')).transform((v) => v || null),
  client: optionalText,
  industry: optionalText,
  projectType: optionalText,
  year: optionalText,
  duration: optionalText,
  role: optionalText,
  team: optionalText,
  externalUrl: optionalText,
  prototypeUrl: optionalText,
  heroTitle: optionalText,
  heroDescription: z.string().trim().max(2000).optional().or(z.literal('')).transform((v) => v || null),
  heroId: z.string().cuid().nullable().optional(),
  thumbnailId: z.string().cuid().nullable().optional(),
  featured: z.boolean().default(false),
})

export async function createCaseStudy() {
  const user = await requireUser()

  // Slugs are unique; a fresh draft needs one that cannot collide.
  const base = 'untitled-case-study'
  let slug = base
  for (let n = 2; await db.caseStudy.findUnique({ where: { slug } }); n += 1) slug = `${base}-${n}`

  const created = await db.caseStudy.create({
    data: { title: NEW_DRAFT_TITLE, slug, status: 'DRAFT' },
  })
  await logActivity({
    userId: user.id,
    action: 'CREATE',
    entityType: 'case_study',
    entityId: created.id,
    summary: 'Created a case study',
  })
  redirect(`/admin/case-studies/${created.id}`)
}

export async function saveCaseStudy(input: unknown) {
  const user = await requireUser()
  const parsed = detailsSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0].message }
  }

  const { id, ...data } = parsed.data
  data.slug = slugify(data.slug) || slugify(data.title)

  const clash = await db.caseStudy.findFirst({ where: { slug: data.slug, NOT: { id } } })
  if (clash) return { ok: false as const, error: `The slug "${data.slug}" is already used.` }

  await db.caseStudy.update({ where: { id }, data })
  await logActivity({
    userId: user.id,
    action: 'UPDATE',
    entityType: 'case_study',
    entityId: id,
    summary: `Updated case study "${data.title}"`,
  })

  // Idempotent -- a no-op once the template blocks exist, so this is safe
  // to call on every save rather than only the save that flips the category.
  if (data.category === 'WEB') await ensureWebTemplateBlocks(id)

  revalidatePath(`/admin/case-studies/${id}`)
  return { ok: true as const }
}

const blockInput = z.object({
  caseStudyId: z.string().cuid(),
  type: z.string(),
  data: z.unknown(),
})

export async function addBlock(input: z.infer<typeof blockInput>) {
  await requireUser()
  const parsed = blockInput.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: 'Invalid block' }

  // Validated against its own schema before it reaches JSONB.
  const block = parseBlock(parsed.data.type, parsed.data.data)
  if (!block.ok) return { ok: false as const, error: block.error }

  const last = await db.caseStudyBlock.findFirst({
    where: { caseStudyId: parsed.data.caseStudyId },
    orderBy: { displayOrder: 'desc' },
  })

  const created = await db.caseStudyBlock.create({
    data: {
      caseStudyId: parsed.data.caseStudyId,
      type: parsed.data.type as never,
      data: block.data as never,
      displayOrder: (last?.displayOrder ?? -1) + 1,
    },
  })

  revalidatePath(`/admin/case-studies/${parsed.data.caseStudyId}`)
  return { ok: true as const, id: created.id }
}

export async function updateBlock(blockId: string, type: string, data: unknown) {
  await requireUser()
  const block = parseBlock(type, data)
  if (!block.ok) return { ok: false as const, error: block.error }

  const updated = await db.caseStudyBlock.update({
    where: { id: blockId },
    data: { data: block.data as never },
  })
  revalidatePath(`/admin/case-studies/${updated.caseStudyId}`)
  return { ok: true as const }
}

export async function deleteBlock(blockId: string) {
  await requireUser()
  const deleted = await db.caseStudyBlock.delete({ where: { id: blockId } })
  revalidatePath(`/admin/case-studies/${deleted.caseStudyId}`)
  return { ok: true as const }
}

/** Whole-list reorder in one transaction, so a partial write cannot leave two
 *  blocks claiming the same position (§18). */
export async function reorderBlocks(caseStudyId: string, orderedIds: string[]) {
  await requireUser()
  await db.$transaction(
    orderedIds.map((id, index) =>
      db.caseStudyBlock.update({ where: { id }, data: { displayOrder: index } }),
    ),
  )
  revalidatePath(`/admin/case-studies/${caseStudyId}`)
  return { ok: true as const }
}

/**
 * The Web template's fixed sections, in Shukar Hai's exact order. One row
 * per slot, same shape/CRUD path as every other block -- consistency comes
 * from WebTemplateEditor not exposing add/remove/reorder, not from a
 * separate schema (§ case study category). Sub-heading slots start with the
 * reference case study's own wording as an editable starting point -- an
 * admin can rename them, only the structure (image+copy, divider, copy-only)
 * is fixed.
 */
const WEB_TEMPLATE_SLOTS: { type: keyof typeof BLOCK_META; data: unknown }[] = [
  { type: 'HERO_STAT', data: BLOCK_META.HERO_STAT.initial },
  { type: 'HERO_STAT', data: BLOCK_META.HERO_STAT.initial },
  { type: 'HERO_STAT', data: BLOCK_META.HERO_STAT.initial },
  { type: 'IMAGE_TEXT', data: { heading: 'The Problem', content: '', imagePosition: 'right' } },
  { type: 'TEXT', data: { heading: 'What was getting in the way?', content: '' } },
  { type: 'RESEARCH_INTRO', data: BLOCK_META.RESEARCH_INTRO.initial },
  { type: 'INSIGHT_FINDING', data: BLOCK_META.INSIGHT_FINDING.initial },
  { type: 'INSIGHT_FINDING', data: BLOCK_META.INSIGHT_FINDING.initial },
  { type: 'INSIGHT_FINDING', data: BLOCK_META.INSIGHT_FINDING.initial },
  { type: 'INSIGHT_FINDING', data: BLOCK_META.INSIGHT_FINDING.initial },
  { type: 'GALLERY', data: BLOCK_META.GALLERY.initial },
  { type: 'VIDEO', data: BLOCK_META.VIDEO.initial },
  { type: 'FULL_WIDTH_VIDEO', data: BLOCK_META.FULL_WIDTH_VIDEO.initial },
  { type: 'QUOTE', data: BLOCK_META.QUOTE.initial },
]

/** Seeds the 14 fixed template blocks the first time a case study is set to
 *  Web. A no-op if any already exist, so flipping Web -> App -> Web never
 *  duplicates or loses authored content. */
export async function ensureWebTemplateBlocks(caseStudyId: string) {
  await requireUser()

  const existing = await db.caseStudyBlock.findFirst({
    where: { caseStudyId, type: { in: ['HERO_STAT', 'RESEARCH_INTRO', 'INSIGHT_FINDING', 'FULL_WIDTH_VIDEO'] } },
  })
  if (existing) return { ok: true as const }

  await db.$transaction(
    WEB_TEMPLATE_SLOTS.map(({ type, data }, displayOrder) =>
      db.caseStudyBlock.create({
        data: {
          caseStudyId,
          type,
          data: data as never,
          displayOrder,
        },
      }),
    ),
  )
  revalidatePath(`/admin/case-studies/${caseStudyId}`)
  return { ok: true as const }
}

/** Publishing validates first: an incomplete case study must not go live (§33). */
export async function publishCaseStudy(id: string) {
  const user = await requireUser()

  const caseStudy = await db.caseStudy.findUnique({ where: { id }, include: { blocks: true } })
  if (!caseStudy) return { ok: false as const, error: 'Case study not found.' }

  const problems: string[] = []
  if (!caseStudy.title.trim() || caseStudy.title === NEW_DRAFT_TITLE) {
    problems.push('give it a real title')
  }
  if (!caseStudy.slug.trim() || caseStudy.slug.startsWith('untitled-case-study')) {
    problems.push('set a slug')
  }
  // App's entire public page is "Coming soon" -- a title and slug are
  // enough. Web keeps the fuller floor: a hero/thumbnail and at least one
  // block, same as before this category existed.
  if (caseStudy.category === 'WEB') {
    if (!caseStudy.heroId && !caseStudy.thumbnailId) problems.push('choose a hero or thumbnail image')
    if (caseStudy.blocks.length === 0) problems.push('add at least one content block')
  }

  if (problems.length) {
    return { ok: false as const, error: `Before publishing, ${problems.join(', ')}.` }
  }

  await db.caseStudy.update({
    where: { id },
    data: { status: 'PUBLISHED', publishedAt: caseStudy.publishedAt ?? new Date() },
  })
  await logActivity({
    userId: user.id,
    action: 'PUBLISH',
    entityType: 'case_study',
    entityId: id,
    summary: `Published "${caseStudy.title}"`,
  })

  revalidatePath('/admin/case-studies')
  revalidatePath(`/admin/case-studies/${id}`)
  return { ok: true as const }
}

export async function setCaseStudyStatus(id: string, status: 'DRAFT' | 'ARCHIVED') {
  const user = await requireUser()
  const caseStudy = await db.caseStudy.update({ where: { id }, data: { status } })
  await logActivity({
    userId: user.id,
    action: status === 'ARCHIVED' ? 'ARCHIVE' : 'UNPUBLISH',
    entityType: 'case_study',
    entityId: id,
    summary: `${status === 'ARCHIVED' ? 'Archived' : 'Unpublished'} "${caseStudy.title}"`,
  })
  revalidatePath('/admin/case-studies')
  revalidatePath(`/admin/case-studies/${id}`)
  return { ok: true as const }
}

export async function duplicateCaseStudy(id: string) {
  const user = await requireUser()
  const source = await db.caseStudy.findUnique({ where: { id }, include: { blocks: true } })
  if (!source) return { ok: false as const, error: 'Case study not found.' }

  let slug = `${source.slug}-copy`
  for (let n = 2; await db.caseStudy.findUnique({ where: { slug } }); n += 1) {
    slug = `${source.slug}-copy-${n}`
  }

  const { id: _id, createdAt: _c, updatedAt: _u, publishedAt: _p, blocks, ...rest } = source
  const copy = await db.caseStudy.create({
    data: {
      ...rest,
      title: `${source.title} (copy)`,
      slug,
      status: 'DRAFT',
      publishedAt: null,
      blocks: {
        create: blocks.map((b) => ({
          type: b.type,
          data: b.data as never,
          displayOrder: b.displayOrder,
        })),
      },
    },
  })

  await logActivity({
    userId: user.id,
    action: 'DUPLICATE',
    entityType: 'case_study',
    entityId: copy.id,
    summary: `Duplicated "${source.title}"`,
  })
  revalidatePath('/admin/case-studies')
  return { ok: true as const, id: copy.id }
}

/** Mints a short-lived token so a draft can be viewed in the real portfolio
 *  without ever being reachable from the public API (§32). */
export async function createPreviewToken(id: string) {
  await requireUser()
  const { SignJWT } = await import('jose')
  const secret = new TextEncoder().encode(process.env.SESSION_SECRET!)
  const token = await new SignJWT({ caseStudyId: id, kind: 'preview' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30m')
    .sign(secret)
  return { ok: true as const, token }
}
