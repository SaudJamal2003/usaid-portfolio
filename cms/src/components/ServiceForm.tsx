'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  deleteService,
  publishService,
  saveService,
  setServiceStatus,
} from '@/app/admin/services/actions'
import { MediaPicker } from './MediaPicker'
import { Alert, Button, Card, Field, Input, StatusBadge, Textarea } from './ui'

export type ServiceValues = {
  id: string
  title: string
  description: string
  iconId: string
  status: string
}

export function ServiceForm({ initial }: { initial: ServiceValues }) {
  const router = useRouter()
  const [values, setValues] = useState(initial)
  const [dirty, setDirty] = useState(false)
  const [message, setMessage] = useState<{ tone: 'info' | 'error'; text: string } | null>(null)
  const [pending, startTransition] = useTransition()

  function set<K extends keyof ServiceValues>(key: K, value: ServiceValues[K]) {
    setDirty(true)
    setValues((current) => ({ ...current, [key]: value }))
  }

  const payload = () => ({ ...values, iconId: values.iconId || null })

  function save() {
    setMessage(null)
    startTransition(async () => {
      const result = await saveService(payload())
      if (!result.ok) return setMessage({ tone: 'error', text: result.error })
      setDirty(false)
      setMessage({ tone: 'info', text: 'Draft saved.' })
      router.refresh()
    })
  }

  function publish() {
    setMessage(null)
    startTransition(async () => {
      const saved = await saveService(payload())
      if (!saved.ok) return setMessage({ tone: 'error', text: saved.error })
      setDirty(false)
      const result = await publishService(values.id)
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
        {dirty && <span className="text-xs text-warn">Unsaved changes</span>}
        <div className="ml-auto flex flex-wrap gap-2">
          {values.status === 'PUBLISHED' && (
            <Button
              type="button"
              variant="ghost"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await setServiceStatus(values.id, 'DRAFT')
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
                if (!window.confirm('Delete this service permanently? This cannot be undone.')) return
                startTransition(async () => {
                  const result = await deleteService(values.id)
                  if (!result.ok) return setMessage({ tone: 'error', text: result.error })
                  router.push('/admin/services')
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
                if (!window.confirm('Archive this service? It will be removed from the public site.')) return
                startTransition(async () => {
                  await setServiceStatus(values.id, 'ARCHIVED')
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
        <div className="flex flex-col gap-4">
          <Field label="Title" required>
            <Input value={values.title} onChange={(e) => set('title', e.target.value)} />
          </Field>
          <Field label="Description" required>
            <Textarea
              rows={4}
              value={values.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </Field>
          <MediaPicker
            label="Icon"
            kind="image"
            value={values.iconId}
            onChange={(id) => set('iconId', String(id))}
          />
        </div>
      </Card>
    </div>
  )
}
