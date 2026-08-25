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
 * The standing caveat, shown next to every SEO form.
 *
 * Repeated deliberately: someone filling in an OG image here will reasonably
 * assume it appears when they paste the link into Slack, and it will not.
 */
export function SeoLimitationNotice() {
  return (
    <div className="rounded-lg bg-warn-bg p-3 text-xs text-warn">
      <p className="font-medium">These values are stored, not yet served.</p>
      <p className="mt-1 text-warn/90">
        The portfolio is a Vite app using hash routing, so every route returns the same HTML and the
        live tags come from <code>index.html</code>. Slack, LinkedIn and X do not run JavaScript, so
        they will not see anything set here — a link to a case study still previews with the site-wide
        image. Per-page metadata starts working when the portfolio moves to real paths with
        prerendering; this data is stored so that migration is a wiring job, not a content job.
      </p>
    </div>
  )
}
