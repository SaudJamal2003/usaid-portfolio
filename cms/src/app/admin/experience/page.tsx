import Link from 'next/link'
import type { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { createExperience } from './actions'
import { ExperienceOrder } from '@/components/ExperienceOrder'
import { Alert, Button, EmptyState, Input, PageHeader, Select } from '@/components/ui'

export const dynamic = 'force-dynamic'

export default async function ExperiencePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>
}) {
  const params = await searchParams
  const query = params.q?.trim() ?? ''
  const status = params.status ?? ''

  const where: Prisma.ExperienceWhereInput = {
    ...(query && {
      OR: [
        { company: { contains: query, mode: 'insensitive' } },
        { role: { contains: query, mode: 'insensitive' } },
      ],
    }),
    ...(status && { status: status as Prisma.EnumContentStatusFilter['equals'] }),
  }

  const items = await db.experience.findMany({ where, orderBy: { displayOrder: 'asc' } })
  const incomplete = items.filter(
    (item) => item.status !== 'PUBLISHED' && item.highlights.every((h) => h.startsWith('TODO')),
  ).length
  const filtered = Boolean(query || status)

  return (
    <>
      <PageHeader
        title="Experience"
        description="Roles on the journey timeline. Each one owns its own highlights."
        action={
          <form action={createExperience}>
            <Button type="submit">+ New role</Button>
          </form>
        }
      />

      {incomplete > 0 && (
        <div className="mb-5">
          <Alert tone="warn">
            {incomplete} role{incomplete === 1 ? '' : 's'} still carry placeholder highlights migrated
            from the portfolio&apos;s old shared list. Until they have real copy they stay in draft, and
            the timeline keeps rendering its bundled content.
          </Alert>
        </div>
      )}

      <form className="mb-4 flex flex-wrap gap-2">
        <Input name="q" defaultValue={query} placeholder="Search company or role…" className="w-full sm:max-w-xs" />
        <Select name="status" defaultValue={status} className="w-auto">
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </Select>
        <Button type="submit" variant="secondary">Apply</Button>
        {filtered && (
          <Link href="/admin/experience" className="inline-flex h-9 items-center px-2 text-sm text-muted hover:text-ink">
            Clear
          </Link>
        )}
      </form>

      {items.length === 0 ? (
        <EmptyState
          title={filtered ? 'No roles match those filters.' : 'No experience yet.'}
          description={
            filtered
              ? 'Try a different search term or clear the filters.'
              : 'Add your first role to start building the timeline.'
          }
        />
      ) : (
        <ExperienceOrder
          items={items.map((item) => ({
            id: item.id,
            company: item.company,
            role: item.role,
            period: item.isCurrent ? `${item.startDate} — Present` : `${item.startDate} — ${item.endDate ?? ''}`,
            highlightCount: item.highlights.length,
            hasPlaceholder: item.highlights.some((h) => h.startsWith('TODO')),
            status: item.status,
          }))}
        />
      )}
    </>
  )
}
