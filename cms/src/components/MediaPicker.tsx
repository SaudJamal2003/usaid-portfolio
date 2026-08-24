'use client'

import { useEffect, useState, useTransition } from 'react'
import { uploadMediaAction } from '@/app/admin/media/actions'
import { Alert, Button, Input } from './ui'

export type PickerMedia = {
  id: string
  url: string
  thumbUrl: string
  alt: string
  mimeType: string
}

/* Every image field offers both paths (§22). The dialog is a plain overlay
   rather than a dependency; it traps nothing but does close on Escape and on
   backdrop click, which is the accessible minimum for this. */
export function MediaPicker({
  value,
  onChange,
  label = 'Image',
  accept = 'image/*',
  multiple = false,
}: {
  value?: string | string[]
  onChange: (id: string | string[]) => void
  label?: string
  accept?: string
  multiple?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [library, setLibrary] = useState<PickerMedia[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [pending, startTransition] = useTransition()

  const selectedIds = Array.isArray(value) ? value : value ? [value] : []

  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetch('/api/admin/media')
      .then((r) => r.json())
      .then((data) => setLibrary(data.media ?? []))
      .catch(() => setError('Could not load the media library.'))
      .finally(() => setLoading(false))
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const selected = library.filter((m) => selectedIds.includes(m.id))
  const [preview, setPreview] = useState<PickerMedia[]>([])

  // Keep a preview even before the library has been opened once.
  useEffect(() => {
    if (selectedIds.length === 0) return setPreview([])
    if (selected.length === selectedIds.length) return setPreview(selected)
    fetch(`/api/admin/media?ids=${selectedIds.join(',')}`)
      .then((r) => r.json())
      .then((data) => setPreview(data.media ?? []))
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, library])

  function choose(media: PickerMedia) {
    if (multiple) {
      const next = selectedIds.includes(media.id)
        ? selectedIds.filter((id) => id !== media.id)
        : [...selectedIds, media.id]
      onChange(next)
    } else {
      onChange(media.id)
      setOpen(false)
    }
  }

  function upload(file: File) {
    const data = new FormData()
    data.set('file', file)
    startTransition(async () => {
      const result = await uploadMediaAction(data)
      if (!result.ok) return setError(result.error)
      setError(null)
      const refreshed = await fetch('/api/admin/media').then((r) => r.json())
      setLibrary(refreshed.media ?? [])
      if (!multiple) {
        onChange(result.id)
        setOpen(false)
      } else {
        onChange([...selectedIds, result.id])
      }
    })
  }

  const filtered = query
    ? library.filter((m) => m.alt.toLowerCase().includes(query.toLowerCase()))
    : library

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-ink-soft">{label}</span>

      {preview.length > 0 ? (
        <div className="mb-2 flex flex-wrap gap-2">
          {preview.map((media) => (
            <div key={media.id} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={media.thumbUrl}
                alt={media.alt}
                className="size-24 rounded-lg border border-line object-cover"
              />
              <button
                type="button"
                onClick={() =>
                  onChange(multiple ? selectedIds.filter((id) => id !== media.id) : '')
                }
                aria-label={`Remove ${media.alt || 'image'}`}
                className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full border border-line bg-raised text-xs text-muted hover:text-danger"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="mb-2 grid h-24 w-24 place-items-center rounded-lg border border-dashed border-line-strong text-xs text-faint">
          None
        </div>
      )}

      <div className="flex gap-2">
        <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
          {preview.length ? 'Change' : 'Choose from library'}
        </Button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Media library"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-xl border border-line bg-raised">
            <div className="flex items-center gap-3 border-b border-line p-4">
              <Input
                autoFocus
                placeholder="Search by alt text…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1"
              />
              <label className="inline-flex h-9 cursor-pointer items-center rounded-lg border border-line-strong px-3.5 text-sm font-medium hover:bg-surface">
                {pending ? 'Uploading…' : 'Upload new'}
                <input
                  type="file"
                  accept={accept}
                  className="sr-only"
                  onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
                />
              </label>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>

            {error && (
              <div className="p-4">
                <Alert tone="error">{error}</Alert>
              </div>
            )}

            <div className="grid flex-1 grid-cols-3 gap-3 overflow-y-auto p-4 sm:grid-cols-4 md:grid-cols-5">
              {loading && <p className="col-span-full py-8 text-center text-sm text-muted">Loading…</p>}
              {!loading && filtered.length === 0 && (
                <p className="col-span-full py-8 text-center text-sm text-muted">
                  Nothing here yet. Upload a file to get started.
                </p>
              )}
              {filtered.map((media) => {
                const active = selectedIds.includes(media.id)
                return (
                  <button
                    key={media.id}
                    type="button"
                    onClick={() => choose(media)}
                    aria-pressed={active}
                    className={`overflow-hidden rounded-lg border-2 transition-colors ${
                      active ? 'border-accent-deep' : 'border-transparent hover:border-line-strong'
                    }`}
                  >
                    {media.mimeType.startsWith('image/') ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={media.thumbUrl} alt={media.alt} className="aspect-square w-full object-cover" />
                    ) : (
                      <span className="grid aspect-square w-full place-items-center bg-surface text-[10px] text-muted">
                        {media.mimeType.split('/')[1]}
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
