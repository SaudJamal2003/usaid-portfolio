'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  deleteExperience,
  publishExperience,
  saveExperience,
  setExperienceStatus,
} from '@/app/admin/experience/actions'
import { HighlightsEditor } from './HighlightsEditor'
import { MediaPicker } from './MediaPicker'
import { Alert, Button, Card, Field, Input, StatusBadge, Textarea } from './ui'

export type ExperienceValues = {
  id: string
  company: string
  role: string
  description: string
  highlights: string[]
  startDate: string
  endDate: string
  isCurrent: boolean
  location: string
  logoId: string
  status: string
}

export function ExperienceForm({ initial }: { initial: ExperienceValues }) {
  const router = useRouter()
  const [values, setValues] = useState(initial)
  const [dirty, setDirty] = useState(false)
  const [message, setMessage] = useState<{ tone: 'info' | 'error'; text: string } | null>(null)
  const [pending, startTransition] = useTransition()

  function set<K extends keyof ExperienceValues>(key: K, value: ExperienceValues[K]) {
    setDirty(true)
    setValues((current) => ({ ...current, [key]: value }))
  }

  function payload() {
    return {
      ...values,
      logoId: values.logoId || null,
      // Blank rows are an editing artefact, not content.
      highlights: values.highlights.map((h) => h.trim()).filter(Boolean),
    }
  }

  function save() {
    setMessage(null)
    startTransition(async () => {
      const result = await saveExperience(payload())
      if (!result.ok) return setMessage({ tone: 'error', text: result.error })
      setDirty(false)
      setMessage({ tone: 'info', text: 'Draft saved.' })
      router.refresh()
    })
  }

  function publish() {
    setMessage(null)
    startTransition(async () => {
      const saved = await saveExperience(payload())
      if (!saved.ok) return setMessage({ tone: 'error', text: saved.error })
      setDirty(false)

      const result = await publishExperience(values.id)
      if (!result.ok) return setMessage({ tone: 'error', text: result.error })
      setValues((v) => ({ ...v, status: 'PUBLISHED' }))
      setMessage({ tone: 'info', text: 'Published.' })
      router.refresh()
    })
  }

  function archive() {
    if (!window.confirm('Archive this role? It will be removed from the public timeline.')) return
    startTransition(async () => {
      await setExperienceStatus(values.id, 'ARCHIVED')
      setValues((v) => ({ ...v, status: 'ARCHIVED' }))
      router.refresh()
    })
  }

  function destroy() {
    if (!window.confirm('Delete this role permanently? This cannot be undone.')) return
    startTransition(async () => {
      const result = await deleteExperience(values.id)
      if (!result.ok) return setMessage({ tone: 'error', text: result.error })
      router.push('/admin/experience')
    })
  }

  const placeholderBullets = values.highlights.some((h) => h.startsWith('TODO'))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={values.status} />
        {dirty && <span className="text-xs text-warn">Unsaved changes</span>}
        <div className="ml-auto flex flex-wrap gap-2">
          {values.status === 'PUBLISHED' && (
            <Button
              type="button"
              variant="ghost"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await setExperienceStatus(values.id, 'DRAFT')
                  setValues((v) => ({ ...v, status: 'DRAFT' }))
                  router.refresh()
                })
              }
            >
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

      {placeholderBullets && (
        <Alert tone="warn">
          This role still carries placeholder text migrated from the old shared list. Replace it with
          what you actually did here — publishing is blocked until you do.
        </Alert>
      )}

      {message && <Alert tone={message.tone === 'error' ? 'error' : 'info'}>{message.text}</Alert>}

      <Card className="p-5">
        <h2 className="mb-4 text-sm font-semibold text-ink">Role</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Company" required>
            <Input value={values.company} onChange={(e) => set('company', e.target.value)} />
          </Field>
          <Field label="Role title" required>
            <Input value={values.role} onChange={(e) => set('role', e.target.value)} />
          </Field>
          <Field label="Start" required hint="Shown as written, e.g. Jan '26.">
            <Input value={values.startDate} onChange={(e) => set('startDate', e.target.value)} />
          </Field>
          <Field label="End" hint="Leave blank for a current role.">
            <Input
              value={values.endDate}
              disabled={values.isCurrent}
              onChange={(e) => set('endDate', e.target.value)}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={values.isCurrent}
              onChange={(e) => {
                set('isCurrent', e.target.checked)
                if (e.target.checked) set('endDate', '')
              }}
              className="size-4 accent-[color:var(--color-accent-deep)]"
            />
            This is my current role
          </label>
          <Field label="Location">
            <Input value={values.location} onChange={(e) => set('location', e.target.value)} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Description" hint="Optional. The timeline card leads with the highlights.">
              <Textarea
                rows={2}
                value={values.description}
                onChange={(e) => set('description', e.target.value)}
              />
            </Field>
          </div>
          <MediaPicker
            label="Company logo"
            kind="image"
            value={values.logoId}
            onChange={(id) => set('logoId', String(id))}
          />
        </div>
      </Card>

      <Card className="p-5">
        <HighlightsEditor values={values.highlights} onChange={(next) => set('highlights', next)} />
      </Card>
    </div>
  )
}
