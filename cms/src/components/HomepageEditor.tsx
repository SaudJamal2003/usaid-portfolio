'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  saveClientAvatars,
  saveContactCta,
  saveHero,
  saveStats,
} from '@/app/admin/homepage/actions'
import { MediaPicker } from './MediaPicker'
import { TagInput } from './TagInput'
import { Alert, Button, Card, Field, Input, StatusBadge, Textarea } from './ui'

/* One panel per section that actually exists on the homepage. Deliberately not
   a single JSON editor: each section saves on its own, so a mistake in one
   cannot take the others down with it. */

export type HeroValues = {
  eyebrow: string
  titlePrefix: string
  typingWords: string[]
  description: string
  primaryCtaLabel: string
  primaryCtaUrl: string
  portraitId: string
}

export type StatsValues = {
  clientsLabel: string
  availabilityLabel: string
  cards: { id: string; value: string; caption: string; blurb: string }[]
}

export type CtaValues = { note: string; buttonLabel: string; buttonUrl: string }

export type FeaturedProject = { id: string; title: string; status: string; slug: string }

function Section({
  title,
  description,
  children,
  onSave,
  saving,
  message,
  dirty,
}: {
  title: string
  description: string
  children: React.ReactNode
  onSave?: () => void
  saving?: boolean
  message?: { tone: 'info' | 'error'; text: string } | null
  dirty?: boolean
}) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
          <p className="mt-0.5 text-xs text-muted">{description}</p>
        </div>
        {onSave && (
          <div className="flex items-center gap-2">
            {dirty && <span className="text-xs text-warn">Unsaved</span>}
            <Button type="button" onClick={onSave} disabled={saving || !dirty}>
              Save
            </Button>
          </div>
        )}
      </div>
      {message && (
        <div className="mb-3">
          <Alert tone={message.tone === 'error' ? 'error' : 'info'}>{message.text}</Alert>
        </div>
      )}
      {children}
    </Card>
  )
}

export function HomepageEditor({
  hero,
  stats,
  cta,
  featured,
  clientAvatarIds,
}: {
  hero: HeroValues
  stats: StatsValues
  cta: CtaValues
  featured: FeaturedProject[]
  clientAvatarIds: string[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const [heroValues, setHeroValues] = useState(hero)
  const [heroDirty, setHeroDirty] = useState(false)
  const [heroMessage, setHeroMessage] = useState<{ tone: 'info' | 'error'; text: string } | null>(null)

  const [statsValues, setStatsValues] = useState(stats)
  const [statsDirty, setStatsDirty] = useState(false)
  const [statsMessage, setStatsMessage] = useState<{ tone: 'info' | 'error'; text: string } | null>(null)

  const [ctaValues, setCtaValues] = useState(cta)
  const [ctaDirty, setCtaDirty] = useState(false)
  const [ctaMessage, setCtaMessage] = useState<{ tone: 'info' | 'error'; text: string } | null>(null)

  const [avatars, setAvatars] = useState(clientAvatarIds)

  function run(
    action: () => Promise<{ ok: boolean; error?: string }>,
    setMessage: (m: { tone: 'info' | 'error'; text: string }) => void,
    clearDirty: () => void,
  ) {
    startTransition(async () => {
      const result = await action()
      if (!result.ok) return setMessage({ tone: 'error', text: result.error ?? 'Could not save.' })
      clearDirty()
      setMessage({ tone: 'info', text: 'Saved. Live on the portfolio within 30 seconds.' })
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <Section
        title="Hero"
        description="The first thing on the page. The typing animation cycles the words below; its speed and rhythm stay in the code."
        dirty={heroDirty}
        saving={pending}
        message={heroMessage}
        onSave={() =>
          run(
            () => saveHero({ ...heroValues, portraitId: heroValues.portraitId || null }),
            setHeroMessage,
            () => setHeroDirty(false),
          )
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Eyebrow" hint="The small line above the headline.">
              <Input
                value={heroValues.eyebrow}
                onChange={(e) => {
                  setHeroDirty(true)
                  setHeroValues((v) => ({ ...v, eyebrow: e.target.value }))
                }}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Heading" required hint="The fixed part, before the word that types itself.">
              <Input
                value={heroValues.titlePrefix}
                onChange={(e) => {
                  setHeroDirty(true)
                  setHeroValues((v) => ({ ...v, titlePrefix: e.target.value }))
                }}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <TagInput
              label="Typing words"
              hint="Cycled in this order, forever. The headline box is sized to the longest one."
              values={heroValues.typingWords}
              onChange={(next) => {
                setHeroDirty(true)
                setHeroValues((v) => ({ ...v, typingWords: next }))
              }}
            />
          </div>
          <MediaPicker
            label="Portrait"
            kind="image"
            value={heroValues.portraitId}
            onChange={(id) => {
              setHeroDirty(true)
              setHeroValues((v) => ({ ...v, portraitId: String(id) }))
            }}
          />
        </div>

        <details className="mt-4 rounded-lg border border-line p-3">
          <summary className="cursor-pointer text-xs font-medium text-muted">
            Fields the homepage does not render yet
          </summary>
          <p className="mb-3 mt-2 text-xs text-faint">
            The hero markup has no description or button today. These are stored so the content is
            ready if those get designed in — nothing here changes the live page.
          </p>
          <div className="flex flex-col gap-3">
            <Field label="Description">
              <Textarea
                rows={2}
                value={heroValues.description}
                onChange={(e) => {
                  setHeroDirty(true)
                  setHeroValues((v) => ({ ...v, description: e.target.value }))
                }}
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Button label">
                <Input
                  value={heroValues.primaryCtaLabel}
                  onChange={(e) => {
                    setHeroDirty(true)
                    setHeroValues((v) => ({ ...v, primaryCtaLabel: e.target.value }))
                  }}
                />
              </Field>
              <Field label="Button link">
                <Input
                  value={heroValues.primaryCtaUrl}
                  onChange={(e) => {
                    setHeroDirty(true)
                    setHeroValues((v) => ({ ...v, primaryCtaUrl: e.target.value }))
                  }}
                />
              </Field>
            </div>
          </div>
        </details>
      </Section>

      <Section
        title="Stats"
        description="The metric cards and the two chips beside them."
        dirty={statsDirty}
        saving={pending}
        message={statsMessage}
        onSave={() => run(() => saveStats(statsValues), setStatsMessage, () => setStatsDirty(false))}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Clients chip">
            <Input
              value={statsValues.clientsLabel}
              onChange={(e) => {
                setStatsDirty(true)
                setStatsValues((v) => ({ ...v, clientsLabel: e.target.value }))
              }}
            />
          </Field>
          <Field label="Availability chip">
            <Input
              value={statsValues.availabilityLabel}
              onChange={(e) => {
                setStatsDirty(true)
                setStatsValues((v) => ({ ...v, availabilityLabel: e.target.value }))
              }}
            />
          </Field>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          {statsValues.cards.map((card, index) => (
            <div key={card.id} className="rounded-lg border border-line p-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-faint">
                Card {index + 1}
              </p>
              <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
                <Field label="Value">
                  <Input
                    value={card.value}
                    onChange={(e) => {
                      setStatsDirty(true)
                      setStatsValues((v) => ({
                        ...v,
                        cards: v.cards.map((c, i) => (i === index ? { ...c, value: e.target.value } : c)),
                      }))
                    }}
                  />
                </Field>
                <Field label="Caption">
                  <Input
                    value={card.caption}
                    onChange={(e) => {
                      setStatsDirty(true)
                      setStatsValues((v) => ({
                        ...v,
                        cards: v.cards.map((c, i) => (i === index ? { ...c, caption: e.target.value } : c)),
                      }))
                    }}
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Blurb">
                    <Input
                      value={card.blurb}
                      onChange={(e) => {
                        setStatsDirty(true)
                        setStatsValues((v) => ({
                          ...v,
                          cards: v.cards.map((c, i) => (i === index ? { ...c, blurb: e.target.value } : c)),
                        }))
                      }}
                    />
                  </Field>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 border-t border-line pt-4">
          <MediaPicker
            label="Client avatars"
            kind="image"
            multiple
            value={avatars}
            onChange={(ids) => {
              const next = Array.isArray(ids) ? ids : [ids]
              setAvatars(next)
              run(() => saveClientAvatars(next), setStatsMessage, () => {})
            }}
          />
          <p className="mt-1 text-xs text-faint">Saved as soon as you change the selection.</p>
        </div>
      </Section>

      <Section
        title="Featured work"
        description="Which projects appear in the work grid, and in what order."
      >
        {featured.length === 0 ? (
          <p className="text-sm text-muted">
            Nothing is featured yet.{' '}
            <Link href="/admin/projects" className="text-accent-deep underline">
              Choose projects
            </Link>
            .
          </p>
        ) : (
          <>
            <ol className="flex flex-col gap-1">
              {featured.map((project, index) => (
                <li
                  key={project.id}
                  className="flex items-center gap-2 rounded-lg border border-line px-3 py-2"
                >
                  <span className="w-5 shrink-0 text-xs text-faint">{index + 1}</span>
                  <Link
                    href={`/admin/projects/${project.id}`}
                    className="flex-1 truncate text-sm text-ink hover:underline"
                  >
                    {project.title}
                  </Link>
                  <StatusBadge status={project.status} />
                </li>
              ))}
            </ol>
            <p className="mt-3 text-xs text-muted">
              These are Project records, not copies — edit or reorder them in{' '}
              <Link href="/admin/projects" className="text-accent-deep underline">
                Projects
              </Link>
              . The grid shows the first four.
            </p>
          </>
        )}
      </Section>

      <Section
        title="Contact"
        description="The Connect block at the bottom. The button's look and hover effect stay in the code."
        dirty={ctaDirty}
        saving={pending}
        message={ctaMessage}
        onSave={() => run(() => saveContactCta(ctaValues), setCtaMessage, () => setCtaDirty(false))}
      >
        <div className="flex flex-col gap-4">
          <Field label="Handwritten note" hint="The line above the button.">
            <Input
              value={ctaValues.note}
              onChange={(e) => {
                setCtaDirty(true)
                setCtaValues((v) => ({ ...v, note: e.target.value }))
              }}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Button label" required>
              <Input
                value={ctaValues.buttonLabel}
                onChange={(e) => {
                  setCtaDirty(true)
                  setCtaValues((v) => ({ ...v, buttonLabel: e.target.value }))
                }}
              />
            </Field>
            <Field label="Button link" required>
              <Input
                value={ctaValues.buttonUrl}
                onChange={(e) => {
                  setCtaDirty(true)
                  setCtaValues((v) => ({ ...v, buttonUrl: e.target.value }))
                }}
              />
            </Field>
          </div>
        </div>
      </Section>
    </div>
  )
}
