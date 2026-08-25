'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { logActivity } from '@/lib/activity'
import { ENTITY_ID_MAX } from '@/lib/constants'

const schema = z.object({
  id: z.string().min(1).max(ENTITY_ID_MAX),
  title: z.string().trim().max(200),
  // Empty is allowed on save: a draft is a work in progress. The publish
  // gate is what insists on a description.
  description: z.string().trim().max(2000),
  iconId: z.string().min(1).max(ENTITY_ID_MAX).nullable().optional(),
})

export async function createService() {
  const user = await requireUser()
  const last = await db.service.findFirst({ orderBy: { displayOrder: 'desc' } })

  const created = await db.service.create({
    data: {
      title: 'New service',
      description: '',
      status: 'DRAFT',
      displayOrder: (last?.displayOrder ?? -1) + 1,
    },
  })

  await logActivity({
    userId: user.id,
    action: 'CREATE',
    entityType: 'service',
    entityId: created.id,
    summary: 'Created a service',
  })
  redirect(`/admin/services/${created.id}`)
}

export async function saveService(input: unknown) {
  const user = await requireUser()
  const parsed = schema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message }

  const { id, ...data } = parsed.data
  await db.service.update({ where: { id }, data })
  await logActivity({
    userId: user.id,
    action: 'UPDATE',
    entityType: 'service',
    entityId: id,
    summary: `Updated service "${data.title}"`,
  })

  revalidatePath('/admin/services')
  revalidatePath(`/admin/services/${id}`)
  return { ok: true as const }
}

export async function publishService(id: string) {
  const user = await requireUser()
  const service = await db.service.findUnique({ where: { id } })
  if (!service) return { ok: false as const, error: 'Service not found.' }

  const problems: string[] = []
  if (!service.title.trim() || service.title === 'New service') problems.push('give it a real title')
  if (!service.description.trim()) problems.push('write a description')

  if (problems.length) {
    return { ok: false as const, error: `Before publishing, ${problems.join(', ')}.` }
  }

  await db.service.update({ where: { id }, data: { status: 'PUBLISHED' } })
  await logActivity({
    userId: user.id,
    action: 'PUBLISH',
    entityType: 'service',
    entityId: id,
    summary: `Published service "${service.title}"`,
  })

  revalidatePath('/admin/services')
  revalidatePath(`/admin/services/${id}`)
  return { ok: true as const }
}

export async function setServiceStatus(id: string, status: 'DRAFT' | 'ARCHIVED') {
  const user = await requireUser()
  const service = await db.service.update({ where: { id }, data: { status } })
  await logActivity({
    userId: user.id,
    action: status === 'ARCHIVED' ? 'ARCHIVE' : 'UNPUBLISH',
    entityType: 'service',
    entityId: id,
    summary: `${status === 'ARCHIVED' ? 'Archived' : 'Unpublished'} service "${service.title}"`,
  })
  revalidatePath('/admin/services')
  revalidatePath(`/admin/services/${id}`)
  return { ok: true as const }
}

export async function reorderServices(orderedIds: string[]) {
  await requireUser()
  await db.$transaction(
    orderedIds.map((id, index) => db.service.update({ where: { id }, data: { displayOrder: index } })),
  )
  revalidatePath('/admin/services')
  return { ok: true as const }
}

export async function deleteService(id: string) {
  const user = await requireUser()
  const service = await db.service.findUnique({ where: { id } })
  if (!service) return { ok: false as const, error: 'Service not found.' }

  // Archive is the reversible path; permanent removal is only for entries that
  // were never public (§38).
  if (service.status === 'PUBLISHED') {
    return { ok: false as const, error: 'Archive this service before deleting it.' }
  }

  await db.service.delete({ where: { id } })
  await logActivity({
    userId: user.id,
    action: 'DELETE',
    entityType: 'service',
    entityId: id,
    summary: `Deleted service "${service.title}"`,
  })
  revalidatePath('/admin/services')
  return { ok: true as const }
}
