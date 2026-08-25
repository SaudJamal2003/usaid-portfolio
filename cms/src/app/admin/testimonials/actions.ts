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
  name: z.string().trim().max(200),
  role: optional,
  company: optional,
  // Empty is allowed on save; the publish gate insists on it.
  quote: z.string().trim().max(2000),
  linkedinUrl: optional,
  avatarId: z.string().min(1).max(ENTITY_ID_MAX).nullable().optional(),
  companyLogoId: z.string().min(1).max(ENTITY_ID_MAX).nullable().optional(),
  featured: z.boolean().default(false),
})

export async function createTestimonial() {
  const user = await requireUser()
  const last = await db.testimonial.findFirst({ orderBy: { displayOrder: 'desc' } })

  const created = await db.testimonial.create({
    data: {
      name: 'New testimonial',
      quote: '',
      status: 'DRAFT',
      displayOrder: (last?.displayOrder ?? -1) + 1,
    },
  })

  await logActivity({
    userId: user.id,
    action: 'CREATE',
    entityType: 'testimonial',
    entityId: created.id,
    summary: 'Created a testimonial',
  })
  redirect(`/admin/testimonials/${created.id}`)
}

export async function saveTestimonial(input: unknown) {
  const user = await requireUser()
  const parsed = schema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message }

  const { id, ...data } = parsed.data
  await db.testimonial.update({ where: { id }, data })
  await logActivity({
    userId: user.id,
    action: 'UPDATE',
    entityType: 'testimonial',
    entityId: id,
    summary: `Updated testimonial from "${data.name}"`,
  })

  revalidatePath('/admin/testimonials')
  revalidatePath(`/admin/testimonials/${id}`)
  return { ok: true as const }
}

export async function publishTestimonial(id: string) {
  const user = await requireUser()
  const testimonial = await db.testimonial.findUnique({ where: { id } })
  if (!testimonial) return { ok: false as const, error: 'Testimonial not found.' }

  const problems: string[] = []
  if (!testimonial.name.trim() || testimonial.name === 'New testimonial') problems.push('name the person')
  if (!testimonial.quote.trim()) problems.push('add what they said')

  if (problems.length) {
    return { ok: false as const, error: `Before publishing, ${problems.join(', ')}.` }
  }

  await db.testimonial.update({ where: { id }, data: { status: 'PUBLISHED' } })
  await logActivity({
    userId: user.id,
    action: 'PUBLISH',
    entityType: 'testimonial',
    entityId: id,
    summary: `Published testimonial from "${testimonial.name}"`,
  })

  revalidatePath('/admin/testimonials')
  revalidatePath(`/admin/testimonials/${id}`)
  return { ok: true as const }
}

export async function setTestimonialStatus(id: string, status: 'DRAFT' | 'ARCHIVED') {
  const user = await requireUser()
  const testimonial = await db.testimonial.update({ where: { id }, data: { status } })
  await logActivity({
    userId: user.id,
    action: status === 'ARCHIVED' ? 'ARCHIVE' : 'UNPUBLISH',
    entityType: 'testimonial',
    entityId: id,
    summary: `${status === 'ARCHIVED' ? 'Archived' : 'Unpublished'} testimonial from "${testimonial.name}"`,
  })
  revalidatePath('/admin/testimonials')
  revalidatePath(`/admin/testimonials/${id}`)
  return { ok: true as const }
}

export async function reorderTestimonials(orderedIds: string[]) {
  await requireUser()
  await db.$transaction(
    orderedIds.map((id, index) => db.testimonial.update({ where: { id }, data: { displayOrder: index } })),
  )
  revalidatePath('/admin/testimonials')
  return { ok: true as const }
}

export async function deleteTestimonial(id: string) {
  const user = await requireUser()
  const testimonial = await db.testimonial.findUnique({ where: { id } })
  if (!testimonial) return { ok: false as const, error: 'Testimonial not found.' }

  // Archive is the reversible path; permanent removal is only for entries that
  // were never public (§38).
  if (testimonial.status === 'PUBLISHED') {
    return { ok: false as const, error: 'Archive this testimonial before deleting it.' }
  }

  await db.testimonial.delete({ where: { id } })
  await logActivity({
    userId: user.id,
    action: 'DELETE',
    entityType: 'testimonial',
    entityId: id,
    summary: `Deleted testimonial from "${testimonial.name}"`,
  })
  revalidatePath('/admin/testimonials')
  return { ok: true as const }
}
