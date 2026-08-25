'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  addNavigationItem,
  deleteNavigationItem,
  saveNavigation,
} from '@/app/admin/navigation/actions'
import { Alert, Button, Card, Input } from './ui'

export type NavItem = {
  id: string
  label: string
  url: string
  openInNewTab: boolean
  visible: boolean
}

const REQUIRED = [
  { url: '#home', label: 'Home' },
  { url: '#work', label: 'Work' },
  { url: '#/about', label: 'About' },
]

export function NavigationEditor({ initial }: { initial: NavItem[] }) {
  const router = useRouter()
  const [items, setItems] = useState(initial)
  const [dirty, setDirty] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [message, setMessage] = useState<{ tone: 'info' | 'error'; text: string } | null>(null)
  const [pending, startTransition] = useTransition()

  function update(index: number, patch: Partial<NavItem>) {
    setDirty(true)
    setItems((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  function move(index: number, delta: number) {
    const target = index + delta
    if (target < 0 || target >= items.length) return
    const next = [...items]
    ;[next[index], next[target]] = [next[target], next[index]]
    setDirty(true)
    setItems(next)
  }

  function drop(index: number) {
    if (dragIndex === null || dragIndex === index) return
    const next = [...items]
    const [moved] = next.splice(dragIndex, 1)
    next.splice(index, 0, moved)
    setDragIndex(null)
    setDirty(true)
    setItems(next)
  }

  /* A nav that no longer reaches a section is a broken site. Warn rather than
     forbid: the owner may be mid-edit, or may genuinely be restructuring. */
  const missing = REQUIRED.filter(
    (route) => !items.some((item) => item.visible && item.url.trim() === route.url),
  )

  return (
    <div>
      {missing.length > 0 && (
        <div className="mb-4">
          <Alert tone="warn">
            Nothing visible links to{' '}
            {missing.map((route) => `${route.label} (${route.url})`).join(', ')}. Those sections of
            the portfolio will still exist, but visitors will have no way to reach them from the bar.
          </Alert>
        </div>
      )}

      {message && (
        <div className="mb-4">
          <Alert tone={message.tone === 'error' ? 'error' : 'info'}>{message.text}</Alert>
        </div>
      )}

      <div className="mb-3 flex flex-col gap-2">
        {items.map((item, index) => (
          <Card
            key={item.id}
            draggable
            onDragStart={() => setDragIndex(index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => drop(index)}
            className={`p-3 ${dragIndex === index ? 'opacity-50' : ''}`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="cursor-grab select-none text-faint" aria-hidden="true">
                ⠿
              </span>

              <Input
                aria-label={`Label for item ${index + 1}`}
                value={item.label}
                placeholder="Label"
                className="w-36"
                onChange={(e) => update(index, { label: e.target.value })}
              />
              <Input
                aria-label={`URL for item ${index + 1}`}
                value={item.url}
                placeholder="#section or https://…"
                className="min-w-40 flex-1"
                onChange={(e) => update(index, { url: e.target.value })}
              />

              <label className="flex items-center gap-1.5 whitespace-nowrap text-xs text-ink-soft">
                <input
                  type="checkbox"
                  checked={item.visible}
                  onChange={(e) => update(index, { visible: e.target.checked })}
                  className="size-4 accent-[color:var(--color-accent-deep)]"
                />
                Visible
              </label>
              <label className="flex items-center gap-1.5 whitespace-nowrap text-xs text-ink-soft">
                <input
                  type="checkbox"
                  checked={item.openInNewTab}
                  onChange={(e) => update(index, { openInNewTab: e.target.checked })}
                  className="size-4 accent-[color:var(--color-accent-deep)]"
                />
                New tab
              </label>

              <div className="flex">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label={`Move ${item.label} up`}
                  className="rounded px-1.5 text-muted hover:text-ink disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === items.length - 1}
                  aria-label={`Move ${item.label} down`}
                  className="rounded px-1.5 text-muted hover:text-ink disabled:opacity-30"
                >
                  ↓
                </button>
              </div>

              <button
                type="button"
                aria-label={`Remove ${item.label}`}
                className="rounded px-1.5 text-muted hover:text-danger"
                onClick={() => {
                  if (!window.confirm(`Remove "${item.label}" from the navigation?`)) return
                  startTransition(async () => {
                    await deleteNavigationItem(item.id)
                    setItems((current) => current.filter((row) => row.id !== item.id))
                    router.refresh()
                  })
                }}
              >
                ×
              </button>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await addNavigationItem()
              router.refresh()
            })
          }
        >
          + Add link
        </Button>
        <Button
          type="button"
          disabled={pending || !dirty}
          onClick={() => {
            setMessage(null)
            startTransition(async () => {
              const result = await saveNavigation(items)
              if (!result.ok) return setMessage({ tone: 'error', text: result.error })
              setDirty(false)
              setMessage({ tone: 'info', text: 'Saved.' })
              router.refresh()
            })
          }}
        >
          {dirty ? 'Save changes' : 'Saved'}
        </Button>
      </div>
    </div>
  )
}
