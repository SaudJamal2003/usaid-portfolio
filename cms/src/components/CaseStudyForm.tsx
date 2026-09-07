'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  createPreviewToken,
  duplicateCaseStudy,
  publishCaseStudy,
  saveCaseStudy,
  setCaseStudyStatus,
} from '@/app/admin/case-studies/actions'
import { NEW_DRAFT_TITLE } from '@/lib/constants'
import { slugify } from '@/lib/slug'
import { MediaPicker } from './MediaPicker'
import { SeoFields, SeoLimitationNotice, type SeoValues } from './SeoFields'
import { saveSeo } from '@/app/admin/seo/actions'
import { Alert, Button, Card, Field, Input, StatusBadge, Textarea } from './ui'

export type CaseStudyValues = {
  id: string
  title: string
  slug: string
  shortDescription: string
  client: string
  industry: string
  projectType: string
  year: string
  duration: string
  role: string
  team: string
  externalUrl: string
  prototypeUrl: string
  heroTitle: string
  heroDescription: string
  heroId: string
  thumbnailId: string
  featured: boolean
  status: string
}

const PORTFOLIO_URL = process.env.NEXT_PUBLIC_PORTFOLIO_URL ?? 'http://localhost:5173'

export function CaseStudyForm({
  initial,
  seo: initialSeo,
  inheritedSeo,
}: {
  initial: CaseStudyValues
  seo: SeoValues
  inheritedSeo?: { title?: string | null; description?: string | null }
}) {
  const router = useRouter()
  const [values, setValues] = useState(initial)
  const [dirty, setDirty] = useState(false)
  const [message, setMessage] = useState<{ tone: 'info' | 'error'; text: string } | null>(null)
  const [pending, startTransition] = useTransition()
  const [seo, setSeo] = useState(initialSeo)
  const [seoDirty, setSeoDirty] = useState(false)

  /* Slug follows the title only while it has not been hand-edited (§14).
     A brand-new draft carries a generated placeholder slug, which is not the
     same as the user having chosen one -- treating it as hand-edited would
     leave every new case study stuck on "untitled-case-study" and unable to
     publish. */
  const [slugTouched, setSlugTouched] = useState(initial.title !== NEW_DRAFT_TITLE)

  function set<K extends keyof CaseStudyValues>(key: K, value: CaseStudyValues[K]) {
    setDirty(true)
    setValues((current) => {
      const next = { ...current, [key]: value }
      if (key === 'title' && !slugTouched) next.slug = slugify(String(value))
      return next
    })
  }

  function save(after?: () => void) {
    setMessage(null)
    startTransition(async () => {
      const result = await saveCaseStudy({
        ...values,
        heroId: values.heroId || null,
        thumbnailId: values.thumbnailId || null,
      })
      if (!result.ok) return setMessage({ tone: 'error', text: result.error })
      setDirty(false)
      setMessage({ tone: 'info', text: 'Draft saved.' })
      after?.()
      router.refresh()
    })
  }

  function publish() {
    setMessage(null)
    startTransition(async () => {
      // Always save first, so publish validates what is on screen.
      const saveResult = await saveCaseStudy({
        ...values,
        heroId: values.heroId || null,
        thumbnailId: values.thumbnailId || null,
      })
      if (!saveResult.ok) return setMessage({ tone: 'error', text: saveResult.error })
      setDirty(false)

      const result = await publishCaseStudy(values.id)
      if (!result.ok) return setMessage({ tone: 'error', text: result.error })
      setValues((v) => ({ ...v, status: 'PUBLISHED' }))
      setMessage({ tone: 'info', text: 'Published. It is live on the portfolio now.' })
      router.refresh()
    })
  }

  function preview() {
    startTransition(async () => {
      const result = await createPreviewToken(values.id)
      window.open(`${PORTFOLIO_URL}/work/${values.slug}?preview=${result.token}`, '_blank')
    })
  }

  function archive() {
    if (!window.confirm('Archive this case study? It will be removed from the public portfolio. You can restore it later.')) return
    startTransition(async () => {
      await setCaseStudyStatus(values.id, 'ARCHIVED')
      setValues((v) => ({ ...v, status: 'ARCHIVED' }))
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={values.status} />
        {dirty && <span className="text-xs text-warn">Unsaved changes</span>}
        <div className="ml-auto flex flex-wrap gap-2">
          <Button type="button" variant="ghost" onClick={preview} disabled={pending}>
            Preview
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await duplicateCaseStudy(values.id)
                if (result.ok) router.push(`/admin/case-studies/${result.id}`)
              })
            }
          >
            Duplicate
          </Button>
          {values.status !== 'ARCHIVED' && (
            <Button type="button" variant="danger" onClick={archive} disabled={pending}>
              Archive
            </Button>
          )}
          <Button type="button" variant="secondary" onClick={() => save()} disabled={pending || !dirty}>
            Save draft
          </Button>
          <Button type="button" onClick={publish} disabled={pending}>
            {values.status === 'PUBLISHED' ? 'Update live' : 'Publish'}
          </Button>
        </div>
      </div>

      {message && <Alert tone={message.tone === 'error' ? 'error' : 'info'}>{message.text}</Alert>}

      <Card className="p-5">
        <h2 className="mb-4 text-sm font-semibold text-ink">Basic information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Title" required>
              <Input value={values.title} onChange={(e) => set('title', e.target.value)} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Slug" required hint="Changing this breaks any existing links to the case study.">
              <Input
                value={values.slug}
                onChange={(e) => {
                  setSlugTouched(true)
                  set('slug', e.target.value)
                }}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Short description">
              <Textarea rows={2} value={values.shortDescription} onChange={(e) => set('shortDescription', e.target.value)} />
            </Field>
          </div>

          <Field label="Client">
            <Input value={values.client} onChange={(e) => set('client', e.target.value)} />
          </Field>
          <Field label="Industry">
            <Input value={values.industry} onChange={(e) => set('industry', e.target.value)} />
          </Field>
          <Field label="Project type">
            <Input value={values.projectType} onChange={(e) => set('projectType', e.target.value)} />
          </Field>
          <Field label="Year">
            <Input value={values.year} onChange={(e) => set('year', e.target.value)} />
          </Field>
          <Field label="Duration">
            <Input value={values.duration} onChange={(e) => set('duration', e.target.value)} />
          </Field>
          <Field label="Role">
            <Input value={values.role} onChange={(e) => set('role', e.target.value)} />
          </Field>
          <Field label="Team">
            <Input value={values.team} onChange={(e) => set('team', e.target.value)} />
          </Field>
          <Field label="Prototype URL">
            <Input value={values.prototypeUrl} onChange={(e) => set('prototypeUrl', e.target.value)} />
          </Field>

          <label className="flex items-center gap-2 text-sm text-ink-soft sm:col-span-2">
            <input
              type="checkbox"
              checked={values.featured}
              onChange={(e) => set('featured', e.target.checked)}
              className="size-4 accent-[color:var(--color-accent-deep)]"
            />
            Featured
          </label>
        </div>
      </Card>

      <Card className="p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-ink">SEO</h2>
            <p className="mt-0.5 text-xs text-muted">Blank fields inherit the global defaults.</p>
          </div>
          <Button
            type="button"
            disabled={pending || !seoDirty}
            onClick={() =>
              startTransition(async () => {
                const result = await saveSeo({
                  entityType: 'case_study',
                  entityId: values.id,
                  ...seo,
                  ogImageId: seo.ogImageId || null,
                })
                if (!result.ok) return setMessage({ tone: 'error', text: result.error })
                setSeoDirty(false)
                setMessage({ tone: 'info', text: 'SEO saved.' })
              })
            }
          >
            Save SEO
          </Button>
        </div>
        <div className="mb-4">
          <SeoLimitationNotice />
        </div>
        <SeoFields
          values={seo}
          inherited={inheritedSeo}
          onChange={(next) => {
            setSeoDirty(true)
            setSeo(next)
          }}
        />
      </Card>

      <Card className="p-5">
        <h2 className="mb-4 text-sm font-semibold text-ink">Hero</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Hero title">
              <Input value={values.heroTitle} onChange={(e) => set('heroTitle', e.target.value)} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Hero description">
              <Textarea rows={3} value={values.heroDescription} onChange={(e) => set('heroDescription', e.target.value)} />
            </Field>
          </div>
          <MediaPicker label="Hero image" value={values.heroId} onChange={(id) => set('heroId', String(id))} />
          <MediaPicker label="Thumbnail" value={values.thumbnailId} onChange={(id) => set('thumbnailId', String(id))} />
        </div>
      </Card>
    </div>
  )
}
