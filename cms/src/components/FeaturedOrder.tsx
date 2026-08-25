'use client'

import { useState, useTransition } from 'react'
import { reorderProjects } from '@/app/admin/projects/actions'
import { Card } from './ui'

export type OrderableProject = { id: string; title: string; status: string }

/**
 * Ordering for the homepage's featured work.
 *
 * The homepage does not store its own copy of any project — it reads Project
 * rows in this order (§11). Drag plus arrow buttons, because reordering must
 * not be mouse-only (§53).
 */
export function FeaturedOrder({ projects }: { projects: OrderableProject[] }) {
  const [items, setItems] = useState(projects)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [pending, startTransition] = useTransition()

  function persist(next: OrderableProject[]) {
    setItems(next)
    startTransition(async () => {
      await reorderProjects(next.map((item) => item.id))
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

  if (items.length === 0) {
    return (
      <Card className="mb-6 p-4">
        <h2 className="text-sm font-semibold text-ink">Featured work order</h2>
        <p className="mt-1 text-sm text-muted">
          Nothing is featured yet. Mark a project as featured and it will appear here, and on the
          homepage.
        </p>
      </Card>
    )
  }

  return (
    <Card className="mb-6 p-4">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-ink">Featured work order</h2>
          <p className="text-xs text-muted">The order these appear in on the homepage.</p>
        </div>
        {pending && <span className="text-xs text-faint">Saving…</span>}
      </div>

      <ol className="flex flex-col gap-1">
        {items.map((project, index) => (
          <li
            key={project.id}
            draggable
            onDragStart={() => setDragIndex(index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => drop(index)}
            className={`flex items-center gap-2 rounded-lg border border-line px-3 py-2 ${
              dragIndex === index ? 'opacity-50' : ''
            }`}
          >
            <span className="cursor-grab select-none text-faint" aria-hidden="true">
              ⠿
            </span>
            <span className="w-5 shrink-0 text-xs text-faint">{index + 1}</span>
            <span className="flex-1 truncate text-sm text-ink">{project.title}</span>
            {project.status !== 'PUBLISHED' && (
              <span className="shrink-0 text-xs text-warn">{project.status.toLowerCase()}</span>
            )}
            <button
              type="button"
              onClick={() => move(index, -1)}
              disabled={index === 0}
              aria-label={`Move ${project.title} up`}
              className="rounded px-1.5 text-muted hover:text-ink disabled:opacity-30"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => move(index, 1)}
              disabled={index === items.length - 1}
              aria-label={`Move ${project.title} down`}
              className="rounded px-1.5 text-muted hover:text-ink disabled:opacity-30"
            >
              ↓
            </button>
          </li>
        ))}
      </ol>
    </Card>
  )
}
