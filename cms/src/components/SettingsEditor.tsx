'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { saveSettings } from '@/app/admin/settings/actions'
import { MediaPicker } from './MediaPicker'
import { Alert, Button, Card, Field, Input, Textarea } from './ui'

export type SettingsValues = {
  siteName: string
  siteDescription: string
  contactEmail: string
  location: string
  availabilityLabel: string
  clientsLabel: string
  defaultSeoTitle: string
  defaultSeoDesc: string
  ogImageId: string
  faviconId: string
}

export function SettingsEditor({ initial }: { initial: SettingsValues }) {
  const router = useRouter()
  const [values, setValues] = useState(initial)
  const [dirty, setDirty] = useState(false)
  const [message, setMessage] = useState<{ tone: 'info' | 'error'; text: string } | null>(null)
  const [pending, startTransition] = useTransition()

  function set<K extends keyof SettingsValues>(key: K, value: SettingsValues[K]) {
    setDirty(true)
    setValues((current) => ({ ...current, [key]: value }))
  }

  function save() {
    setMessage(null)
    startTransition(async () => {
      const result = await saveSettings({
        ...values,
        ogImageId: values.ogImageId || null,
        faviconId: values.faviconId || null,
      })
      if (!result.ok) return setMessage({ tone: 'error', text: result.error })
      setDirty(false)
      setMessage({ tone: 'info', text: 'Saved.' })
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        {dirty && <span className="text-xs text-warn">Unsaved changes</span>}
        <Button type="button" className="ml-auto" onClick={save} disabled={pending || !dirty}>
          Save
        </Button>
      </div>

      {message && <Alert tone={message.tone === 'error' ? 'error' : 'info'}>{message.text}</Alert>}

      <Card className="p-5">
        <h2 className="mb-4 text-sm font-semibold text-ink">Identity</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Site name" required>
            <Input value={values.siteName} onChange={(e) => set('siteName', e.target.value)} />
          </Field>
          <Field label="Contact email" required>
            <Input value={values.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Site description">
              <Textarea
                rows={2}
                value={values.siteDescription}
                onChange={(e) => set('siteDescription', e.target.value)}
              />
            </Field>
          </div>
          <Field label="Location">
            <Input value={values.location} onChange={(e) => set('location', e.target.value)} />
          </Field>
          <Field label="Availability" hint="The chip beside the stats on the homepage.">
            <Input
              value={values.availabilityLabel}
              onChange={(e) => set('availabilityLabel', e.target.value)}
            />
          </Field>
          <Field label="Clients chip" hint="Beside the avatar stack on the homepage.">
            <Input value={values.clientsLabel} onChange={(e) => set('clientsLabel', e.target.value)} />
          </Field>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-ink">Default SEO</h2>
        <p className="mb-4 mt-1 text-xs text-muted">
          The fallback when a page has no metadata of its own. The portfolio uses hash routing, so the
          live tags still come from index.html — these are stored ready for a move to real paths.
        </p>
        <div className="flex flex-col gap-4">
          <Field label="Default title">
            <Input value={values.defaultSeoTitle} onChange={(e) => set('defaultSeoTitle', e.target.value)} />
          </Field>
          <Field label="Default description">
            <Textarea
              rows={2}
              value={values.defaultSeoDesc}
              onChange={(e) => set('defaultSeoDesc', e.target.value)}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <MediaPicker
              label="Default OG image"
              kind="image"
              value={values.ogImageId}
              onChange={(id) => set('ogImageId', String(id))}
            />
            <MediaPicker
              label="Favicon"
              kind="image"
              value={values.faviconId}
              onChange={(id) => set('faviconId', String(id))}
            />
          </div>
        </div>
      </Card>

      <Card className="border-line bg-surface p-4">
        <p className="text-xs text-muted">
          API keys, tokens and connection strings are deliberately not editable here. They belong in
          environment variables, where they are never served to a browser or stored beside content.
        </p>
      </Card>
    </div>
  )
}
