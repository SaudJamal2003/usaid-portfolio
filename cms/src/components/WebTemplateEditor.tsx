'use client'

import { useState, useTransition } from 'react'
import { updateBlock, ensureWebTemplateBlocks } from '@/app/admin/case-studies/actions'
import { BlockFields, type EditorBlock } from './BlockEditor'
import { Alert, Button, Card } from './ui'

/**
 * The Web case-study template.
 *
 * Unlike BlockEditor, this shows a fixed set of sections in a fixed order --
 * no add, remove, drag, or reorder controls anywhere. Consistency across
 * every Web case study comes from that absence of discretion, not from a
 * separate schema; the blocks underneath are the same CaseStudyBlock rows,
 * validated the same way, reusing BlockFields for every input (§ case study
 * category). Mirrors Shukar Hai's own section order exactly.
 */

type Section = {
  heading: string
  hint?: string
  blocks: EditorBlock[]
}

function groupIntoSections(blocks: EditorBlock[]): Section[] {
  const by = (type: EditorBlock['type']) => blocks.filter((b) => b.type === type)

  return [
    { heading: 'Hero — stat cards', hint: 'All 3 shown together on the live page.', blocks: by('HERO_STAT') },
    { heading: 'The Problem', blocks: by('IMAGE_TEXT') },
    { heading: 'What was getting in the way?', blocks: by('TEXT') },
    { heading: 'Research — core insight', blocks: by('RESEARCH_INTRO') },
    { heading: 'Research — findings', hint: 'All 4 shown together, numbered 01–04.', blocks: by('INSIGHT_FINDING') },
    { heading: 'Iterating in multiple directions', blocks: by('GALLERY') },
    { heading: 'Prototype video', blocks: by('VIDEO') },
    { heading: 'Full-width video band', blocks: by('FULL_WIDTH_VIDEO') },
    { heading: 'Testimonial', blocks: by('QUOTE') },
  ]
}

function BlockCard({ block }: { block: EditorBlock }) {
  const [data, setData] = useState(block.data)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  function save() {
    setError(null)
    startTransition(async () => {
      const result = await updateBlock(block.id, block.type, data)
      if (!result.ok) return setError(result.error)
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2000)
    })
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-line p-3">
      <BlockFields type={block.type} data={data} onChange={setData} />
      {error && <Alert tone="error">{error}</Alert>}
      <div className="flex items-center gap-2">
        <Button type="button" onClick={save} disabled={pending} className="self-start">
          Save
        </Button>
        {saved && <span className="text-xs text-ok">Saved</span>}
      </div>
    </div>
  )
}

export function WebTemplateEditor({
  caseStudyId,
  initialBlocks,
}: {
  caseStudyId: string
  initialBlocks: EditorBlock[]
}) {
  // Membership never changes here -- no add/remove/reorder -- only each
  // block's own data does, and BlockCard owns that locally.
  const blocks = initialBlocks
  const [settingUp, startTransition] = useTransition()

  const sections = groupIntoSections(blocks)
  const missing = blocks.length === 0

  function setUp() {
    startTransition(async () => {
      await ensureWebTemplateBlocks(caseStudyId)
      // The action revalidates the page; a full block re-fetch happens on
      // the next server render, which router.refresh() upstream triggers.
      window.location.reload()
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-semibold text-ink">Web template</h2>
        <p className="mt-0.5 text-xs text-muted">
          Every Web case study uses this same structure, in this order — matching the Shukar Hai
          reference case study section for section. Nothing here can be added, removed, or reordered.
        </p>
      </div>

      {missing ? (
        <Card className="p-5">
          <p className="mb-3 text-sm text-muted">This case study has no template sections yet.</p>
          <Button type="button" onClick={setUp} disabled={settingUp}>
            Set up template
          </Button>
        </Card>
      ) : (
        sections.map((section) => (
          <Card key={section.heading} className="p-5">
            <h3 className="text-sm font-semibold text-ink">{section.heading}</h3>
            {section.hint && <p className="mt-0.5 text-xs text-muted">{section.hint}</p>}
            <div className="mt-3 flex flex-col gap-3">
              {section.blocks.length === 0 ? (
                <Alert tone="error">
                  This section is missing a block. Try reopening the page, or contact support.
                </Alert>
              ) : (
                section.blocks.map((block) => <BlockCard key={block.id} block={block} />)
              )}
            </div>
          </Card>
        ))
      )}
    </div>
  )
}
