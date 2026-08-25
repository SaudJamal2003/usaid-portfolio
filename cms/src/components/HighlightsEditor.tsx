'use client'

import { Button, Textarea } from './ui'

/**
 * The repeatable bullet list for one role.
 *
 * Multi-line rather than chips, because these are full sentences: "Led the
 * design and launch of QuickPass, now used across 500+ societies" is not a tag.
 */
export function HighlightsEditor({
  values,
  onChange,
}: {
  values: string[]
  onChange: (next: string[]) => void
}) {
  function update(index: number, value: string) {
    onChange(values.map((current, i) => (i === index ? value : current)))
  }

  function move(index: number, delta: number) {
    const target = index + delta
    if (target < 0 || target >= values.length) return
    const next = [...values]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-ink-soft">Highlights</span>
      <p className="mb-2 text-xs text-faint">
        Specific to this role. Nothing here is shared with any other entry.
      </p>

      {values.length === 0 && (
        <p className="mb-2 rounded-lg border border-dashed border-line-strong px-3 py-4 text-center text-sm text-muted">
          No highlights yet. A role needs at least one before it can be published.
        </p>
      )}

      <ol className="flex flex-col gap-2">
        {values.map((value, index) => (
          <li key={index} className="flex items-start gap-2">
            <span className="mt-2.5 w-4 shrink-0 text-xs text-faint">{index + 1}</span>
            <Textarea
              rows={2}
              value={value}
              placeholder="What you did, and what came of it."
              onChange={(e) => update(index, e.target.value)}
              className="min-h-0"
            />
            <div className="flex shrink-0 flex-col">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                aria-label={`Move highlight ${index + 1} up`}
                className="rounded px-1.5 text-muted hover:text-ink disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === values.length - 1}
                aria-label={`Move highlight ${index + 1} down`}
                className="rounded px-1.5 text-muted hover:text-ink disabled:opacity-30"
              >
                ↓
              </button>
            </div>
            <button
              type="button"
              onClick={() => onChange(values.filter((_, i) => i !== index))}
              aria-label={`Remove highlight ${index + 1}`}
              className="mt-1.5 shrink-0 rounded px-1.5 text-muted hover:text-danger"
            >
              ×
            </button>
          </li>
        ))}
      </ol>

      {values.length < 12 && (
        <Button
          type="button"
          variant="secondary"
          className="mt-2"
          onClick={() => onChange([...values, ''])}
        >
          + Add highlight
        </Button>
      )}
    </div>
  )
}
