import Link from 'next/link'
import { db } from '@/lib/db'
import type { Prisma } from '@prisma/client'
import { createCaseStudy } from './actions'
import { Button, Cell, EmptyState, Input, PageHeader, Row, Select, StatusBadge, Table } from '@/components/ui'

export const dynamic = 'force-dynamic'

const PER_PAGE = 10

export default async function CaseStudiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; sort?: string; page?: string }>
}) {
  const params = await searchParams
  const page = Math.max(1, Number(params.page) || 1)
  const query = params.q?.trim() ?? ''
  const status = params.status ?? ''
  const sort = params.sort ?? 'updated'

  const where: Prisma.CaseStudyWhereInput = {
    ...(query && {
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { client: { contains: query, mode: 'insensitive' } },
      ],
    }),
    ...(status && { status: status as Prisma.EnumContentStatusFilter['equals'] }),
  }

  const orderBy: Prisma.CaseStudyOrderByWithRelationInput =
    sort === 'title' ? { title: 'asc' } : sort === 'created' ? { createdAt: 'desc' } : { updatedAt: 'desc' }

  const [items, total] = await Promise.all([
    db.caseStudy.findMany({
      where,
      orderBy,
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: { _count: { select: { blocks: true } } },
    }),
    db.caseStudy.count({ where }),
  ])

  const pages = Math.max(1, Math.ceil(total / PER_PAGE))
  const filtered = Boolean(query || status)

  return (
    <>
      <PageHeader
        title="Case Studies"
        description="Long-form project write-ups built from content blocks."
        action={
          <form action={createCaseStudy}>
            <Button type="submit">+ New case study</Button>
          </form>
        }
      />

      <form className="mb-4 flex flex-wrap gap-2">
        <Input
          name="q"
          defaultValue={query}
          placeholder="Search by title or client…"
          className="w-full sm:max-w-xs"
        />
        <Select name="status" defaultValue={status} className="w-auto">
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </Select>
        <Select name="sort" defaultValue={sort} className="w-auto">
          <option value="updated">Recently updated</option>
          <option value="created">Newest first</option>
          <option value="title">Title A–Z</option>
        </Select>
        <Button type="submit" variant="secondary">
          Apply
        </Button>
        {filtered && (
          <Link
            href="/admin/case-studies"
            className="inline-flex h-9 items-center px-2 text-sm text-muted hover:text-ink"
          >
            Clear
          </Link>
        )}
      </form>

      {items.length === 0 ? (
        filtered ? (
          <EmptyState
            title="No case studies match those filters."
            description="Try a different search term or clear the filters."
          />
        ) : (
          <EmptyState
            title="No case studies yet."
            description="Create your first case study to start building out your portfolio."
            action={
              <form action={createCaseStudy}>
                <Button type="submit">+ Create case study</Button>
              </form>
            }
          />
        )
      ) : (
        <>
          <Table head={['Title', 'Client', 'Blocks', 'Status', 'Updated', '']}>
            {items.map((item) => (
              <Row key={item.id}>
                <Cell>
                  <Link href={`/admin/case-studies/${item.id}`} className="font-medium text-ink hover:underline">
                    {item.title}
                  </Link>
                  <span className="mt-0.5 block text-xs text-faint">/{item.slug}</span>
                </Cell>
                <Cell className="text-muted">{item.client ?? '—'}</Cell>
                <Cell className="text-muted">{item._count.blocks}</Cell>
                <Cell>
                  <StatusBadge status={item.status} />
                </Cell>
                <Cell className="whitespace-nowrap text-muted">
                  {item.updatedAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </Cell>
                <Cell className="text-right">
                  <Link
                    href={`/admin/case-studies/${item.id}`}
                    className="text-sm font-medium text-ink hover:underline"
                  >
                    Edit
                  </Link>
                </Cell>
              </Row>
            ))}
          </Table>

          <div className="mt-3 flex items-center justify-between text-sm text-muted">
            <span>
              {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, total)} of {total}
            </span>
            {pages > 1 && (
              <div className="flex gap-2">
                {page > 1 && (
                  <Link href={{ query: { ...params, page: page - 1 } }} className="hover:text-ink">
                    Previous
                  </Link>
                )}
                {page < pages && (
                  <Link href={{ query: { ...params, page: page + 1 } }} className="hover:text-ink">
                    Next
                  </Link>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </>
  )
}
