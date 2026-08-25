'use client'

import { useRef, useState } from 'react'
import type { UploadItem } from './useUpload'
import { SIZE_LIMITS, formatBytes } from '@/lib/upload-policy'
import { Alert, Button } from './ui'

/* Shared by the library screen and the picker so upload behaves identically in
   both places (§20: reusable components, not per-screen reimplementations). */
export function UploadDropzone({
  onFiles,
  items,
  onClear,
  accept,
  compact = false,
}: {
  onFiles: (files: File[]) => void
  items: UploadItem[]
  onClear?: () => void
  accept?: string
  compact?: boolean
}) {
  const input = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const active = items.filter((item) => item.status !== 'done')
  const failed = items.filter((item) => item.status === 'error')

  function handle(files: FileList | null) {
    if (files?.length) onFiles(Array.from(files))
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          handle(e.dataTransfer.files)
        }}
        className={`rounded-xl border border-dashed text-center transition-colors ${
          compact ? 'px-4 py-4' : 'px-6 py-8'
        } ${dragging ? 'border-accent-deep bg-accent/5' : 'border-line-strong bg-raised'}`}
      >
        <p className="text-sm text-ink-soft">
          Drag files here, or{' '}
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="font-medium text-accent-deep underline underline-offset-2"
          >
            browse
          </button>
        </p>
        {!compact && (
          <p className="mt-1 text-xs text-faint">
            Images up to {formatBytes(SIZE_LIMITS.image)} · Video up to {formatBytes(SIZE_LIMITS.video)} ·
            PDF up to {formatBytes(SIZE_LIMITS.document)}
          </p>
        )}
        <input
          ref={input}
          type="file"
          multiple
          accept={accept}
          className="sr-only"
          onChange={(e) => {
            handle(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      {items.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2">
          {items.map((item) => (
            <li key={item.id} className="rounded-lg border border-line bg-raised px-3 py-2">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate text-ink-soft">{item.name}</span>
                <span className="shrink-0 text-xs text-faint">
                  {item.status === 'error'
                    ? 'Failed'
                    : item.status === 'done'
                      ? 'Done'
                      : item.status === 'processing'
                        ? 'Processing…'
                        : `${item.progress}%`}
                </span>
              </div>

              {item.status !== 'error' && (
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-surface">
                  <div
                    className={`h-full rounded-full transition-[width] duration-200 ${
                      item.status === 'done' ? 'bg-ok' : 'bg-accent-deep'
                    }`}
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              )}

              {item.error && <p className="mt-1 text-xs text-danger">{item.error}</p>}
            </li>
          ))}
        </ul>
      )}

      {failed.length > 0 && (
        <div className="mt-2">
          <Alert tone="error">
            {failed.length} upload{failed.length === 1 ? '' : 's'} failed. Nothing else was affected.
          </Alert>
        </div>
      )}

      {onClear && items.length > 0 && active.length === 0 && (
        <Button type="button" variant="ghost" className="mt-2" onClick={onClear}>
          Clear finished
        </Button>
      )}
    </div>
  )
}
