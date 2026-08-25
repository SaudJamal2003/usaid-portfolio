'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { logActivity } from '@/lib/activity'
import { ENTITY_ID_MAX } from '@/lib/constants'

const optional = z
  .string()
  .trim()
  .max(300)
  .optional()
  .or(z.literal(''))
  .transform((v) => v || null)

const schema = z.object({
  id: z.string().min(1).max(ENTITY_ID_MAX),
  company: z.string().trim().min(1, 'Company is required').max(200),
  role: z.string().trim().min(1, 'Role is required').max(200),
  description: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .or(z.literal(''))
    .transform((v) => v || null),
  // Each record owns its bullets. The portfolio used to share one array across
  // every role, so all four cards showed the same achievements.
  highlights: z.array(z.string().trim().min(1).max(500)).max(12),
  startDate: z.string().trim().min(1, 'Start date is required').max(40),
  endDate: optional,
  isCurrent: z.boolean().default(false),
  location: optional,
  logoId: z.string().cuid().nullable().optional(),
})

export async function createExperience() {
  const user = await requireUser()
  const last = await db.experience.findFirst({ orderBy: { displayOrder: 'desc' } })

  const created = await db.experience.create({
    data: {
      company: 'New role',
      role: '',
      startDate: '',
      highlights: [],
      status: 'DRAFT',
      displayOrder: (last?.displayOrder ?? -1) + 1,
    },
  })

  await logActivity({
    userId: user.id,
    action: 'CREATE',
    entityType: 'experience',
    entityId: created.id,
    summary: 'Created an experience entry',
  })
  redirect(`/admin/experience/${created.id}`)
}

export async function saveExperience(input: unknown) {
  const user = await requireUser()
  const parsed = schema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message }

  const { id, ...data } = parsed.data
  // A current role has no end date; keeping a stale one would render as a
  // closed period on the timeline.
  if (data.isCurrent) data.endDate = null

  await db.experience.update({ where: { id }, data })
  await logActivity({
    userId: user.id,
    action: 'UPDATE',
    entityType: 'experience',
    entityId: id,
    summary: `Updated experience "${data.company}"`,
  })

  revalidatePath('/admin/experience')
  revalidatePath(`/admin/experience/${id}`)
  return { ok: true as const }
}

/**
 * Publishing is what makes a role visible, so the gate is specifically about
 * having its own bullets — that is the whole point of this module.
 */
export async function publishExperience(id: string) {
  const user = await requireUser()

  const entry = await db.experience.findUnique({ where: { id } })
  if (!entry) return { ok: false as const, error: 'Experience entry not found.' }

  const problems: string[] = []
  if (!entry.company.trim() || entry.company === 'New role') problems.push('name the company')
  if (!entry.role.trim()) problems.push('set the role title')
  if (!entry.startDate.trim()) problems.push('set the start date')
  if (entry.highlights.length === 0) problems.push('write at least one highlight')
  if (entry.highlights.some((h) => h.startsWith('TODO'))) {
    problems.push('replace the TODO placeholder text')
  }

  if (problems.length) {
    return { ok: false as const, error: `Before publishing, ${problems.join(', ')}.` }
  }

  await db.experience.update({ where: { id }, data: { status: 'PUBLISHED' } })
  await logActivity({
    userId: user.id,
    action: 'PUBLISH',
    entityType: 'experience',
    entityId: id,
    summary: `Published experience "${entry.company}"`,
  })

  revalidatePath('/admin/experience')
  revalidatePath(`/admin/experience/${id}`)
  return { ok: true as const }
}

export async function setExperienceStatus(id: string, status: 'DRAFT' | 'ARCHIVED') {
  const user = await requireUser()
  const entry = await db.experience.update({ where: { id }, data: { status } })
  await logActivity({
    userId: user.id,
    action: status === 'ARCHIVED' ? 'ARCHIVE' : 'UNPUBLISH',
    entityType: 'experience',
    entityId: id,
    summary: `${status === 'ARCHIVED' ? 'Archived' : 'Unpublished'} experience "${entry.company}"`,
  })
  revalidatePath('/admin/experience')
  revalidatePath(`/admin/experience/${id}`)
  return { ok: true as const }
}

export async function reorderExperience(orderedIds: string[]) {
  await requireUser()
  await db.$transaction(
    orderedIds.map((id, index) => db.experience.update({ where: { id }, data: { displayOrder: index } })),
  )
  revalidatePath('/admin/experience')
  return { ok: true as const }
}

export async function deleteExperience(id: string) {
  const user = await requireUser()
  const entry = await db.experience.findUnique({ where: { id } })
  if (!entry) return { ok: false as const, error: 'Experience entry not found.' }

  // Archive is the reversible path; permanent removal is only for entries that
  // were never public (§38).
  if (entry.status === 'PUBLISHED') {
    return { ok: false as const, error: 'Archive this entry before deleting it.' }
  }

  await db.experience.delete({ where: { id } })
  await logActivity({
    userId: user.id,
    action: 'DELETE',
    entityType: 'experience',
    entityId: id,
    summary: `Deleted experience "${entry.company}"`,
  })
  revalidatePath('/admin/experience')
  return { ok: true as const }
}
