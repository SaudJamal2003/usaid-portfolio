'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { logActivity } from '@/lib/activity'
import { slugify } from '@/lib/slug'
import { NEW_PROJECT_TITLE } from '@/lib/constants'

const optionalText = z
  .string()
  .trim()
  .max(300)
  .optional()
  .or(z.literal(''))
  .transform((v) => v || null)

const detailsSchema = z.object({
  id: z.string().cuid(),
  title: z.string().trim().min(1, 'Title is required').max(200),
  slug: z.string().trim().min(1, 'Slug is required').max(120),
  shortDescription: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .or(z.literal(''))
    .transform((v) => v || null),
  category: optionalText,
  industry: optionalText,
  year: optionalText,
  role: optionalText,
  externalUrl: optionalText,
  aspectRatio: optionalText,
  technologies: z.array(z.string().trim().max(60)).max(24).default([]),
  thumbnailId: z.string().cuid().nullable().optional(),
  heroId: z.string().cuid().nullable().optional(),
  caseStudyId: z.string().cuid().nullable().optional(),
  featured: z.boolean().default(false),
})

export async function createProject() {
  const user = await requireUser()

  const base = 'untitled-project'
  let slug = base
  for (let n = 2; await db.project.findUnique({ where: { slug } }); n += 1) slug = `${base}-${n}`

  // New projects sort to the end rather than jumping the queue.
  const last = await db.project.findFirst({ orderBy: { displayOrder: 'desc' } })

  const created = await db.project.create({
    data: {
      title: NEW_PROJECT_TITLE,
      slug,
      status: 'DRAFT',
      displayOrder: (last?.displayOrder ?? -1) + 1,
    },
  })

  await logActivity({
    userId: user.id,
    action: 'CREATE',
    entityType: 'project',
    entityId: created.id,
    summary: 'Created a project',
  })
  redirect(`/admin/projects/${created.id}`)
}

export async function saveProject(input: unknown) {
  const user = await requireUser()
  const parsed = detailsSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message }

  const { id, ...data } = parsed.data
  data.slug = slugify(data.slug) || slugify(data.title)

  const clash = await db.project.findFirst({ where: { slug: data.slug, NOT: { id } } })
  if (clash) return { ok: false as const, error: `The slug "${data.slug}" is already used.` }

  // A case study belongs to at most one project (the relation is unique), so
  // claiming one that is taken has to be refused rather than silently stealing it.
  if (data.caseStudyId) {
    const taken = await db.project.findFirst({
      where: { caseStudyId: data.caseStudyId, NOT: { id } },
      select: { title: true },
    })
    if (taken) {
      return { ok: false as const, error: `That case study is already linked to "${taken.title}".` }
    }
  }

  await db.project.update({ where: { id }, data })

  await logActivity({
    userId: user.id,
    action: 'UPDATE',
    entityType: 'project',
    entityId: id,
    summary: `Updated project "${data.title}"`,
  })

  revalidatePath('/admin/projects')
  revalidatePath(`/admin/projects/${id}`)
  return { ok: true as const }
}

/** Same shape of gate as case studies: refuse with a specific reason rather
 *  than putting a half-finished card on the site (§33). */
export async function publishProject(id: string) {
  const user = await requireUser()

  const project = await db.project.findUnique({ where: { id } })
  if (!project) return { ok: false as const, error: 'Project not found.' }

  const problems: string[] = []
  if (!project.title.trim() || project.title === NEW_PROJECT_TITLE) problems.push('give it a real title')
  if (!project.slug.trim() || project.slug.startsWith('untitled-project')) problems.push('set a slug')
  if (!project.thumbnailId) problems.push('choose a thumbnail')
  if (!project.shortDescription?.trim()) problems.push('write a short description')

  if (problems.length) {
    return { ok: false as const, error: `Before publishing, ${problems.join(', ')}.` }
  }

  await db.project.update({
    where: { id },
    data: { status: 'PUBLISHED', publishedAt: project.publishedAt ?? new Date() },
  })
  await logActivity({
    userId: user.id,
    action: 'PUBLISH',
    entityType: 'project',
    entityId: id,
    summary: `Published project "${project.title}"`,
  })

  revalidatePath('/admin/projects')
  revalidatePath(`/admin/projects/${id}`)
  return { ok: true as const }
}

export async function setProjectStatus(id: string, status: 'DRAFT' | 'ARCHIVED') {
  const user = await requireUser()
  const project = await db.project.update({ where: { id }, data: { status } })
  await logActivity({
    userId: user.id,
    action: status === 'ARCHIVED' ? 'ARCHIVE' : 'UNPUBLISH',
    entityType: 'project',
    entityId: id,
    summary: `${status === 'ARCHIVED' ? 'Archived' : 'Unpublished'} project "${project.title}"`,
  })
  revalidatePath('/admin/projects')
  revalidatePath(`/admin/projects/${id}`)
  return { ok: true as const }
}

/**
 * Whole-list write in one transaction, so a partial failure cannot leave two
 * projects claiming the same slot. This is the order the homepage renders in —
 * it reads Project rows directly rather than keeping its own copy (§11).
 */
export async function reorderProjects(orderedIds: string[]) {
  const user = await requireUser()
  await db.$transaction(
    orderedIds.map((id, index) => db.project.update({ where: { id }, data: { displayOrder: index } })),
  )
  await logActivity({
    userId: user.id,
    action: 'REORDER',
    entityType: 'project',
    summary: 'Reordered featured work',
  })
  revalidatePath('/admin/projects')
  return { ok: true as const }
}

export async function deleteProject(id: string) {
  const user = await requireUser()
  const project = await db.project.findUnique({ where: { id } })
  if (!project) return { ok: false as const, error: 'Project not found.' }

  // Archive is the normal path; permanent removal is reserved for drafts that
  // never went live, where there is nothing to preserve (§38).
  if (project.status === 'PUBLISHED') {
    return { ok: false as const, error: 'Archive this project before deleting it.' }
  }

  await db.seoMetadata.deleteMany({ where: { entityType: 'project', entityId: id } })
  await db.project.delete({ where: { id } })
  await logActivity({
    userId: user.id,
    action: 'DELETE',
    entityType: 'project',
    entityId: id,
    summary: `Deleted project "${project.title}"`,
  })
  revalidatePath('/admin/projects')
  return { ok: true as const }
}
