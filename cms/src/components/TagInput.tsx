'use client'

import { useState } from 'react'
import { inputStyles } from './ui'

/* Repeatable free-text values (technologies, and later skills). Kept generic
   so the other collections that need one do not each grow their own. */
export function TagInput({
  label,
  hint,
  values,
  onChange,
}: {
  label: string
  hint?: string
  values: string[]
  onChange: (next: string[]) => void
}) {
  const [draft, setDraft] = useState('')

  function commit() {
    const value = draft.trim()
    if (!value || values.includes(value)) return setDraft('')
    onChange([...values, value])
    setDraft('')
  }

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-ink-soft">{label}</span>

      {values.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-1.5">
          {values.map((value) => (
            <li
              key={value}
              className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-xs text-ink-soft"
            >
              {value}
              <button
                type="button"
                onClick={() => onChange(values.filter((v) => v !== value))}
                aria-label={`Remove ${value}`}
                className="text-faint hover:text-danger"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <input
        className={inputStyles}
        value={draft}
        placeholder="Type and press Enter"
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            // Otherwise Enter submits whatever form this sits in.
            e.preventDefault()
            commit()
          }
          if (e.key === 'Backspace' && !draft && values.length) {
            onChange(values.slice(0, -1))
          }
        }}
        onBlur={commit}
      />
      {hint && <span className="mt-1 block text-xs text-faint">{hint}</span>}
    </div>
  )
}
