'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  addSocialLink,
  deleteSocialLink,
  saveFooter,
  saveSocialLinks,
} from '@/app/admin/footer/actions'
import { MediaPicker } from './MediaPicker'
import { Alert, Button, Card, Field, Input, Textarea } from './ui'

export type FooterValues = {
  email: string
  description: string
  copyright: string
  ctaLabel: string
  ctaUrl: string
}

export type SocialItem = {
  id: string
  platform: string
  url: string
  visible: boolean
  iconId: string
}

export function FooterEditor({
  initial,
  socials: initialSocials,
}: {
  initial: FooterValues
  socials: SocialItem[]
}) {
  const router = useRouter()
  const [values, setValues] = useState(initial)
  const [dirty, setDirty] = useState(false)
  const [socials, setSocials] = useState(initialSocials)
  const [socialsDirty, setSocialsDirty] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [message, setMessage] = useState<{ tone: 'info' | 'error'; text: string } | null>(null)
  const [pending, startTransition] = useTransition()

  function run(action: () => Promise<{ ok: boolean; error?: string }>, clear: () => void) {
    setMessage(null)
    startTransition(async () => {
      const result = await action()
      if (!result.ok) return setMessage({ tone: 'error', text: result.error ?? 'Could not save.' })
      clear()
      setMessage({ tone: 'info', text: 'Saved.' })
      router.refresh()
    })
  }

  function updateSocial(index: number, patch: Partial<SocialItem>) {
    setSocialsDirty(true)
    setSocials((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  function moveSocial(index: number, delta: number) {
    const target = index + delta
    if (target < 0 || target >= socials.length) return
    const next = [...socials]
    ;[next[index], next[target]] = [next[target], next[index]]
    setSocialsDirty(true)
    setSocials(next)
  }

  const noUrls = socials.filter((s) => s.visible && !s.url.trim()).length

  return (
    <div className="flex flex-col gap-4">
      {message && <Alert tone={message.tone === 'error' ? 'error' : 'info'}>{message.text}</Alert>}

      <Card className="p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-ink">Contact</h2>
            <p className="mt-0.5 text-xs text-muted">
              The footer shows this address as a click-to-copy button.
            </p>
          </div>
          <Button
            type="button"
            disabled={pending || !dirty}
            onClick={() => run(() => saveFooter(values), () => setDirty(false))}
          >
            Save
          </Button>
        </div>

        <Field label="Email" required>
          <Input
            value={values.email}
            onChange={(e) => {
              setDirty(true)
              setValues((v) => ({ ...v, email: e.target.value }))
            }}
          />
        </Field>

        <details className="mt-4 rounded-lg border border-line p-3">
          <summary className="cursor-pointer text-xs font-medium text-muted">
            Fields the footer does not render yet
          </summary>
          <p className="mb-3 mt-2 text-xs text-faint">
            The footer is currently just the email and the social row. These are stored so the copy is
            ready if a description, copyright line or CTA gets designed in — nothing here changes the
            live page.
          </p>
          <div className="flex flex-col gap-3">
            <Field label="Description">
              <Textarea
                rows={2}
                value={values.description}
                onChange={(e) => {
                  setDirty(true)
                  setValues((v) => ({ ...v, description: e.target.value }))
                }}
              />
            </Field>
            <Field label="Copyright">
              <Input
                value={values.copyright}
                onChange={(e) => {
                  setDirty(true)
                  setValues((v) => ({ ...v, copyright: e.target.value }))
                }}
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="CTA label">
                <Input
                  value={values.ctaLabel}
                  onChange={(e) => {
                    setDirty(true)
                    setValues((v) => ({ ...v, ctaLabel: e.target.value }))
                  }}
                />
              </Field>
              <Field label="CTA link">
                <Input
                  value={values.ctaUrl}
                  onChange={(e) => {
                    setDirty(true)
                    setValues((v) => ({ ...v, ctaUrl: e.target.value }))
                  }}
                />
              </Field>
            </div>
          </div>
        </details>
      </Card>

      <Card className="p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-ink">Social links</h2>
            <p className="mt-0.5 text-xs text-muted">
              The badge row along the footer. Each icon is an image from the media library.
            </p>
          </div>
          <Button
            type="button"
            disabled={pending || !socialsDirty}
            onClick={() => run(() => saveSocialLinks(socials), () => setSocialsDirty(false))}
          >
            Save
          </Button>
        </div>

        {noUrls > 0 && (
          <div className="mb-3">
            <Alert tone="warn">
              {noUrls} visible {noUrls === 1 ? 'icon has' : 'icons have'} no URL. They are on the site
              today but link nowhere — add the profile addresses to make them work.
            </Alert>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {socials.map((social, index) => (
            <div
              key={social.id}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex === null || dragIndex === index) return
                const next = [...socials]
                const [moved] = next.splice(dragIndex, 1)
                next.splice(index, 0, moved)
                setDragIndex(null)
                setSocialsDirty(true)
                setSocials(next)
              }}
              className={`rounded-lg border border-line p-3 ${dragIndex === index ? 'opacity-50' : ''}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="cursor-grab select-none text-faint" aria-hidden="true">
                  ⠿
                </span>
                <Input
                  aria-label={`Platform ${index + 1}`}
                  value={social.platform}
                  className="w-32"
                  onChange={(e) => updateSocial(index, { platform: e.target.value })}
                />
                <Input
                  aria-label={`URL for ${social.platform}`}
                  value={social.url}
                  placeholder="https://…"
                  className="min-w-40 flex-1"
                  onChange={(e) => updateSocial(index, { url: e.target.value })}
                />
                <label className="flex items-center gap-1.5 whitespace-nowrap text-xs text-ink-soft">
                  <input
                    type="checkbox"
                    checked={social.visible}
                    onChange={(e) => updateSocial(index, { visible: e.target.checked })}
                    className="size-4 accent-[color:var(--color-accent-deep)]"
                  />
                  Visible
                </label>
                <div className="flex">
                  <button
                    type="button"
                    onClick={() => moveSocial(index, -1)}
                    disabled={index === 0}
                    aria-label={`Move ${social.platform} up`}
                    className="rounded px-1.5 text-muted hover:text-ink disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSocial(index, 1)}
                    disabled={index === socials.length - 1}
                    aria-label={`Move ${social.platform} down`}
                    className="rounded px-1.5 text-muted hover:text-ink disabled:opacity-30"
                  >
                    ↓
                  </button>
                </div>
                <button
                  type="button"
                  aria-label={`Remove ${social.platform}`}
                  className="rounded px-1.5 text-muted hover:text-danger"
                  onClick={() => {
                    if (!window.confirm(`Remove the ${social.platform} link?`)) return
                    startTransition(async () => {
                      await deleteSocialLink(social.id)
                      setSocials((current) => current.filter((row) => row.id !== social.id))
                      router.refresh()
                    })
                  }}
                >
                  ×
                </button>
              </div>

              <div className="mt-3">
                <MediaPicker
                  label="Icon"
                  kind="image"
                  value={social.iconId}
                  onChange={(id) => updateSocial(index, { iconId: String(id) })}
                />
              </div>
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="secondary"
          className="mt-3"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await addSocialLink()
              router.refresh()
            })
          }
        >
          + Add social link
        </Button>
      </Card>
    </div>
  )
}
