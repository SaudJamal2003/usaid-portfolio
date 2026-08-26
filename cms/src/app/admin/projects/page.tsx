import Link from 'next/link'
import type { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { createProject } from './actions'
import { FeaturedOrder } from '@/components/FeaturedOrder'
import { Button, Cell, EmptyState, Input, PageHeader, Row, Select, StatusBadge, Table } from '@/components/ui'

export const dynamic = 'force-dynamic'

const PER_PAGE = 10

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; category?: string; sort?: string; page?: string }>
}) {
  const params = await searchParams
  const page = Math.max(1, Number(params.page) || 1)
  const query = params.q?.trim() ?? ''
  const status = params.status ?? ''
  const category = params.category ?? ''
  const sort = params.sort ?? 'order'

  const where: Prisma.ProjectWhereInput = {
    ...(query && {
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { shortDescription: { contains: query, mode: 'insensitive' } },
      ],
    }),
    ...(status && { status: status as Prisma.EnumContentStatusFilter['equals'] }),
    ...(category && { category }),
  }

  /* Every sort carries a tiebreaker so paging is stable: without one, two rows
     with the same value can swap between page 1 and page 2. */
  const orderBy: Prisma.ProjectOrderByWithRelationInput[] =
    sort === 'title' ? [{ title: 'asc' }, { createdAt: 'asc' }]
    : sort === 'updated' ? [{ updatedAt: 'desc' }, { createdAt: 'asc' }]
    : [{ displayOrder: 'asc' }, { createdAt: 'asc' }]

  const [items, total, featured, categories] = await Promise.all([
    db.project.findMany({
      where,
      orderBy,
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: { caseStudy: { select: { title: true } } },
    }),
    db.project.count({ where }),
    db.project.findMany({
      where: { featured: true, status: { not: 'ARCHIVED' } },
      orderBy: { displayOrder: 'asc' },
      select: { id: true, title: true, status: true },
    }),
    // Only categories that exist, so the filter never offers a dead option.
    db.project.findMany({
      where: { category: { not: null } },
      select: { category: true },
      distinct: ['category'],
    }),
  ])

  const pages = Math.max(1, Math.ceil(total / PER_PAGE))
  const filtered = Boolean(query || status || category)

  return (
    <>
      <PageHeader
        title="Projects"
        description="Portfolio entries. Featured projects appear on the homepage, in the order set below."
        action={
          <form action={createProject}>
            <Button type="submit">+ New project</Button>
          </form>
        }
      />

      <FeaturedOrder projects={featured} />

      <form className="mb-4 flex flex-wrap gap-2">
        <Input name="q" defaultValue={query} placeholder="Search projects…" className="w-full sm:max-w-xs" />
        <Select name="status" defaultValue={status} className="w-auto">
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </Select>
        {categories.length > 0 && (
          <Select name="category" defaultValue={category} className="w-auto">
            <option value="">All categories</option>
            {categories.map((row) => (
              <option key={row.category} value={row.category!}>
                {row.category}
              </option>
            ))}
          </Select>
        )}
        <Select name="sort" defaultValue={sort} className="w-auto">
          <option value="order">Display order</option>
          <option value="updated">Recently updated</option>
          <option value="title">Title A–Z</option>
        </Select>
        <Button type="submit" variant="secondary">
          Apply
        </Button>
        {filtered && (
          <Link href="/admin/projects" className="inline-flex h-9 items-center px-2 text-sm text-muted hover:text-ink">
            Clear
          </Link>
        )}
      </form>

      {items.length === 0 ? (
        filtered ? (
          <EmptyState
            title="No projects match those filters."
            description="Try a different search term or clear the filters."
          />
        ) : (
          <EmptyState
            title="No projects yet."
            description="Add your first project to start filling out the work section."
            action={
              <form action={createProject}>
                <Button type="submit">+ Create project</Button>
              </form>
            }
          />
        )
      ) : (
        <>
          <Table head={['Title', 'Category', 'Case study', 'Featured', 'Status', '']}>
            {items.map((project) => (
              <Row key={project.id}>
                <Cell>
                  <Link href={`/admin/projects/${project.id}`} className="font-medium text-ink hover:underline">
                    {project.title}
                  </Link>
                  <span className="mt-0.5 block text-xs text-faint">/{project.slug}</span>
                </Cell>
                <Cell className="text-muted">{project.category ?? '—'}</Cell>
                <Cell className="text-muted">{project.caseStudy?.title ?? '—'}</Cell>
                <Cell>
                  {project.featured ? (
                    <span className="text-accent-deep" title="Featured on the homepage">
                      ★
                    </span>
                  ) : (
                    <span className="text-faint">—</span>
                  )}
                </Cell>
                <Cell>
                  <StatusBadge status={project.status} />
                </Cell>
                <Cell className="text-right">
                  <Link href={`/admin/projects/${project.id}`} className="text-sm font-medium text-ink hover:underline">
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
              <div className="flex gap-3">
                {page > 1 && (
                  <Link href={{ query: { ...params, page: page - 1 } }} className="hover:text-ink">
                    Previous
                  </Link>
                )}
                <span className="text-faint">
                  {page} / {pages}
                </span>
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
