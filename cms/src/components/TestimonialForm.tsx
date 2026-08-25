'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  deleteTestimonial,
  publishTestimonial,
  saveTestimonial,
  setTestimonialStatus,
} from '@/app/admin/testimonials/actions'
import { MediaPicker } from './MediaPicker'
import { Alert, Button, Card, Field, Input, StatusBadge, Textarea } from './ui'

export type TestimonialValues = {
  id: string
  name: string
  role: string
  company: string
  quote: string
  linkedinUrl: string
  avatarId: string
  companyLogoId: string
  featured: boolean
  status: string
}

export function TestimonialForm({ initial }: { initial: TestimonialValues }) {
  const router = useRouter()
  const [values, setValues] = useState(initial)
  const [dirty, setDirty] = useState(false)
  const [message, setMessage] = useState<{ tone: 'info' | 'error'; text: string } | null>(null)
  const [pending, startTransition] = useTransition()

  function set<K extends keyof TestimonialValues>(key: K, value: TestimonialValues[K]) {
    setDirty(true)
    setValues((current) => ({ ...current, [key]: value }))
  }

  const payload = () => ({
    ...values,
    avatarId: values.avatarId || null,
    companyLogoId: values.companyLogoId || null,
  })

  function save() {
    setMessage(null)
    startTransition(async () => {
      const result = await saveTestimonial(payload())
      if (!result.ok) return setMessage({ tone: 'error', text: result.error })
      setDirty(false)
      setMessage({ tone: 'info', text: 'Draft saved.' })
      router.refresh()
    })
  }

  function publish() {
    setMessage(null)
    startTransition(async () => {
      const saved = await saveTestimonial(payload())
      if (!saved.ok) return setMessage({ tone: 'error', text: saved.error })
      setDirty(false)
      const result = await publishTestimonial(values.id)
      if (!result.ok) return setMessage({ tone: 'error', text: result.error })
      setValues((v) => ({ ...v, status: 'PUBLISHED' }))
      setMessage({ tone: 'info', text: 'Published.' })
      router.refresh()
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
            <Button
              type="button"
              variant="ghost"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await setTestimonialStatus(values.id, 'DRAFT')
                  setValues((v) => ({ ...v, status: 'DRAFT' }))
                  router.refresh()
                })
              }
            >
              Unpublish
            </Button>
          )}
          {values.status === 'ARCHIVED' ? (
            <Button
              type="button"
              variant="danger"
              disabled={pending}
              onClick={() => {
                if (!window.confirm('Delete this testimonial permanently? This cannot be undone.')) return
                startTransition(async () => {
                  const result = await deleteTestimonial(values.id)
                  if (!result.ok) return setMessage({ tone: 'error', text: result.error })
                  router.push('/admin/testimonials')
                })
              }}
            >
              Delete
            </Button>
          ) : (
            <Button
              type="button"
              variant="danger"
              disabled={pending}
              onClick={() => {
                if (!window.confirm('Archive this testimonial? It will be removed from the public site.')) return
                startTransition(async () => {
                  await setTestimonialStatus(values.id, 'ARCHIVED')
                  setValues((v) => ({ ...v, status: 'ARCHIVED' }))
                  router.refresh()
                })
              }}
            >
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
        <h2 className="mb-4 text-sm font-semibold text-ink">Who said it</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" required>
            <Input value={values.name} onChange={(e) => set('name', e.target.value)} />
          </Field>
          <Field label="Role">
            <Input value={values.role} onChange={(e) => set('role', e.target.value)} />
          </Field>
          <Field label="Company">
            <Input value={values.company} onChange={(e) => set('company', e.target.value)} />
          </Field>
          <Field label="LinkedIn URL">
            <Input value={values.linkedinUrl} onChange={(e) => set('linkedinUrl', e.target.value)} />
          </Field>
          <MediaPicker
            label="Avatar"
            kind="image"
            value={values.avatarId}
            onChange={(id) => set('avatarId', String(id))}
          />
          <MediaPicker
            label="Company logo"
            kind="image"
            value={values.companyLogoId}
            onChange={(id) => set('companyLogoId', String(id))}
          />
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
        <Field label="Testimonial" required>
          <Textarea rows={6} value={values.quote} onChange={(e) => set('quote', e.target.value)} />
        </Field>
      </Card>
    </div>
  )
}
