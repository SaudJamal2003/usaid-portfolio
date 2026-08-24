import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { CaseStudyForm, type CaseStudyValues } from '@/components/CaseStudyForm'
import { BlockEditor, type EditorBlock } from '@/components/BlockEditor'
import type { BlockTypeName } from '@/lib/blocks'

export const dynamic = 'force-dynamic'

export default async function EditCaseStudy({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const caseStudy = await db.caseStudy.findUnique({
    where: { id },
    include: { blocks: { orderBy: { displayOrder: 'asc' } } },
  })
  if (!caseStudy) notFound()

  const text = (value: string | null) => value ?? ''

  const initial: CaseStudyValues = {
    id: caseStudy.id,
    title: caseStudy.title,
    slug: caseStudy.slug,
    shortDescription: text(caseStudy.shortDescription),
    client: text(caseStudy.client),
    industry: text(caseStudy.industry),
    projectType: text(caseStudy.projectType),
    year: text(caseStudy.year),
    duration: text(caseStudy.duration),
    role: text(caseStudy.role),
    team: text(caseStudy.team),
    externalUrl: text(caseStudy.externalUrl),
    prototypeUrl: text(caseStudy.prototypeUrl),
    heroTitle: text(caseStudy.heroTitle),
    heroDescription: text(caseStudy.heroDescription),
    heroId: text(caseStudy.heroId),
    thumbnailId: text(caseStudy.thumbnailId),
    featured: caseStudy.featured,
    status: caseStudy.status,
  }

  const blocks: EditorBlock[] = caseStudy.blocks.map((block) => ({
    id: block.id,
    type: block.type as BlockTypeName,
    data: (block.data ?? {}) as Record<string, unknown>,
  }))

  return (
    <>
      <div className="mb-5">
        <Link href="/admin/case-studies" className="text-sm text-muted hover:text-ink">
          ← Case Studies
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">{caseStudy.title}</h1>
      </div>

      <CaseStudyForm initial={initial} />

      <div className="mt-6">
        <BlockEditor caseStudyId={caseStudy.id} initialBlocks={blocks} />
      </div>
    </>
  )
}
