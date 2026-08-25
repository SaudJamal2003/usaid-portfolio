'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  deleteProject,
  publishProject,
  saveProject,
  setProjectStatus,
} from '@/app/admin/projects/actions'
import { NEW_PROJECT_TITLE } from '@/lib/constants'
import { slugify } from '@/lib/slug'
import { MediaPicker } from './MediaPicker'
import { TagInput } from './TagInput'
import { Alert, Button, Card, Field, Input, Select, StatusBadge, Textarea } from './ui'

export type ProjectValues = {
  id: string
  title: string
  slug: string
  shortDescription: string
  category: string
  industry: string
  year: string
  role: string
  externalUrl: string
  aspectRatio: string
  technologies: string[]
  thumbnailId: string
  heroId: string
  caseStudyId: string
  featured: boolean
  status: string
  seoTitle: string
  seoDescription: string
  seoNoIndex: boolean
}

export function ProjectForm({
  initial,
  caseStudies,
}: {
  initial: ProjectValues
  caseStudies: { id: string; title: string }[]
}) {
  const router = useRouter()
  const [values, setValues] = useState(initial)
  const [dirty, setDirty] = useState(false)
  const [message, setMessage] = useState<{ tone: 'info' | 'error'; text: string } | null>(null)
  const [pending, startTransition] = useTransition()

  // A generated placeholder slug is not the same as one the user picked, so a
  // fresh draft still lets the title drive it.
  const [slugTouched, setSlugTouched] = useState(initial.title !== NEW_PROJECT_TITLE)

  function set<K extends keyof ProjectValues>(key: K, value: ProjectValues[K]) {
    setDirty(true)
    setValues((current) => {
      const next = { ...current, [key]: value }
      if (key === 'title' && !slugTouched) next.slug = slugify(String(value))
      return next
    })
  }

  function payload() {
    return {
      ...values,
      thumbnailId: values.thumbnailId || null,
      heroId: values.heroId || null,
      caseStudyId: values.caseStudyId || null,
    }
  }

  function save() {
    setMessage(null)
    startTransition(async () => {
      const result = await saveProject(payload())
      if (!result.ok) return setMessage({ tone: 'error', text: result.error })
      setDirty(false)
      setMessage({ tone: 'info', text: 'Draft saved.' })
      router.refresh()
    })
  }

  function publish() {
    setMessage(null)
    startTransition(async () => {
      // Save first so publish validates what is on screen, not what was last stored.
      const saved = await saveProject(payload())
      if (!saved.ok) return setMessage({ tone: 'error', text: saved.error })
      setDirty(false)

      const result = await publishProject(values.id)
      if (!result.ok) return setMessage({ tone: 'error', text: result.error })
      setValues((v) => ({ ...v, status: 'PUBLISHED' }))
      setMessage({ tone: 'info', text: 'Published. It is live on the portfolio now.' })
      router.refresh()
    })
  }

  function archive() {
    if (!window.confirm('Archive this project? It will be removed from the public portfolio. You can restore it later.'))
      return
    startTransition(async () => {
      await setProjectStatus(values.id, 'ARCHIVED')
      setValues((v) => ({ ...v, status: 'ARCHIVED' }))
      router.refresh()
    })
  }

  function unpublish() {
    startTransition(async () => {
      await setProjectStatus(values.id, 'DRAFT')
      setValues((v) => ({ ...v, status: 'DRAFT' }))
      router.refresh()
    })
  }

  function destroy() {
    if (!window.confirm('Delete this project permanently? This cannot be undone.')) return
    startTransition(async () => {
      const result = await deleteProject(values.id)
      if (!result.ok) return setMessage({ tone: 'error', text: result.error })
      router.push('/admin/projects')
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={values.status} />
        {values.featured && <span className="text-xs text-accent-deep">★ Featured</span>}
        {dirty && <span className="text-xs text-warn">Unsaved changes</span>}

        <div className="ml-auto flex flex-wrap gap-2">
          {values.status === 'PUBLISHED' && (
            <Button type="button" variant="ghost" onClick={unpublish} disabled={pending}>
              Unpublish
            </Button>
          )}
          {values.status === 'ARCHIVED' ? (
            <Button type="button" variant="danger" onClick={destroy} disabled={pending}>
              Delete
            </Button>
          ) : (
            <Button type="button" variant="danger" onClick={archive} disabled={pending}>
              Archive
            </Button>
          )}
          <Button type="button" variant="secondary" onClick={save} disabled={pending || !dirty}>
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
            <Field label="Slug" required hint="Changing this breaks any existing links to the project.">
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
            <Field label="Short description" required hint="The copy under the card on the work grid.">
              <Textarea
                rows={2}
                value={values.shortDescription}
                onChange={(e) => set('shortDescription', e.target.value)}
              />
            </Field>
          </div>

          <Field label="Category">
            <Input value={values.category} onChange={(e) => set('category', e.target.value)} />
          </Field>
          <Field label="Industry">
            <Input value={values.industry} onChange={(e) => set('industry', e.target.value)} />
          </Field>
          <Field label="Year">
            <Input value={values.year} onChange={(e) => set('year', e.target.value)} />
          </Field>
          <Field label="Role">
            <Input value={values.role} onChange={(e) => set('role', e.target.value)} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="External URL">
              <Input value={values.externalUrl} onChange={(e) => set('externalUrl', e.target.value)} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <TagInput
              label="Technologies"
              hint="Press Enter to add each one."
              values={values.technologies}
              onChange={(next) => set('technologies', next)}
            />
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="mb-4 text-sm font-semibold text-ink">Media</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <MediaPicker
            label="Thumbnail"
            kind="image"
            value={values.thumbnailId}
            onChange={(id) => set('thumbnailId', String(id))}
          />
          <MediaPicker
            label="Hero image"
            kind="image"
            value={values.heroId}
            onChange={(id) => set('heroId', String(id))}
          />
          <div className="sm:col-span-2">
            <Field
              label="Card aspect ratio"
              hint="The artboard slot this card fills in the work grid, e.g. 586/466. Leave blank for the default."
            >
              <Input
                value={values.aspectRatio}
                placeholder="586/466"
                onChange={(e) => set('aspectRatio', e.target.value)}
              />
            </Field>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="mb-4 text-sm font-semibold text-ink">Placement</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Linked case study" hint="Cards with a case study become clickable.">
            <Select value={values.caseStudyId} onChange={(e) => set('caseStudyId', e.target.value)}>
              <option value="">None</option>
              {caseStudies.map((cs) => (
                <option key={cs.id} value={cs.id}>
                  {cs.title}
                </option>
              ))}
            </Select>
          </Field>

          <label className="flex items-end gap-2 pb-2 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={values.featured}
              onChange={(e) => set('featured', e.target.checked)}
              className="size-4 accent-[color:var(--color-accent-deep)]"
            />
            Featured on the homepage
          </label>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-ink">SEO</h2>
        <p className="mb-4 mt-1 text-xs text-muted">
          Stored for later. The portfolio uses hash routing, so per-page metadata cannot reach a crawler
          until it moves to real paths — these values are kept ready for that.
        </p>
        <div className="flex flex-col gap-4">
          <Field label="SEO title">
            <Input value={values.seoTitle} onChange={(e) => set('seoTitle', e.target.value)} />
          </Field>
          <Field label="SEO description">
            <Textarea
              rows={2}
              value={values.seoDescription}
              onChange={(e) => set('seoDescription', e.target.value)}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={values.seoNoIndex}
              onChange={(e) => set('seoNoIndex', e.target.checked)}
              className="size-4 accent-[color:var(--color-accent-deep)]"
            />
            Ask search engines not to index this
          </label>
        </div>
      </Card>
    </div>
  )
}
