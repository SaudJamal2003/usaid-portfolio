'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { logActivity } from '@/lib/activity'

const optional = z
  .string()
  .trim()
  .max(500)
  .optional()
  .or(z.literal(''))
  .transform((v) => v || null)

/* Content only. Nothing here touches how the hero animates, how big the type
   is, or where anything sits -- those stay in the frontend (§3, §62.14). */
const heroSchema = z.object({
  eyebrow: optional,
  titlePrefix: z.string().trim().min(1, 'Heading is required').max(200),
  typingWords: z.array(z.string().trim().min(1).max(40)).min(1, 'Add at least one word').max(12),
  description: optional,
  primaryCtaLabel: optional,
  primaryCtaUrl: optional,
  portraitId: z.string().cuid().nullable().optional(),
})

export async function saveHero(input: unknown) {
  const user = await requireUser()
  const parsed = heroSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message }

  await db.homepageHero.upsert({
    where: { id: 'singleton' },
    update: parsed.data,
    create: { id: 'singleton', ...parsed.data },
  })
  await logActivity({
    userId: user.id,
    action: 'UPDATE',
    entityType: 'homepage_hero',
    summary: 'Updated the homepage hero',
  })
  revalidatePath('/admin/homepage')
  return { ok: true as const }
}

const statsSchema = z.object({
  clientsLabel: optional,
  availabilityLabel: optional,
  cards: z
    .array(
      z.object({
        id: z.string(),
        value: z.string().trim().min(1, 'Each stat needs a value').max(20),
        caption: z.string().trim().min(1, 'Each stat needs a caption').max(120),
        blurb: optional,
      }),
    )
    .max(6),
})

export async function saveStats(input: unknown) {
  const user = await requireUser()
  const parsed = statsSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message }

  const { clientsLabel, availabilityLabel, cards } = parsed.data

  await db.siteSettings.update({
    where: { id: 'singleton' },
    data: { clientsLabel, availabilityLabel },
  })

  // One transaction: the cards render as a set, so a partial write would show
  // a half-updated row on the live site.
  await db.$transaction(
    cards.map((card, index) =>
      db.statCard.update({
        where: { id: card.id },
        data: { value: card.value, caption: card.caption, blurb: card.blurb, displayOrder: index },
      }),
    ),
  )

  await logActivity({
    userId: user.id,
    action: 'UPDATE',
    entityType: 'stat_cards',
    summary: 'Updated the homepage stats',
  })
  revalidatePath('/admin/homepage')
  return { ok: true as const }
}

const ctaSchema = z.object({
  note: optional,
  buttonLabel: z.string().trim().min(1, 'Button label is required').max(60),
  buttonUrl: z.string().trim().min(1, 'Button link is required').max(300),
})

export async function saveContactCta(input: unknown) {
  const user = await requireUser()
  const parsed = ctaSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message }

  await db.contactCta.upsert({
    where: { id: 'singleton' },
    update: parsed.data,
    create: { id: 'singleton', ...parsed.data },
  })
  await logActivity({
    userId: user.id,
    action: 'UPDATE',
    entityType: 'contact_cta',
    summary: 'Updated the contact call to action',
  })
  revalidatePath('/admin/homepage')
  return { ok: true as const }
}

/** Replaces the avatar strip wholesale — it is a short ordered list, so
 *  diffing it would be more code than rewriting it. */
export async function saveClientAvatars(mediaIds: string[]) {
  const user = await requireUser()
  const ids = z.array(z.string().cuid()).max(12).parse(mediaIds)

  await db.$transaction([
    db.clientAvatar.deleteMany({}),
    ...ids.map((mediaId, index) =>
      db.clientAvatar.create({ data: { mediaId, displayOrder: index } }),
    ),
  ])

  await logActivity({
    userId: user.id,
    action: 'UPDATE',
    entityType: 'client_avatars',
    summary: 'Updated the client avatar strip',
  })
  revalidatePath('/admin/homepage')
  return { ok: true as const }
}
