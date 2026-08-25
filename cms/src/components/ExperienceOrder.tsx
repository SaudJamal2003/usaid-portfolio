'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { reorderExperience } from '@/app/admin/experience/actions'
import { Card, StatusBadge } from './ui'

export type ExperienceRow = {
  id: string
  company: string
  role: string
  period: string
  highlightCount: number
  hasPlaceholder: boolean
  status: string
}

/* The list is also the ordering control: a timeline is short and inherently
   ordered, so a separate reorder panel would be redundant. Drag plus arrows,
   because reordering must not be mouse-only (§53). */
export function ExperienceOrder({ items }: { items: ExperienceRow[] }) {
  const [rows, setRows] = useState(items)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [pending, startTransition] = useTransition()

  function persist(next: ExperienceRow[]) {
    setRows(next)
    startTransition(async () => {
      await reorderExperience(next.map((row) => row.id))
    })
  }

  function move(index: number, delta: number) {
    const target = index + delta
    if (target < 0 || target >= rows.length) return
    const next = [...rows]
    ;[next[index], next[target]] = [next[target], next[index]]
    persist(next)
  }

  function drop(index: number) {
    if (dragIndex === null || dragIndex === index) return
    const next = [...rows]
    const [moved] = next.splice(dragIndex, 1)
    next.splice(index, 0, moved)
    setDragIndex(null)
    persist(next)
  }

  return (
    <div>
      {pending && <p className="mb-2 text-xs text-faint">Saving order…</p>}

      <div className="flex flex-col gap-2">
        {rows.map((row, index) => (
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

            <div className="min-w-0 flex-1">
              <Link href={`/admin/experience/${row.id}`} className="font-medium text-ink hover:underline">
                {row.company}
              </Link>
              <p className="truncate text-xs text-muted">
                {row.role || <span className="text-warn">No role title</span>} · {row.period}
              </p>
            </div>

            <span className="shrink-0 text-xs text-muted">
              {row.hasPlaceholder ? (
                <span className="text-warn">placeholder bullets</span>
              ) : row.highlightCount === 0 ? (
                <span className="text-warn">no highlights</span>
              ) : (
                `${row.highlightCount} highlight${row.highlightCount === 1 ? '' : 's'}`
              )}
            </span>

            <StatusBadge status={row.status} />

            <div className="flex shrink-0">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                aria-label={`Move ${row.company} up`}
                className="rounded px-1.5 text-muted hover:text-ink disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === rows.length - 1}
                aria-label={`Move ${row.company} down`}
                className="rounded px-1.5 text-muted hover:text-ink disabled:opacity-30"
              >
                ↓
              </button>
            </div>

            <Link
              href={`/admin/experience/${row.id}`}
              className="shrink-0 text-sm font-medium text-ink hover:underline"
            >
              Edit
            </Link>
          </Card>
        ))}
      </div>
    </div>
  )
}
