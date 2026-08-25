'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { logActivity } from '@/lib/activity'
import { ENTITY_ID_MAX, NEW_MENTOR_NAME } from '@/lib/constants'

const optional = z
  .string()
  .trim()
  .max(500)
  .optional()
  .or(z.literal(''))
  .transform((v) => v || null)

const schema = z.object({
  id: z.string().min(1).max(ENTITY_ID_MAX),
  // Empty is allowed on save -- a draft is a work in progress; the publish gate
  // is what insists on completeness.
  name: z.string().trim().max(200),
  role: z.string().trim().max(300),
  tribute: z.string().trim().max(4000),
  linkedinUrl: optional,
  photoId: z.string().min(1).max(ENTITY_ID_MAX).nullable().optional(),
})

export async function createMentor() {
  const user = await requireUser()
  const last = await db.mentor.findFirst({ orderBy: { displayOrder: 'desc' } })

  const created = await db.mentor.create({
    data: {
      name: NEW_MENTOR_NAME,
      role: '',
      tribute: '',
      status: 'DRAFT',
      displayOrder: (last?.displayOrder ?? -1) + 1,
    },
  })

  await logActivity({
    userId: user.id,
    action: 'CREATE',
    entityType: 'mentor',
    entityId: created.id,
    summary: 'Created a mentor',
  })
  redirect(`/admin/mentors/${created.id}`)
}

export async function saveMentor(input: unknown) {
  const user = await requireUser()
  const parsed = schema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message }

  const { id, ...data } = parsed.data
  await db.mentor.update({ where: { id }, data })
  await logActivity({
    userId: user.id,
    action: 'UPDATE',
    entityType: 'mentor',
    entityId: id,
    summary: `Updated mentor "${data.name}"`,
  })

  revalidatePath('/admin/mentors')
  revalidatePath(`/admin/mentors/${id}`)
  return { ok: true as const }
}

/**
 * A mentor is a real person being publicly credited, so the gate refuses
 * anything half-written — and specifically refuses leftover TODO text, which is
 * how the placeholder rows used to look.
 */
export async function publishMentor(id: string) {
  const user = await requireUser()
  const mentor = await db.mentor.findUnique({ where: { id } })
  if (!mentor) return { ok: false as const, error: 'Mentor not found.' }

  const problems: string[] = []
  if (!mentor.name.trim() || mentor.name === NEW_MENTOR_NAME) problems.push('give their real name')
  if (!mentor.role.trim()) problems.push('add their role')
  if (!mentor.tribute.trim()) problems.push('write the tribute')
  if (!mentor.photoId) problems.push('choose a photo')
  if ([mentor.name, mentor.role, mentor.tribute].some((value) => value.startsWith('TODO'))) {
    problems.push('replace the TODO placeholder text')
  }

  if (problems.length) {
    return { ok: false as const, error: `Before publishing, ${problems.join(', ')}.` }
  }

  await db.mentor.update({ where: { id }, data: { status: 'PUBLISHED' } })
  await logActivity({
    userId: user.id,
    action: 'PUBLISH',
    entityType: 'mentor',
    entityId: id,
    summary: `Published mentor "${mentor.name}"`,
  })

  revalidatePath('/admin/mentors')
  revalidatePath(`/admin/mentors/${id}`)
  return { ok: true as const }
}

export async function setMentorStatus(id: string, status: 'DRAFT' | 'ARCHIVED') {
  const user = await requireUser()
  const mentor = await db.mentor.update({ where: { id }, data: { status } })
  await logActivity({
    userId: user.id,
    action: status === 'ARCHIVED' ? 'ARCHIVE' : 'UNPUBLISH',
    entityType: 'mentor',
    entityId: id,
    summary: `${status === 'ARCHIVED' ? 'Archived' : 'Unpublished'} mentor "${mentor.name}"`,
  })
  revalidatePath('/admin/mentors')
  revalidatePath(`/admin/mentors/${id}`)
  return { ok: true as const }
}

export async function reorderMentors(orderedIds: string[]) {
  await requireUser()
  await db.$transaction(
    orderedIds.map((id, index) => db.mentor.update({ where: { id }, data: { displayOrder: index } })),
  )
  revalidatePath('/admin/mentors')
  return { ok: true as const }
}

export async function deleteMentor(id: string) {
  const user = await requireUser()
  const mentor = await db.mentor.findUnique({ where: { id } })
  if (!mentor) return { ok: false as const, error: 'Mentor not found.' }

  // Archive is the reversible path; permanent removal is only for entries that
  // were never public (§38).
  if (mentor.status === 'PUBLISHED') {
    return { ok: false as const, error: 'Archive this mentor before deleting them.' }
  }

  await db.mentor.delete({ where: { id } })
  await logActivity({
    userId: user.id,
    action: 'DELETE',
    entityType: 'mentor',
    entityId: id,
    summary: `Deleted mentor "${mentor.name}"`,
  })
  revalidatePath('/admin/mentors')
  return { ok: true as const }
}
