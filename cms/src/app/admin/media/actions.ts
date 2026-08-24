'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { logActivity } from '@/lib/activity'
import { deleteMedia, findMediaReferences, uploadMedia } from '@/lib/media'

export async function uploadMediaAction(formData: FormData) {
  const user = await requireUser()

  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false as const, error: 'Choose a file to upload.' }
  }

  const altText = (formData.get('altText') as string | null) ?? undefined
  const result = await uploadMedia(file, altText)
  if (!result.ok) return result

  await logActivity({
    userId: user.id,
    action: 'UPLOAD',
    entityType: 'media',
    entityId: result.id,
    summary: `Uploaded "${file.name}"`,
  })
  revalidatePath('/admin/media')
  return result
}

const metaSchema = z.object({
  id: z.string().cuid(),
  altText: z.string().max(300).optional(),
  caption: z.string().max(500).optional(),
  description: z.string().max(1000).optional(),
})

export async function updateMediaAction(input: z.infer<typeof metaSchema>) {
  await requireUser()
  const parsed = metaSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: 'Invalid input' }

  const { id, ...data } = parsed.data
  await db.media.update({ where: { id }, data })
  revalidatePath('/admin/media')
  return { ok: true as const }
}

/** Read-only: powers the confirmation dialog before a destructive delete. */
export async function getMediaReferencesAction(mediaId: string) {
  await requireUser()
  return findMediaReferences(mediaId)
}

export async function deleteMediaAction(mediaId: string, force = false) {
  const user = await requireUser()

  const refs = await findMediaReferences(mediaId)
  if (refs.length > 0 && !force) {
    return { ok: false as const, error: 'IN_USE', references: refs }
  }

  const media = await db.media.findUnique({ where: { id: mediaId } })
  await deleteMedia(mediaId)
  await logActivity({
    userId: user.id,
    action: 'DELETE',
    entityType: 'media',
    entityId: mediaId,
    summary: `Deleted media "${media?.originalFilename ?? mediaId}"${refs.length ? ` (was used in ${refs.length} place${refs.length === 1 ? '' : 's'})` : ''}`,
  })
  revalidatePath('/admin/media')
  return { ok: true as const }
}
