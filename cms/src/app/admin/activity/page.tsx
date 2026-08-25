import Link from 'next/link'
import type { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { Cell, EmptyState, PageHeader, Row, Select, Button, Table } from '@/components/ui'

export const dynamic = 'force-dynamic'

const PER_PAGE = 30

/* Only the actions that are actually written. Building this list from the data
   would let a typo in one action silently create a new filter option. */
const ACTIONS = [
  'CREATE',
  'UPDATE',
  'PUBLISH',
  'UNPUBLISH',
  'ARCHIVE',
  'RESTORE',
  'DELETE',
  'DUPLICATE',
  'REORDER',
  'UPLOAD',
  'REPLACE',
  'LOGIN',
  'SEED',
]

const TONE: Record<string, string> = {
  PUBLISH: 'text-ok',
  DELETE: 'text-danger',
  ARCHIVE: 'text-warn',
  UNPUBLISH: 'text-warn',
}

function relativeTime(date: Date) {
  const seconds = Math.round((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`
  const days = Math.round(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; entity?: string; page?: string }>
}) {
  const params = await searchParams
  const page = Math.max(1, Number(params.page) || 1)
  const action = params.action ?? ''
  const entity = params.entity ?? ''

  const where: Prisma.ActivityLogWhereInput = {
    ...(action && { action }),
    ...(entity && { entityType: entity }),
  }

  const [entries, total, entityTypes] = await Promise.all([
    db.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: { user: { select: { name: true, email: true } } },
    }),
    db.activityLog.count({ where }),
    db.activityLog.findMany({ select: { entityType: true }, distinct: ['entityType'] }),
  ])

  const pages = Math.max(1, Math.ceil(total / PER_PAGE))
  const filtered = Boolean(action || entity)

  return (
    <>
      <PageHeader
        title="Activity"
        description="Every meaningful change: what happened, to what, by whom and when. Routine edits only — nothing is recorded per keystroke."
      />

      <form className="mb-4 flex flex-wrap gap-2">
        <Select name="action" defaultValue={action} className="w-auto">
          <option value="">All actions</option>
          {ACTIONS.map((value) => (
            <option key={value} value={value}>
              {value.charAt(0) + value.slice(1).toLowerCase()}
            </option>
          ))}
        </Select>
        <Select name="entity" defaultValue={entity} className="w-auto">
          <option value="">All content types</option>
          {entityTypes.map((row) => (
            <option key={row.entityType} value={row.entityType}>
              {row.entityType.replace(/_/g, ' ')}
            </option>
          ))}
        </Select>
        <Button type="submit" variant="secondary">
          Apply
        </Button>
        {filtered && (
          <Link href="/admin/activity" className="inline-flex h-9 items-center px-2 text-sm text-muted hover:text-ink">
            Clear
          </Link>
        )}
      </form>

      {entries.length === 0 ? (
        <EmptyState
          title={filtered ? 'Nothing matches those filters.' : 'No activity recorded yet.'}
          description={
            filtered
              ? 'Try a different action or content type, or clear the filters.'
              : 'Changes made through the CMS will appear here as they happen.'
          }
        />
      ) : (
        <>
          <Table head={['What happened', 'Action', 'Type', 'Who', 'When']}>
            {entries.map((entry) => (
              <Row key={entry.id}>
                <Cell className="text-ink-soft">{entry.summary}</Cell>
                <Cell>
                  <span className={`text-xs font-medium ${TONE[entry.action] ?? 'text-muted'}`}>
                    {entry.action.charAt(0) + entry.action.slice(1).toLowerCase()}
                  </span>
                </Cell>
                <Cell className="text-muted">{entry.entityType.replace(/_/g, ' ')}</Cell>
                <Cell className="text-muted">
                  {entry.user?.name ?? entry.user?.email ?? <span className="text-faint">system</span>}
                </Cell>
                <Cell className="whitespace-nowrap text-muted" title={entry.createdAt.toISOString()}>
                  {relativeTime(entry.createdAt)}
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
