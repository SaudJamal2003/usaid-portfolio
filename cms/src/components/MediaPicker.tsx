'use client'

import { useCallback, useEffect, useState } from 'react'
import type { MediaDetail } from '@/lib/media'
import { formatBytes } from '@/lib/upload-policy'
import { useUpload } from './useUpload'
import { UploadDropzone } from './UploadDropzone'
import { Alert, Button, Input, Select } from './ui'

/**
 * The one media selector. Every image field in the CMS uses it — case studies,
 * projects, homepage, experience, testimonials, services, SEO — so behaviour
 * stays identical everywhere and new content types get it for free.
 *
 * Both paths the brief asks for: choose something existing, or upload and have
 * it immediately selectable.
 */
export function MediaPicker({
  value,
  onChange,
  label = 'Image',
  accept,
  multiple = false,
  kind,
}: {
  value?: string | string[]
  onChange: (id: string | string[]) => void
  label?: string
  accept?: string
  multiple?: boolean
  /** Restricts the browse filter, e.g. 'video' for a video field. */
  kind?: 'image' | 'video' | 'document'
}) {
  const [open, setOpen] = useState(false)
  const [library, setLibrary] = useState<MediaDetail[]>([])
  const [preview, setPreview] = useState<MediaDetail[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('newest')

  const selectedIds = Array.isArray(value) ? value : value ? [value] : []
  const key = selectedIds.join(',')

  const loadLibrary = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ q: query, sort, perPage: '60' })
      if (kind) params.set('kind', kind)
      const response = await fetch(`/api/admin/media?${params}`)
      if (!response.ok) throw new Error()
      setLibrary((await response.json()).media)
    } catch {
      setError('Could not load the media library.')
    } finally {
      setLoading(false)
    }
  }, [query, sort, kind])

  useEffect(() => {
    if (open) void loadLibrary()
  }, [open, loadLibrary])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  /* Resolved by id rather than read out of the browse list, so the current
     selection still previews when it is archived or on another page. */
  useEffect(() => {
    if (!key) {
      setPreview([])
      return
    }
    let cancelled = false
    fetch(`/api/admin/media?ids=${key}`)
      .then((r) => r.json())
      .then((data) => !cancelled && setPreview(data.media ?? []))
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [key])

  const { items: uploads, upload, clearFinished } = useUpload()

  async function onFiles(files: File[]) {
    const uploaded: string[] = []
    for (const file of files) {
      const result = await upload(file)
      if (result.ok) uploaded.push(result.id)
    }
    if (uploaded.length === 0) return

    await loadLibrary()
    // Immediately selectable, as the brief requires.
    if (multiple) {
      onChange([...selectedIds, ...uploaded])
    } else {
      onChange(uploaded[0])
      setOpen(false)
    }
  }

  function choose(media: MediaDetail) {
    if (multiple) {
      onChange(
        selectedIds.includes(media.id)
          ? selectedIds.filter((id) => id !== media.id)
          : [...selectedIds, media.id],
      )
    } else {
      onChange(media.id)
      setOpen(false)
    }
  }

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-ink-soft">{label}</span>

      {preview.length > 0 ? (
        <div className="mb-2 flex flex-wrap gap-2">
          {preview.map((media) => (
            <div key={media.id} className="relative">
              {media.kind === 'image' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={media.thumbUrl}
                  alt={media.alt}
                  className="size-24 rounded-lg border border-line object-cover"
                />
              ) : (
                <span className="grid size-24 place-items-center rounded-lg border border-line bg-surface text-xs text-muted">
                  {media.extension}
                </span>
              )}
              <button
                type="button"
                onClick={() => onChange(multiple ? selectedIds.filter((id) => id !== media.id) : '')}
                aria-label={`Remove ${media.name}`}
                className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full border border-line bg-raised text-xs text-muted hover:text-danger"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="mb-2 grid size-24 place-items-center rounded-lg border border-dashed border-line-strong text-xs text-faint">
          None
        </div>
      )}

      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        {preview.length ? 'Change' : 'Choose or upload'}
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Media library"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="flex max-h-[88vh] w-full max-w-3xl flex-col rounded-xl border border-line bg-raised">
            <div className="flex items-center gap-2 border-b border-line p-4">
              <Input
                autoFocus
                placeholder="Search media…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1"
              />
              <Select value={sort} onChange={(e) => setSort(e.target.value)} className="w-auto">
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="name">Name</option>
              </Select>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>

            <div className="border-b border-line p-4">
              <UploadDropzone compact onFiles={onFiles} items={uploads} onClear={clearFinished} accept={accept} />
            </div>

            {error && (
              <div className="p-4">
                <Alert tone="error">
                  {error}{' '}
                  <button type="button" onClick={loadLibrary} className="font-medium underline">
                    Retry
                  </button>
                </Alert>
              </div>
            )}

            <div className="grid flex-1 grid-cols-3 gap-3 overflow-y-auto p-4 sm:grid-cols-4 md:grid-cols-5">
              {loading &&
                Array.from({ length: 10 }).map((_, index) => (
                  <div key={index} className="aspect-square animate-pulse rounded-lg bg-surface" />
                ))}

              {!loading && library.length === 0 && (
                <p className="col-span-full py-10 text-center text-sm text-muted">
                  {query ? 'Nothing matches that search.' : 'No media yet — upload something above.'}
                </p>
              )}

              {!loading &&
                library.map((media) => {
                  const active = selectedIds.includes(media.id)
                  return (
                    <button
                      key={media.id}
                      type="button"
                      onClick={() => choose(media)}
                      aria-pressed={active}
                      title={`${media.name} · ${formatBytes(media.size)}`}
                      className={`overflow-hidden rounded-lg border-2 transition-colors ${
                        active ? 'border-accent-deep' : 'border-transparent hover:border-line-strong'
                      }`}
                    >
                      {media.kind === 'image' ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={media.thumbUrl} alt={media.alt} className="aspect-square w-full object-cover" />
                      ) : (
                        <span className="grid aspect-square w-full place-items-center bg-surface text-[11px] font-medium text-muted">
                          {media.extension}
                        </span>
                      )}
                    </button>
                  )
                })}
            </div>

            {multiple && (
              <div className="flex justify-end border-t border-line p-3">
                <Button type="button" onClick={() => setOpen(false)}>
                  Done ({selectedIds.length})
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
