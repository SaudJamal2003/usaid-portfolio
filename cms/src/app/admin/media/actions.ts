'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { logActivity } from '@/lib/activity'
import {
  createUploadUrl,
  deleteMedia,
  finalizeUpload,
  findMediaReferences,
  replaceMedia,
  uploadMedia,
} from '@/lib/media'

/* Step 1 of the presigned flow. Validation happens here, server-side, before a
   signature is handed out — the browser's own check is only for fast feedback. */
export async function createUploadUrlAction(filename: string, mimeType: string, size: number) {
  await requireUser()
  return createUploadUrl(filename, mimeType, size)
}

/* Step 2: the bytes are already in MinIO; record them. */
export async function finalizeUploadAction(input: {
  key: string
  filename: string
  mimeType: string
  size: number
  altText?: string
}) {
  const user = await requireUser()
  const result = await finalizeUpload(input)
  if (!result.ok) return result

  await logActivity({
    userId: user.id,
    action: 'UPLOAD',
    entityType: 'media',
    entityId: result.id,
    summary: `Uploaded "${input.filename}"`,
  })
  revalidatePath('/admin/media')
  return result
}

/** Small direct upload, kept for anything that already holds a File on the
 *  server. The presigned path is what the browser uses. */
export async function uploadMediaAction(formData: FormData) {
  const user = await requireUser()

  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false as const, error: 'Choose a file to upload.' }
  }

  const result = await uploadMedia(file, (formData.get('altText') as string | null) ?? undefined)
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

export async function replaceMediaAction(input: {
  mediaId: string
  key: string
  filename: string
  mimeType: string
  size: number
}) {
  const user = await requireUser()
  const result = await replaceMedia(input.mediaId, input.key, input.filename, input.mimeType, input.size)
  if (!result.ok) return result

  await logActivity({
    userId: user.id,
    action: 'REPLACE',
    entityType: 'media',
    entityId: input.mediaId,
    summary: `Replaced the file behind "${input.filename}"`,
  })
  revalidatePath('/admin/media')
  return result
}

const metaSchema = z.object({
  id: z.string().cuid(),
  // The storage key is never touched: it is baked into every URL already
  // published, so renaming it would break live references.
  displayName: z.string().trim().max(200).optional(),
  altText: z.string().trim().max(300).optional(),
  caption: z.string().trim().max(500).optional(),
  description: z.string().trim().max(1000).optional(),
})

export async function updateMediaAction(input: z.infer<typeof metaSchema>) {
  const user = await requireUser()
  const parsed = metaSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message }

  const { id, ...data } = parsed.data
  const media = await db.media.update({
    where: { id },
    data: {
      displayName: data.displayName || null,
      altText: data.altText || null,
      caption: data.caption || null,
      description: data.description || null,
    },
  })

  await logActivity({
    userId: user.id,
    action: 'UPDATE',
    entityType: 'media',
    entityId: id,
    summary: `Updated details for "${media.displayName || media.originalFilename}"`,
  })
  revalidatePath('/admin/media')
  return { ok: true as const }
}

/** Read-only: powers the confirmation dialog. */
export async function getMediaReferencesAction(mediaId: string) {
  await requireUser()
  return findMediaReferences(mediaId)
}

/** Soft delete. Keeps the object and every row intact, so nothing referencing
 *  it can break; archived media just stops appearing in pickers. */
export async function archiveMediaAction(mediaId: string, archived: boolean) {
  const user = await requireUser()
  const media = await db.media.update({
    where: { id: mediaId },
    data: { archivedAt: archived ? new Date() : null },
  })
  await logActivity({
    userId: user.id,
    action: archived ? 'ARCHIVE' : 'RESTORE',
    entityType: 'media',
    entityId: mediaId,
    summary: `${archived ? 'Archived' : 'Restored'} "${media.displayName || media.originalFilename}"`,
  })
  revalidatePath('/admin/media')
  return { ok: true as const }
}

/**
 * Permanent. Refuses while anything still points at the asset unless the caller
 * explicitly forces it, and forcing is only reachable after the UI has shown
 * the reference list.
 */
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
    summary: `Deleted "${media?.displayName || media?.originalFilename || mediaId}"${
      refs.length ? ` (was used in ${refs.length} place${refs.length === 1 ? '' : 's'})` : ''
    }`,
  })
  revalidatePath('/admin/media')
  return { ok: true as const }
}
