'use client'

import { useState, useTransition } from 'react'
import { BLOCK_META, BLOCK_TYPES, type BlockTypeName } from '@/lib/blocks'
import { addBlock, deleteBlock, reorderBlocks, updateBlock } from '@/app/admin/case-studies/actions'
import { MediaPicker } from './MediaPicker'
import { RichTextEditor } from './RichTextEditor'
import { Alert, Button, Card, Field, Input, Select, Textarea } from './ui'

export type EditorBlock = {
  id: string
  type: BlockTypeName
  data: Record<string, unknown>
}

/* Per-type fields. Deliberately narrow inputs -- no font, colour or spacing
   controls anywhere, because the portfolio owns how this renders (§3, §62.14).
   Exported: WebTemplateEditor reuses this directly, so a field added here for
   one editor stays correct for both. */
export function BlockFields({
  type,
  data,
  onChange,
}: {
  type: BlockTypeName
  data: Record<string, unknown>
  onChange: (next: Record<string, unknown>) => void
}) {
  const set = (key: string, value: unknown) => onChange({ ...data, [key]: value })
  const text = (key: string) => (data[key] as string) ?? ''

  switch (type) {
    case 'TEXT':
      return (
        <>
          <Field label="Heading">
            <Input value={text('heading')} onChange={(e) => set('heading', e.target.value)} />
          </Field>
          <Field label="Content" required>
            <RichTextEditor
              value={text('content')}
              placeholder="Write the section…"
              onChange={(html) => set('content', html)}
            />
          </Field>
        </>
      )

    case 'IMAGE':
    case 'FULL_WIDTH_IMAGE':
      return (
        <>
          <MediaPicker value={text('mediaId')} onChange={(id) => set('mediaId', id)} />
          <Field label="Caption">
            <Input value={text('caption')} onChange={(e) => set('caption', e.target.value)} />
          </Field>
        </>
      )

    case 'IMAGE_TEXT':
      return (
        <>
          <Field label="Heading">
            <Input value={text('heading')} onChange={(e) => set('heading', e.target.value)} />
          </Field>
          <Field label="Content" required>
            <RichTextEditor
              value={text('content')}
              placeholder="Write the section…"
              onChange={(html) => set('content', html)}
            />
          </Field>
          <MediaPicker value={text('mediaId')} onChange={(id) => set('mediaId', id)} />
          <Field label="Image position">
            <Select
              value={(data.imagePosition as string) ?? 'right'}
              onChange={(e) => set('imagePosition', e.target.value)}
            >
              <option value="right">Right</option>
              <option value="left">Left</option>
            </Select>
          </Field>
        </>
      )

    case 'GALLERY':
      return (
        <>
          <MediaPicker
            label="Images"
            multiple
            value={(data.mediaIds as string[]) ?? []}
            onChange={(ids) => set('mediaIds', ids)}
          />
          <Field label="Columns">
            <Select value={String(data.columns ?? 3)} onChange={(e) => set('columns', Number(e.target.value))}>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
            </Select>
          </Field>
        </>
      )

    case 'VIDEO':
      return (
        <>
          <MediaPicker
            label="Video file"
            kind="video"
            accept="video/mp4,video/webm"
            value={text('mediaId')}
            onChange={(id) => set('mediaId', id)}
          />
          <Field label="or external URL" hint="Use this instead of uploading a large file.">
            <Input value={text('externalUrl')} onChange={(e) => set('externalUrl', e.target.value)} />
          </Field>
          <Field label="Caption">
            <Input value={text('caption')} onChange={(e) => set('caption', e.target.value)} />
          </Field>
        </>
      )

    case 'QUOTE':
      return (
        <>
          <Field label="Quote" required>
            <Textarea rows={3} value={text('quote')} onChange={(e) => set('quote', e.target.value)} />
          </Field>
          <Field label="Attribution">
            <Input value={text('attribution')} onChange={(e) => set('attribution', e.target.value)} />
          </Field>
          <Field label="Role">
            <Input value={text('role')} onChange={(e) => set('role', e.target.value)} />
          </Field>
          <MediaPicker
            label="Portrait"
            value={text('portraitId')}
            onChange={(id) => set('portraitId', id)}
          />
        </>
      )

    case 'STATS': {
      const items = (data.items as { value: string; label: string }[]) ?? []
      return (
        <div className="flex flex-col gap-3">
          {items.map((item, index) => (
            <div key={index} className="flex items-end gap-2">
              <Field label={`Value ${index + 1}`}>
                <Input
                  value={item.value}
                  onChange={(e) => {
                    const next = [...items]
                    next[index] = { ...item, value: e.target.value }
                    set('items', next)
                  }}
                />
              </Field>
              <Field label="Label">
                <Input
                  value={item.label}
                  onChange={(e) => {
                    const next = [...items]
                    next[index] = { ...item, label: e.target.value }
                    set('items', next)
                  }}
                />
              </Field>
              <Button
                type="button"
                variant="ghost"
                onClick={() => set('items', items.filter((_, i) => i !== index))}
                disabled={items.length <= 1}
              >
                Remove
              </Button>
            </div>
          ))}
          {items.length < 6 && (
            <Button
              type="button"
              variant="secondary"
              className="self-start"
              onClick={() => set('items', [...items, { value: '', label: '' }])}
            >
              + Add statistic
            </Button>
          )}
        </div>
      )
    }

    case 'CTA':
      return (
        <>
          <Field label="Heading" required>
            <Input value={text('heading')} onChange={(e) => set('heading', e.target.value)} />
          </Field>
          <Field label="Description">
            <Textarea rows={2} value={text('description')} onChange={(e) => set('description', e.target.value)} />
          </Field>
          <Field label="Button label" required>
            <Input value={text('buttonLabel')} onChange={(e) => set('buttonLabel', e.target.value)} />
          </Field>
          <Field label="Button URL" required>
            <Input value={text('buttonUrl')} onChange={(e) => set('buttonUrl', e.target.value)} />
          </Field>
        </>
      )

    case 'HERO_STAT':
      return (
        <>
          <Field label="Value" required hint="e.g. 47%">
            <Input value={text('value')} onChange={(e) => set('value', e.target.value)} />
          </Field>
          <Field label="Title" required>
            <Input value={text('title')} onChange={(e) => set('title', e.target.value)} />
          </Field>
          <Field label="Description" required>
            <Textarea rows={2} value={text('description')} onChange={(e) => set('description', e.target.value)} />
          </Field>
        </>
      )

    case 'RESEARCH_INTRO':
      return (
        <>
          <Field label="Heading" required hint="The core insight -- this doubles as the section title.">
            <Textarea rows={2} value={text('heading')} onChange={(e) => set('heading', e.target.value)} />
          </Field>
          <Field label="Pull-quote" required>
            <Textarea rows={2} value={text('quote')} onChange={(e) => set('quote', e.target.value)} />
          </Field>
        </>
      )

    case 'INSIGHT_FINDING':
      return (
        <>
          <Field label="Title" required>
            <Input value={text('title')} onChange={(e) => set('title', e.target.value)} />
          </Field>
          <Field label="Body" required>
            <Textarea rows={3} value={text('body')} onChange={(e) => set('body', e.target.value)} />
          </Field>
        </>
      )

    case 'FULL_WIDTH_VIDEO':
      return (
        <>
          <MediaPicker
            label="Video file"
            kind="video"
            accept="video/mp4,video/webm"
            value={text('mediaId')}
            onChange={(id) => set('mediaId', id)}
          />
          <Field label="or external URL" hint="Use this instead of uploading a large file.">
            <Input value={text('externalUrl')} onChange={(e) => set('externalUrl', e.target.value)} />
          </Field>
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={(data.grayscale as boolean) ?? true}
              onChange={(e) => set('grayscale', e.target.checked)}
              className="size-4 accent-[color:var(--color-accent-deep)]"
            />
            Grayscale
          </label>
        </>
      )
  }
}

export function BlockEditor({
  caseStudyId,
  initialBlocks,
}: {
  caseStudyId: string
  initialBlocks: EditorBlock[]
}) {
  const [blocks, setBlocks] = useState(initialBlocks)
  const [openId, setOpenId] = useState<string | null>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function persistOrder(next: EditorBlock[]) {
    setBlocks(next)
    startTransition(async () => {
      await reorderBlocks(caseStudyId, next.map((b) => b.id))
    })
  }

  /* Arrow buttons alongside drag: reordering must not be mouse-only (§53). */
  function move(index: number, delta: number) {
    const target = index + delta
    if (target < 0 || target >= blocks.length) return
    const next = [...blocks]
    ;[next[index], next[target]] = [next[target], next[index]]
    persistOrder(next)
  }

  function onDrop(index: number) {
    if (dragIndex === null || dragIndex === index) return
    const next = [...blocks]
    const [moved] = next.splice(dragIndex, 1)
    next.splice(index, 0, moved)
    setDragIndex(null)
    persistOrder(next)
  }

  function add(type: BlockTypeName) {
    setError(null)
    startTransition(async () => {
      const result = await addBlock({
        caseStudyId,
        type,
        data: BLOCK_META[type].initial,
      })
      if (!result.ok) return setError(result.error)
      const block = { id: result.id, type, data: BLOCK_META[type].initial as Record<string, unknown> }
      setBlocks((current) => [...current, block])
      setOpenId(result.id)
    })
  }

  function save(block: EditorBlock) {
    setError(null)
    startTransition(async () => {
      const result = await updateBlock(block.id, block.type, block.data)
      if (!result.ok) return setError(result.error)
      setSaved(block.id)
      window.setTimeout(() => setSaved(null), 2000)
    })
  }

  function remove(id: string) {
    if (!window.confirm('Delete this block? This cannot be undone.')) return
    startTransition(async () => {
      await deleteBlock(id)
      setBlocks((current) => current.filter((b) => b.id !== id))
    })
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink">
          Content blocks {blocks.length > 0 && <span className="text-faint">({blocks.length})</span>}
        </h2>
        {pending && <span className="text-xs text-faint">Saving…</span>}
      </div>

      {error && (
        <div className="mb-3">
          <Alert tone="error">{error}</Alert>
        </div>
      )}

      {blocks.length === 0 && (
        <p className="mb-3 rounded-xl border border-dashed border-line-strong px-4 py-8 text-center text-sm text-muted">
          No blocks yet. Add one below to start building the case study.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {blocks.map((block, index) => (
          <Card
            key={block.id}
            draggable
            onDragStart={() => setDragIndex(index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDrop(index)}
            className={dragIndex === index ? 'opacity-50' : ''}
          >
            <div className="flex items-center gap-2 px-3 py-2.5">
              <span className="cursor-grab select-none text-faint" aria-hidden="true">
                ⠿
              </span>
              <button
                type="button"
                onClick={() => setOpenId(openId === block.id ? null : block.id)}
                aria-expanded={openId === block.id}
                className="flex-1 text-left text-sm font-medium text-ink"
              >
                {BLOCK_META[block.type].label}
                <span className="ml-2 text-xs font-normal text-faint">
                  {BLOCK_META[block.type].description}
                </span>
              </button>

              {saved === block.id && <span className="text-xs text-ok">Saved</span>}

              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                aria-label="Move block up"
                className="rounded px-1.5 text-muted hover:text-ink disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === blocks.length - 1}
                aria-label="Move block down"
                className="rounded px-1.5 text-muted hover:text-ink disabled:opacity-30"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => remove(block.id)}
                aria-label="Delete block"
                className="rounded px-1.5 text-muted hover:text-danger"
              >
                ×
              </button>
            </div>

            {openId === block.id && (
              <div className="flex flex-col gap-3 border-t border-line p-4">
                <BlockFields
                  type={block.type}
                  data={block.data}
                  onChange={(next) =>
                    setBlocks((current) =>
                      current.map((b) => (b.id === block.id ? { ...b, data: next } : b)),
                    )
                  }
                />
                <Button
                  type="button"
                  className="self-start"
                  onClick={() => save(blocks.find((b) => b.id === block.id)!)}
                >
                  Save block
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-line bg-raised p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-faint">Add a block</p>
        <div className="flex flex-wrap gap-2">
          {BLOCK_TYPES.map((type) => (
            <Button key={type} type="button" variant="secondary" onClick={() => add(type)}>
              + {BLOCK_META[type].label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
