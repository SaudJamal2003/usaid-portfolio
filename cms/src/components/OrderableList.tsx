'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { Card, StatusBadge } from './ui'

export type OrderableRow = {
  id: string
  href: string
  primary: string
  secondary?: string
  /** Right-aligned note, e.g. "featured" or a warning. */
  meta?: { text: string; tone?: 'muted' | 'warn' }
  status?: string
  thumbUrl?: string | null
}

/**
 * List and ordering in one control, for the short ordered collections
 * (services, testimonials). Drag plus arrow buttons, because reordering must
 * not be mouse-only (§53). The reorder call is injected so this stays free of
 * any one module's server actions.
 */
export function OrderableList({
  rows,
  onReorder,
}: {
  rows: OrderableRow[]
  onReorder: (orderedIds: string[]) => Promise<{ ok: boolean }>
}) {
  const [items, setItems] = useState(rows)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [pending, startTransition] = useTransition()

  function persist(next: OrderableRow[]) {
    setItems(next)
    startTransition(async () => {
      await onReorder(next.map((row) => row.id))
    })
  }

  function move(index: number, delta: number) {
    const target = index + delta
    if (target < 0 || target >= items.length) return
    const next = [...items]
    ;[next[index], next[target]] = [next[target], next[index]]
    persist(next)
  }

  function drop(index: number) {
    if (dragIndex === null || dragIndex === index) return
    const next = [...items]
    const [moved] = next.splice(dragIndex, 1)
    next.splice(index, 0, moved)
    setDragIndex(null)
    persist(next)
  }

  return (
    <div>
      {pending && <p className="mb-2 text-xs text-faint">Saving order…</p>}

      <div className="flex flex-col gap-2">
        {items.map((row, index) => (
          <Card
            key={row.id}
            draggable
            onDragStart={() => setDragIndex(index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => drop(index)}
            className={`flex items-center gap-3 p-3 ${dragIndex === index ? 'opacity-50' : ''}`}
          >
            <span className="cursor-grab select-none text-faint" aria-hidden="true">
              ⠿
            </span>

            {row.thumbUrl !== undefined && (
              row.thumbUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={row.thumbUrl} alt="" className="size-9 shrink-0 rounded-full object-cover" />
              ) : (
                <span className="size-9 shrink-0 rounded-full border border-dashed border-line-strong" />
              )
            )}

            <div className="min-w-0 flex-1">
              <Link href={row.href} className="font-medium text-ink hover:underline">
                {row.primary}
              </Link>
              {row.secondary && <p className="truncate text-xs text-muted">{row.secondary}</p>}
            </div>

            {row.meta && (
              <span
                className={`shrink-0 text-xs ${row.meta.tone === 'warn' ? 'text-warn' : 'text-muted'}`}
              >
                {row.meta.text}
              </span>
            )}

            {row.status && <StatusBadge status={row.status} />}

            <div className="flex shrink-0">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                aria-label={`Move ${row.primary} up`}
                className="rounded px-1.5 text-muted hover:text-ink disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === items.length - 1}
                aria-label={`Move ${row.primary} down`}
                className="rounded px-1.5 text-muted hover:text-ink disabled:opacity-30"
              >
                ↓
              </button>
            </div>

            <Link href={row.href} className="shrink-0 text-sm font-medium text-ink hover:underline">
              Edit
            </Link>
          </Card>
        ))}
      </div>
    </div>
  )
}
