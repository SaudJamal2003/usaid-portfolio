import Link from 'next/link'
import type { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { mediaPayload } from '@/lib/media'
import { createMentor, reorderMentors } from './actions'
import { OrderableList } from '@/components/OrderableList'
import { Button, EmptyState, Input, PageHeader, Select } from '@/components/ui'

export const dynamic = 'force-dynamic'

export default async function MentorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; sort?: string }>
}) {
  const params = await searchParams
  const query = params.q?.trim() ?? ''
  const status = params.status ?? ''
  const sort = params.sort ?? 'order'

  const where: Prisma.MentorWhereInput = {
    ...(query && {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { role: { contains: query, mode: 'insensitive' } },
      ],
    }),
    ...(status && { status: status as Prisma.EnumContentStatusFilter['equals'] }),
  }

  const orderBy: Prisma.MentorOrderByWithRelationInput =
    sort === 'name' ? { name: 'asc' } : { displayOrder: 'asc' }

  const items = await db.mentor.findMany({ where, orderBy, include: { photo: true } })
  const filtered = Boolean(query || status)

  return (
    <>
      <PageHeader
        title="Mentors"
        description="The people credited in the mentors carousel. A separate collection from Testimonials."
        action={
          <form action={createMentor}>
            <Button type="submit">+ New mentor</Button>
          </form>
        }
      />

      <form className="mb-4 flex flex-wrap gap-2">
        <Input name="q" defaultValue={query} placeholder="Search name or role…" className="w-full sm:max-w-xs" />
        <Select name="status" defaultValue={status} className="w-auto">
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </Select>
        <Select name="sort" defaultValue={sort} className="w-auto">
          <option value="order">Display order</option>
          <option value="name">Name A–Z</option>
        </Select>
        <Button type="submit" variant="secondary">Apply</Button>
        {filtered && (
          <Link href="/admin/mentors" className="inline-flex h-9 items-center px-2 text-sm text-muted hover:text-ink">
            Clear
          </Link>
        )}
      </form>

      {items.length === 0 ? (
        <EmptyState
          title={filtered ? 'No mentors match those filters.' : 'No mentors yet.'}
          description={
            filtered
              ? 'Try a different search term or clear the filters.'
              : 'Add the people who shaped your work and they will appear in the carousel.'
          }
        />
      ) : (
        <OrderableList
          onReorder={reorderMentors}
          rows={items.map((mentor) => ({
            id: mentor.id,
            href: `/admin/mentors/${mentor.id}`,
            primary: mentor.name,
            secondary: mentor.role || undefined,
            meta: !mentor.photoId
              ? { text: 'no photo', tone: 'warn' as const }
              : !mentor.tribute.trim()
                ? { text: 'no tribute', tone: 'warn' as const }
                : undefined,
            status: mentor.status,
            thumbUrl: mentor.photo ? mediaPayload(mentor.photo).thumbUrl : null,
          }))}
        />
      )}
    </>
  )
}
