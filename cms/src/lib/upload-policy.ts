/**
 * What may be uploaded, and how big.
 *
 * Shared by the browser and the server. The browser copy exists only to fail
 * fast with a good message — the server re-checks everything, because anything
 * the client asserts is attacker-controlled.
 */

/* Allow-list, not a block-list: anything unnamed is rejected, which is what
   keeps executables out (§50). */
export const ALLOWED_TYPES: Record<string, { ext: string; kind: 'image' | 'video' | 'document' }> = {
  'image/png': { ext: '.png', kind: 'image' },
  'image/jpeg': { ext: '.jpg', kind: 'image' },
  'image/webp': { ext: '.webp', kind: 'image' },
  'image/avif': { ext: '.avif', kind: 'image' },
  'image/gif': { ext: '.gif', kind: 'image' },
  'image/svg+xml': { ext: '.svg', kind: 'image' },
  'video/mp4': { ext: '.mp4', kind: 'video' },
  'video/webm': { ext: '.webm', kind: 'video' },
  'application/pdf': { ext: '.pdf', kind: 'document' },
}

/**
 * Per-kind ceilings. Video is generous because the existing
 * shukar-hai-recording.mp4 is ~99 MB and has to fit.
 *
 * These are only reachable because large files never pass through the Next
 * process: the browser PUTs straight to MinIO with a presigned URL, so the
 * limit is a policy decision rather than a memory constraint.
 */
export const SIZE_LIMITS: Record<'image' | 'video' | 'document', number> = {
  image: 25 * 1024 * 1024, //  25 MB
  video: 500 * 1024 * 1024, // 500 MB
  document: 50 * 1024 * 1024, //  50 MB
}

/** Above this, the server does not download the object to derive renditions.
 *  A huge original would mean pulling it back out of MinIO just to resize. */
export const RENDITION_MAX_BYTES = 25 * 1024 * 1024

export function kindOf(mimeType: string) {
  return ALLOWED_TYPES[mimeType]?.kind
}

export type UploadCheck = { ok: true } | { ok: false; error: string }

export function checkUpload(mimeType: string, size: number): UploadCheck {
  const allowed = ALLOWED_TYPES[mimeType]
  if (!allowed) {
    return { ok: false, error: `Unsupported file type${mimeType ? `: ${mimeType}` : ''}.` }
  }
  if (size <= 0) return { ok: false, error: 'That file is empty.' }

  const limit = SIZE_LIMITS[allowed.kind]
  if (size > limit) {
    return {
      ok: false,
      error: `${allowed.kind === 'video' ? 'Videos' : allowed.kind === 'image' ? 'Images' : 'Documents'} must be ${formatBytes(limit)} or smaller. That file is ${formatBytes(size)}.`,
    }
  }
  return { ok: true }
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  const mb = bytes / 1024 / 1024
  return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`
}
