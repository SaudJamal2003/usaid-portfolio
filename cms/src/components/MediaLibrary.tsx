'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import type { MediaDetail } from '@/lib/media'
import { formatBytes } from '@/lib/upload-policy'
import {
  archiveMediaAction,
  deleteMediaAction,
  getMediaReferencesAction,
  updateMediaAction,
} from '@/app/admin/media/actions'
import { useUpload } from './useUpload'
import { UploadDropzone } from './UploadDropzone'
import { Alert, Button, Card, EmptyState, Field, Input, Select, Textarea } from './ui'

type Query = { q: string; kind: string; sort: string; archived: boolean; page: number }

const PER_PAGE = 24

function Thumb({ media, className = '' }: { media: MediaDetail; className?: string }) {
  if (media.kind === 'image') {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={media.thumbUrl} alt={media.alt} className={`object-cover ${className}`} />
  }
  return (
    <span className={`grid place-items-center bg-surface text-xs font-medium text-muted ${className}`}>
      {media.extension}
    </span>
  )
}

export function MediaLibrary() {
  const [query, setQuery] = useState<Query>({ q: '', kind: '', sort: 'newest', archived: false, page: 1 })
  const [items, setItems] = useState<MediaDetail[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<MediaDetail | null>(null)

  const load = useCallback(async (next: Query) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        q: next.q,
        kind: next.kind,
        sort: next.sort,
        archived: String(next.archived),
        page: String(next.page),
        perPage: String(PER_PAGE),
      })
      const response = await fetch(`/api/admin/media?${params}`)
      if (!response.ok) throw new Error(`Request failed (${response.status})`)
      const data = await response.json()
      setItems(data.media)
      setTotal(data.total)
      setPages(data.pages)
    } catch {
      setError('Could not load the media library. Check that the CMS can reach the database, then retry.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load(query)
  }, [load, query])

  const { items: uploads, upload, clearFinished } = useUpload()
  const refresh = () => load(query)

  async function onFiles(files: File[]) {
    // Sequential rather than parallel: several 100 MB videos at once would
    // saturate the connection and make every progress bar useless.
    for (const file of files) await upload(file)
    refresh()
  }

  const filtered = Boolean(query.q || query.kind || query.archived)

  return (
    <>
      <Card className="mb-5 p-4">
        <UploadDropzone onFiles={onFiles} items={uploads} onClear={clearFinished} />
      </Card>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input
          value={query.q}
          placeholder="Search filename, alt text or caption…"
          className="w-full sm:max-w-xs"
          onChange={(e) => setQuery((q) => ({ ...q, q: e.target.value, page: 1 }))}
        />
        <Select
          value={query.kind}
          className="w-auto"
          onChange={(e) => setQuery((q) => ({ ...q, kind: e.target.value, page: 1 }))}
        >
          <option value="">All types</option>
          <option value="image">Images</option>
          <option value="video">Video</option>
          <option value="document">Documents</option>
        </Select>
        <Select
          value={query.sort}
          className="w-auto"
          onChange={(e) => setQuery((q) => ({ ...q, sort: e.target.value, page: 1 }))}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="largest">Largest first</option>
          <option value="name">Filename A–Z</option>
        </Select>
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input
            type="checkbox"
            checked={query.archived}
            onChange={(e) => setQuery((q) => ({ ...q, archived: e.target.checked, page: 1 }))}
            className="size-4 accent-[color:var(--color-accent-deep)]"
          />
          Include archived
        </label>
        {filtered && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => setQuery({ q: '', kind: '', sort: 'newest', archived: false, page: 1 })}
          >
            Clear
          </Button>
        )}
      </div>

      {error && (
        <div className="mb-4">
          <Alert tone="error">
            {error}{' '}
            <button type="button" onClick={refresh} className="font-medium underline underline-offset-2">
              Retry
            </button>
          </Alert>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="aspect-square rounded-lg bg-surface" />
              <div className="mt-2 h-3 w-3/4 rounded bg-surface" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        filtered ? (
          <EmptyState
            title="Nothing matches those filters."
            description="Try a different search term, or clear the filters to see everything."
          />
        ) : (
          <EmptyState
            title="No media yet."
            description="Upload an image or video above and it will be available to every content type."
          />
        )
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {items.map((media) => (
              <button
                key={media.id}
                type="button"
                onClick={() => setSelected(media)}
                className="group text-left"
              >
                <span
                  className={`relative block overflow-hidden rounded-lg border border-line bg-raised transition-colors group-hover:border-line-strong ${
                    media.archived ? 'opacity-50' : ''
                  }`}
                >
                  <Thumb media={media} className="aspect-square w-full" />
                  {media.archived && (
                    <span className="absolute left-1.5 top-1.5 rounded bg-ink/80 px-1.5 py-0.5 text-[10px] font-medium text-white">
                      Archived
                    </span>
                  )}
                  {!media.alt && !media.archived && media.kind === 'image' && (
                    <span
                      title="No alt text"
                      className="absolute right-1.5 top-1.5 rounded bg-warn-bg px-1.5 py-0.5 text-[10px] font-medium text-warn"
                    >
                      No alt
                    </span>
                  )}
                </span>
                <span className="mt-1.5 block truncate text-xs font-medium text-ink">{media.name}</span>
                <span className="block text-[11px] text-faint">
                  {media.extension} · {formatBytes(media.size)}
                  {media.width ? ` · ${media.width}×${media.height}` : ''}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-muted">
            <span>
              {(query.page - 1) * PER_PAGE + 1}–{Math.min(query.page * PER_PAGE, total)} of {total}
            </span>
            {pages > 1 && (
              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={query.page <= 1}
                  onClick={() => setQuery((q) => ({ ...q, page: q.page - 1 }))}
                  className="disabled:opacity-40 hover:text-ink"
                >
                  Previous
                </button>
                <span className="text-faint">
                  {query.page} / {pages}
                </span>
                <button
                  type="button"
                  disabled={query.page >= pages}
                  onClick={() => setQuery((q) => ({ ...q, page: q.page + 1 }))}
                  className="disabled:opacity-40 hover:text-ink"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {selected && (
        <MediaDetailPanel
          media={selected}
          onClose={() => setSelected(null)}
          onChanged={() => {
            setSelected(null)
            refresh()
          }}
        />
      )}
    </>
  )
}

function MediaDetailPanel({
  media,
  onClose,
  onChanged,
}: {
  media: MediaDetail
  onClose: () => void
  onChanged: () => void
}) {
  const [form, setForm] = useState({
    displayName: media.displayName ?? '',
    altText: media.alt,
    caption: media.caption ?? '',
    description: media.description ?? '',
  })
  const [message, setMessage] = useState<{ tone: 'info' | 'error'; text: string } | null>(null)
  const [refs, setRefs] = useState<{ label: string; where: string }[] | null>(null)
  const [confirming, setConfirming] = useState<'archive' | 'delete' | null>(null)
  const [copied, setCopied] = useState(false)
  const [pending, startTransition] = useTransition()
  const replaceInput = useRef<HTMLInputElement>(null)

  const { items: uploads, upload } = useUpload()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // References drive both confirmation dialogs, so fetch them once on open.
  useEffect(() => {
    void getMediaReferencesAction(media.id).then(setRefs).catch(() => setRefs([]))
  }, [media.id])

  function save() {
    setMessage(null)
    startTransition(async () => {
      const result = await updateMediaAction({ id: media.id, ...form })
      setMessage(
        result.ok
          ? { tone: 'info', text: 'Saved.' }
          : { tone: 'error', text: result.error ?? 'Could not save.' },
      )
      if (result.ok) onChanged()
    })
  }

  function archive() {
    startTransition(async () => {
      await archiveMediaAction(media.id, !media.archived)
      onChanged()
    })
  }

  function destroy() {
    startTransition(async () => {
      const result = await deleteMediaAction(media.id, true)
      if (!result.ok) return setMessage({ tone: 'error', text: 'Could not delete this file.' })
      onChanged()
    })
  }

  const inUse = (refs?.length ?? 0) > 0

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/30"
      role="dialog"
      aria-modal="true"
      aria-label={`Details for ${media.name}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-line bg-raised">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 className="truncate text-sm font-semibold text-ink">{media.name}</h2>
          <Button type="button" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="flex flex-col gap-4 p-5">
          <div className="overflow-hidden rounded-lg border border-line">
            {media.kind === 'image' ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={media.mediumUrl} alt={media.alt} className="max-h-64 w-full object-contain bg-surface" />
            ) : media.kind === 'video' ? (
              <video src={media.url} controls className="max-h-64 w-full bg-black" />
            ) : (
              <a
                href={media.url}
                target="_blank"
                rel="noreferrer"
                className="grid h-32 place-items-center bg-surface text-sm text-accent-deep underline"
              >
                Open {media.extension}
              </a>
            )}
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
            {[
              ['Type', media.mimeType],
              ['Size', formatBytes(media.size)],
              ['Dimensions', media.width ? `${media.width} × ${media.height}` : '—'],
              ['Uploaded', new Date(media.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })],
              ['Filename', media.originalFilename],
              ['Status', media.archived ? 'Archived' : 'Active'],
            ].map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-faint">{label}</dt>
                <dd className="truncate text-ink-soft" title={String(value)}>
                  {value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                void navigator.clipboard.writeText(media.url).then(() => {
                  setCopied(true)
                  window.setTimeout(() => setCopied(false), 2000)
                })
              }}
            >
              {copied ? 'Copied' : 'Copy URL'}
            </Button>
            <a
              href={media.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center rounded-lg border border-line-strong px-3.5 text-sm font-medium hover:bg-surface"
            >
              View original
            </a>
            <Button type="button" variant="secondary" onClick={() => replaceInput.current?.click()}>
              Replace file
            </Button>
            <input
              ref={replaceInput}
              type="file"
              className="sr-only"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                e.target.value = ''
                if (!file) return
                // Replace keeps the media id, so every reference follows the
                // new bytes without any content needing to be re-pointed.
                const result = await upload(file, media.id)
                if (result.ok) onChanged()
              }}
            />
          </div>

          {uploads.length > 0 && (
            <UploadDropzone compact onFiles={() => {}} items={uploads} />
          )}

          {message && <Alert tone={message.tone === 'error' ? 'error' : 'info'}>{message.text}</Alert>}

          <div className="flex flex-col gap-3 border-t border-line pt-4">
            <Field label="Display name" hint="Shown in the CMS. The stored file is never renamed.">
              <Input
                value={form.displayName}
                onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
              />
            </Field>
            <Field label="Alt text" hint="Describes the image for screen readers.">
              <Input value={form.altText} onChange={(e) => setForm((f) => ({ ...f, altText: e.target.value }))} />
            </Field>
            <Field label="Caption">
              <Input value={form.caption} onChange={(e) => setForm((f) => ({ ...f, caption: e.target.value }))} />
            </Field>
            <Field label="Description">
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </Field>
            <Button type="button" onClick={save} disabled={pending} className="self-start">
              Save details
            </Button>
          </div>

          <div className="border-t border-line pt-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-faint">Used by</h3>
            {refs === null ? (
              <p className="text-sm text-muted">Checking…</p>
            ) : refs.length === 0 ? (
              <p className="text-sm text-muted">Not referenced anywhere.</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {refs.map((ref, index) => (
                  <li key={index} className="text-sm text-ink-soft">
                    {ref.label} <span className="text-faint">· {ref.where}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-wrap gap-2 border-t border-line pt-4">
            <Button type="button" variant="secondary" onClick={() => setConfirming('archive')} disabled={pending}>
              {media.archived ? 'Restore' : 'Archive'}
            </Button>
            <Button type="button" variant="danger" onClick={() => setConfirming('delete')} disabled={pending}>
              Delete permanently
            </Button>
          </div>
        </div>
      </div>

      {confirming && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.target === e.currentTarget && setConfirming(null)}
        >
          <Card className="w-full max-w-md p-5">
            {confirming === 'archive' ? (
              <>
                <h3 className="text-sm font-semibold text-ink">
                  {media.archived ? 'Restore this file?' : 'Archive this file?'}
                </h3>
                <p className="mt-1 text-sm text-muted">
                  {media.archived
                    ? 'It will appear in pickers again.'
                    : 'It stays exactly where it is and anything already using it keeps working — it just stops appearing in pickers.'}
                </p>
              </>
            ) : (
              <>
                <h3 className="text-sm font-semibold text-danger">Delete permanently?</h3>
                <p className="mt-1 text-sm text-muted">
                  The file and every derived size are removed from storage. This cannot be undone.
                </p>
                {inUse && (
                  <div className="mt-3 rounded-lg bg-danger-bg p-3">
                    <p className="text-sm font-medium text-danger">
                      This media is currently used by {refs!.length} item{refs!.length === 1 ? '' : 's'}:
                    </p>
                    <ul className="mt-1.5 flex flex-col gap-0.5">
                      {refs!.map((ref, index) => (
                        <li key={index} className="text-sm text-danger/90">
                          — {ref.label} <span className="opacity-70">({ref.where})</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-sm text-danger/90">
                      Deleting will leave those blank. Archive instead unless you are sure.
                    </p>
                  </div>
                )}
              </>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setConfirming(null)}>
                Cancel
              </Button>
              {confirming === 'delete' && inUse && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setConfirming(null)
                    archive()
                  }}
                >
                  Archive instead
                </Button>
              )}
              <Button
                type="button"
                variant={confirming === 'delete' ? 'danger' : 'primary'}
                onClick={() => {
                  setConfirming(null)
                  if (confirming === 'delete') destroy()
                  else archive()
                }}
              >
                {confirming === 'delete' ? 'Delete anyway' : media.archived ? 'Restore' : 'Archive'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
