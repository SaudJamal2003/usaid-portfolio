'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import { logActivity } from '@/lib/activity'
import { saveSeoFor } from '@/lib/seo'
import { ENTITY_ID_MAX } from '@/lib/constants'

const schema = z.object({
  entityType: z.enum(['homepage', 'project', 'case_study']),
  entityId: z.string().min(1).max(ENTITY_ID_MAX),
  title: z.string().trim().max(200).optional(),
  description: z.string().trim().max(500).optional(),
  canonicalUrl: z.string().trim().max(500).optional(),
  noIndex: z.boolean().default(false),
  ogImageId: z.string().min(1).max(ENTITY_ID_MAX).nullable().optional(),
})

export async function saveSeo(input: unknown) {
  const user = await requireUser()
  const parsed = schema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message }

  const { entityType, entityId, ...values } = parsed.data
  await saveSeoFor(entityType, entityId, values)

  await logActivity({
    userId: user.id,
    action: 'UPDATE',
    entityType: 'seo',
    entityId,
    summary: `Updated SEO for ${entityType.replace('_', ' ')}`,
  })

  revalidatePath('/admin/seo')
  revalidatePath(`/admin/${entityType === 'case_study' ? 'case-studies' : entityType === 'project' ? 'projects' : 'homepage'}`)
  return { ok: true as const }
}
