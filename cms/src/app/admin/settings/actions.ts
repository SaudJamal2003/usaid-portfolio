'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { logActivity } from '@/lib/activity'
import { ENTITY_ID_MAX } from '@/lib/constants'

const optional = z
  .string()
  .trim()
  .max(500)
  .optional()
  .or(z.literal(''))
  .transform((v) => v || null)

/* Content and identity only. Nothing here is a secret: API keys, tokens and
   connection strings stay in environment variables, never in a CMS-editable
   field (§13, §29). */
const schema = z.object({
  siteName: z.string().trim().min(1, 'Site name is required').max(120),
  siteDescription: z.string().trim().max(500),
  contactEmail: z.string().trim().email('Enter a valid email address'),
  location: optional,
  availabilityLabel: optional,
  clientsLabel: optional,
  defaultSeoTitle: optional,
  defaultSeoDesc: optional,
  ogImageId: z.string().min(1).max(ENTITY_ID_MAX).nullable().optional(),
  faviconId: z.string().min(1).max(ENTITY_ID_MAX).nullable().optional(),
})

export async function saveSettings(input: unknown) {
  const user = await requireUser()
  const parsed = schema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message }

  await db.siteSettings.update({ where: { id: 'singleton' }, data: parsed.data })
  await logActivity({
    userId: user.id,
    action: 'UPDATE',
    entityType: 'site_settings',
    summary: 'Updated site settings',
  })
  revalidatePath('/admin/settings')
  return { ok: true as const }
}
