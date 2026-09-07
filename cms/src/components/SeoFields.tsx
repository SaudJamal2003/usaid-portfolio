'use client'

import { MediaPicker } from './MediaPicker'
import { Field, Input, Textarea } from './ui'

export type SeoValues = {
  title: string
  description: string
  canonicalUrl: string
  noIndex: boolean
  ogImageId: string
}

export const EMPTY_SEO: SeoValues = {
  title: '',
  description: '',
  canonicalUrl: '',
  noIndex: false,
  ogImageId: '',
}

/**
 * The SEO block, identical wherever metadata is edited.
 *
 * `inherited` is what the global defaults would supply, shown as placeholder
 * text — so leaving a field blank visibly means "use the global value" rather
 * than "this page has no title".
 */
export function SeoFields({
  values,
  onChange,
  inherited,
}: {
  values: SeoValues
  onChange: (next: SeoValues) => void
  inherited?: { title?: string | null; description?: string | null }
}) {
  const set = <K extends keyof SeoValues>(key: K, value: SeoValues[K]) =>
    onChange({ ...values, [key]: value })

  return (
    <div className="flex flex-col gap-4">
      <Field
        label="SEO title"
        hint={inherited?.title ? `Blank inherits: “${inherited.title}”` : undefined}
      >
        <Input
          value={values.title}
          placeholder={inherited?.title ?? ''}
          onChange={(e) => set('title', e.target.value)}
        />
      </Field>

      <Field
        label="Meta description"
        hint={inherited?.description ? 'Blank inherits the global description.' : undefined}
      >
        <Textarea
          rows={2}
          value={values.description}
          placeholder={inherited?.description ?? ''}
          onChange={(e) => set('description', e.target.value)}
        />
      </Field>

      <Field label="Canonical URL" hint="Absolute URL. Leave blank unless this page duplicates another.">
        <Input
          value={values.canonicalUrl}
          placeholder="https://www.usaidux.space/…"
          onChange={(e) => set('canonicalUrl', e.target.value)}
        />
      </Field>

      <MediaPicker
        label="OG image"
        kind="image"
        value={values.ogImageId}
        onChange={(id) => set('ogImageId', String(id))}
      />

      <label className="flex items-center gap-2 text-sm text-ink-soft">
        <input
          type="checkbox"
          checked={values.noIndex}
          onChange={(e) => set('noIndex', e.target.checked)}
          className="size-4 accent-[color:var(--color-accent-deep)]"
        />
        Ask search engines not to index this page
      </label>
    </div>
  )
}

/**
 * Reminder that publishing is the last step, shown next to every SEO form.
 *
 * These values now reach real link previews (Slack, LinkedIn, X, WhatsApp,
 * iMessage) within about 30 seconds of publishing — a middleware on the
 * portfolio resolves them per page for crawler requests. Nothing here is
 * visible to a scraper until the record is published.
 */
export function SeoLimitationNotice() {
  return (
    <div className="rounded-lg bg-info-bg p-3 text-xs text-info">
      <p className="font-medium">These values drive real link previews.</p>
      <p className="mt-1 text-info/90">
        Once published, a shared link to this page shows this title, description and image on
        Slack, LinkedIn, X, WhatsApp and iMessage — usually within about 30 seconds.
      </p>
    </div>
  )
}
