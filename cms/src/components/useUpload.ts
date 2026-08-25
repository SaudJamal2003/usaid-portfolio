'use client'

import { useCallback, useRef, useState } from 'react'
import { createUploadUrlAction, finalizeUploadAction, replaceMediaAction } from '@/app/admin/media/actions'
import { checkUpload } from '@/lib/upload-policy'

export type UploadItem = {
  id: string
  name: string
  size: number
  progress: number
  status: 'uploading' | 'processing' | 'done' | 'error'
  error?: string
  mediaId?: string
}

/**
 * Presign → PUT → finalize.
 *
 * fetch() cannot report upload progress, so the transfer itself goes through
 * XHR. That is the only reason this is not a plain async function.
 */
function put(url: string, file: File, onProgress: (fraction: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open('PUT', url)
    request.setRequestHeader('Content-Type', file.type)
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total)
    }
    request.onload = () =>
      request.status >= 200 && request.status < 300
        ? resolve()
        : reject(new Error(`Storage rejected the upload (${request.status})`))
    request.onerror = () => reject(new Error('Could not reach storage.'))
    request.onabort = () => reject(new Error('Upload cancelled.'))
    request.send(file)
  })
}

export function useUpload(onComplete?: (mediaId: string) => void) {
  const [items, setItems] = useState<UploadItem[]>([])
  const counter = useRef(0)

  const patch = useCallback((id: string, changes: Partial<UploadItem>) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...changes } : item)))
  }, [])

  const clearFinished = useCallback(() => {
    setItems((current) => current.filter((item) => item.status !== 'done'))
  }, [])

  /** @param replaceMediaId swap the bytes behind an existing row instead of creating one */
  const upload = useCallback(
    async (file: File, replaceMediaId?: string) => {
      const id = `u${(counter.current += 1)}`
      setItems((current) => [
        ...current,
        { id, name: file.name, size: file.size, progress: 0, status: 'uploading' },
      ])

      // Fail fast on the obvious cases; the server re-checks regardless.
      const local = checkUpload(file.type, file.size)
      if (!local.ok) {
        patch(id, { status: 'error', error: local.error })
        return { ok: false as const, error: local.error }
      }

      try {
        const signed = await createUploadUrlAction(file.name, file.type, file.size)
        if (!signed.ok) {
          patch(id, { status: 'error', error: signed.error })
          return { ok: false as const, error: signed.error }
        }

        await put(signed.url, file, (fraction) => patch(id, { progress: Math.round(fraction * 95) }))

        // Renditions are derived server-side after the bytes land, so there is a
        // real gap between "transferred" and "usable".
        patch(id, { progress: 97, status: 'processing' })

        const result = replaceMediaId
          ? await replaceMediaAction({
              mediaId: replaceMediaId,
              key: signed.key,
              filename: file.name,
              mimeType: file.type,
              size: file.size,
            })
          : await finalizeUploadAction({
              key: signed.key,
              filename: file.name,
              mimeType: file.type,
              size: file.size,
            })

        if (!result.ok) {
          patch(id, { status: 'error', error: result.error })
          return { ok: false as const, error: result.error }
        }

        const mediaId = 'id' in result ? (result.id as string) : replaceMediaId!
        patch(id, { progress: 100, status: 'done', mediaId })
        onComplete?.(mediaId)
        return { ok: true as const, id: mediaId }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Upload failed.'
        patch(id, { status: 'error', error: message })
        return { ok: false as const, error: message }
      }
    },
    [onComplete, patch],
  )

  return { items, upload, clearFinished }
}
