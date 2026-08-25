'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  deleteMentor,
  publishMentor,
  saveMentor,
  setMentorStatus,
} from '@/app/admin/mentors/actions'
import { MediaPicker } from './MediaPicker'
import { Alert, Button, Card, Field, Input, StatusBadge, Textarea } from './ui'

export type MentorValues = {
  id: string
  name: string
  role: string
  tribute: string
  linkedinUrl: string
  photoId: string
  status: string
}

const PORTFOLIO_URL = process.env.NEXT_PUBLIC_PORTFOLIO_URL ?? 'http://localhost:5173'

export function MentorForm({ initial }: { initial: MentorValues }) {
  const router = useRouter()
  const [values, setValues] = useState(initial)
  const [dirty, setDirty] = useState(false)
  const [message, setMessage] = useState<{ tone: 'info' | 'error'; text: string } | null>(null)
  const [pending, startTransition] = useTransition()

  function set<K extends keyof MentorValues>(key: K, value: MentorValues[K]) {
    setDirty(true)
    setValues((current) => ({ ...current, [key]: value }))
  }

  const payload = () => ({ ...values, photoId: values.photoId || null })

  function save() {
    setMessage(null)
    startTransition(async () => {
      const result = await saveMentor(payload())
      if (!result.ok) return setMessage({ tone: 'error', text: result.error })
      setDirty(false)
      setMessage({ tone: 'info', text: 'Draft saved.' })
      router.refresh()
    })
  }

  function publish() {
    setMessage(null)
    startTransition(async () => {
      const saved = await saveMentor(payload())
      if (!saved.ok) return setMessage({ tone: 'error', text: saved.error })
      setDirty(false)
      const result = await publishMentor(values.id)
      if (!result.ok) return setMessage({ tone: 'error', text: result.error })
      setValues((v) => ({ ...v, status: 'PUBLISHED' }))
      setMessage({ tone: 'info', text: 'Published.' })
      router.refresh()
    })
  }

  const hasPlaceholder = [values.name, values.role, values.tribute].some((v) => v.startsWith('TODO'))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={values.status} />
        {dirty && <span className="text-xs text-warn">Unsaved changes</span>}

        <div className="ml-auto flex flex-wrap gap-2">
          {/* The carousel has no per-mentor route, so preview opens the section
              itself rather than pretending there is a page per person. */}
          <Button
            type="button"
            variant="ghost"
            disabled={pending}
            onClick={() => window.open(`${PORTFOLIO_URL}/#about`, '_blank')}
          >
            Preview section
          </Button>

          {values.status === 'PUBLISHED' && (
            <Button
              type="button"
              variant="ghost"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await setMentorStatus(values.id, 'DRAFT')
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
                if (!window.confirm('Delete this mentor permanently? This cannot be undone.')) return
                startTransition(async () => {
                  const result = await deleteMentor(values.id)
                  if (!result.ok) return setMessage({ tone: 'error', text: result.error })
                  router.push('/admin/mentors')
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
                if (!window.confirm('Archive this mentor? They will be removed from the carousel.')) return
                startTransition(async () => {
                  await setMentorStatus(values.id, 'ARCHIVED')
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

      {hasPlaceholder && (
        <Alert tone="warn">
          This entry still carries placeholder text. Publishing is blocked until it is replaced —
          this is a real person being credited publicly.
        </Alert>
      )}

      {message && <Alert tone={message.tone === 'error' ? 'error' : 'info'}>{message.text}</Alert>}

      <Card className="p-5">
        <h2 className="mb-4 text-sm font-semibold text-ink">Who they are</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" required>
            <Input value={values.name} onChange={(e) => set('name', e.target.value)} />
          </Field>
          <Field
            label="Role"
            required
            hint="One line, as it appears under the name — e.g. “COO - Techtree”."
          >
            <Input value={values.role} onChange={(e) => set('role', e.target.value)} />
          </Field>
          <MediaPicker
            label="Photo"
            kind="image"
            value={values.photoId}
            onChange={(id) => set('photoId', String(id))}
          />
          <Field label="LinkedIn URL" hint="Stored, but the card does not show a link yet.">
            <Input value={values.linkedinUrl} onChange={(e) => set('linkedinUrl', e.target.value)} />
          </Field>
        </div>
      </Card>

      <Card className="p-5">
        <Field
          label="Tribute"
          required
          hint="The body of the card. This is the whole description — there is no separate bio."
        >
          <Textarea rows={9} value={values.tribute} onChange={(e) => set('tribute', e.target.value)} />
        </Field>
        <p className="mt-2 text-xs text-faint">{values.tribute.trim().length} characters</p>
      </Card>
    </div>
  )
}
