'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { logActivity } from '@/lib/activity'
import { ENTITY_ID_MAX } from '@/lib/constants'

/**
 * Routes the portfolio depends on.
 *
 * Navigation is CMS-managed, but a nav that no longer reaches the work section
 * is a broken site, so these are surfaced as warnings in the editor rather than
 * silently allowed to disappear. The CMS itself is a separate application and
 * cannot be reached from here at all — nothing edited on this screen can lock
 * anyone out of the admin.
 */
export const REQUIRED_ROUTES = [
  { url: '#home', label: 'Home' },
  { url: '#work', label: 'Work' },
  { url: '#/about', label: 'About' },
]

const itemSchema = z.object({
  id: z.string().min(1).max(ENTITY_ID_MAX),
  label: z.string().trim().max(60),
  url: z.string().trim().max(500),
  openInNewTab: z.boolean().default(false),
  visible: z.boolean().default(true),
})

export async function saveNavigation(items: unknown) {
  const user = await requireUser()
  const parsed = z.array(itemSchema).max(12).safeParse(items)
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message }

  const rows = parsed.data
  if (rows.some((row) => !row.label.trim() || !row.url.trim())) {
    return { ok: false as const, error: 'Every item needs both a label and a URL.' }
  }

  // One transaction: a half-written nav bar is worse than an unchanged one.
  await db.$transaction(
    rows.map((row, index) =>
      db.navigationItem.update({
        where: { id: row.id },
        data: {
          label: row.label,
          url: row.url,
          openInNewTab: row.openInNewTab,
          visible: row.visible,
          displayOrder: index,
        },
      }),
    ),
  )

  await logActivity({
    userId: user.id,
    action: 'UPDATE',
    entityType: 'navigation',
    summary: 'Updated site navigation',
  })
  revalidatePath('/admin/navigation')
  return { ok: true as const }
}

export async function addNavigationItem() {
  await requireUser()
  const last = await db.navigationItem.findFirst({ orderBy: { displayOrder: 'desc' } })
  await db.navigationItem.create({
    data: { label: 'New link', url: '#', displayOrder: (last?.displayOrder ?? -1) + 1 },
  })
  revalidatePath('/admin/navigation')
  return { ok: true as const }
}

export async function deleteNavigationItem(id: string) {
  const user = await requireUser()
  const item = await db.navigationItem.findUnique({ where: { id } })
  if (!item) return { ok: false as const, error: 'Item not found.' }

  await db.navigationItem.delete({ where: { id } })
  await logActivity({
    userId: user.id,
    action: 'DELETE',
    entityType: 'navigation',
    entityId: id,
    summary: `Removed nav item "${item.label}"`,
  })
  revalidatePath('/admin/navigation')
  return { ok: true as const }
}
