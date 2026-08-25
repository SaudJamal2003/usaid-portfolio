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

const schema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  description: optional,
  copyright: optional,
  ctaLabel: optional,
  ctaUrl: optional,
})

export async function saveFooter(input: unknown) {
  const user = await requireUser()
  const parsed = schema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message }

  await db.footerSettings.upsert({
    where: { id: 'singleton' },
    update: parsed.data,
    create: { id: 'singleton', ...parsed.data },
  })
  await logActivity({
    userId: user.id,
    action: 'UPDATE',
    entityType: 'footer',
    summary: 'Updated the footer',
  })
  revalidatePath('/admin/footer')
  return { ok: true as const }
}

const socialSchema = z.object({
  id: z.string().min(1).max(ENTITY_ID_MAX),
  platform: z.string().trim().min(1, 'Every social link needs a platform name').max(60),
  url: z.string().trim().max(500),
  visible: z.boolean().default(true),
  iconId: z.string().min(1).max(ENTITY_ID_MAX).nullable().optional(),
})

export async function saveSocialLinks(items: unknown) {
  const user = await requireUser()
  const parsed = z.array(socialSchema).max(12).safeParse(items)
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message }

  await db.$transaction(
    parsed.data.map((row, index) =>
      db.socialLink.update({
        where: { id: row.id },
        data: {
          platform: row.platform,
          url: row.url,
          visible: row.visible,
          iconId: row.iconId ?? null,
          displayOrder: index,
        },
      }),
    ),
  )

  await logActivity({
    userId: user.id,
    action: 'UPDATE',
    entityType: 'social_links',
    summary: 'Updated social links',
  })
  revalidatePath('/admin/footer')
  return { ok: true as const }
}

export async function addSocialLink() {
  await requireUser()
  const last = await db.socialLink.findFirst({ orderBy: { displayOrder: 'desc' } })
  await db.socialLink.create({
    data: { platform: 'New platform', url: '', displayOrder: (last?.displayOrder ?? -1) + 1 },
  })
  revalidatePath('/admin/footer')
  return { ok: true as const }
}

export async function deleteSocialLink(id: string) {
  const user = await requireUser()
  const link = await db.socialLink.findUnique({ where: { id } })
  if (!link) return { ok: false as const, error: 'Link not found.' }
  await db.socialLink.delete({ where: { id } })
  await logActivity({
    userId: user.id,
    action: 'DELETE',
    entityType: 'social_links',
    entityId: id,
    summary: `Removed social link "${link.platform}"`,
  })
  revalidatePath('/admin/footer')
  return { ok: true as const }
}
