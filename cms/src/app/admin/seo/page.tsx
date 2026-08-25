import Link from 'next/link'
import { seoOverview } from '@/lib/seo'
import { SeoLimitationNotice } from '@/components/SeoFields'
import { Card, Cell, PageHeader, Row, StatusBadge, Table } from '@/components/ui'

export const dynamic = 'force-dynamic'

function Mark({ on }: { on: boolean }) {
  return on ? (
    <span className="text-ok" aria-label="set">
      ●
    </span>
  ) : (
    <span className="text-faint" aria-label="inherits global">
      ○
    </span>
  )
}

export default async function SeoPage() {
  const data = await seoOverview()
  const rows = [data.homepage, ...data.caseStudies, ...data.projects]

  return (
    <>
      <PageHeader
        title="SEO"
        description="Metadata for every indexable page, and the defaults everything else inherits."
      />

      <div className="mb-5">
        <SeoLimitationNotice />
      </div>

      <Card className="mb-5 p-4">
        <h2 className="text-sm font-semibold text-ink">Global defaults</h2>
        <p className="mt-0.5 text-xs text-muted">
          Inherited by any page without its own values. Edit in{' '}
          <Link href="/admin/settings" className="text-accent-deep underline">
            Site Settings
          </Link>
          .
        </p>
        <dl className="mt-3 grid gap-x-4 gap-y-1.5 text-sm sm:grid-cols-[140px_1fr]">
          <dt className="text-faint">Title</dt>
          <dd className="text-ink-soft">{data.global.title ?? <span className="text-warn">Not set</span>}</dd>
          <dt className="text-faint">Description</dt>
          <dd className="text-ink-soft">
            {data.global.description ?? <span className="text-warn">Not set</span>}
          </dd>
          <dt className="text-faint">OG image</dt>
          <dd className="text-ink-soft">
            {data.global.hasOgImage ? 'Set' : <span className="text-warn">Not set</span>}
          </dd>
        </dl>
      </Card>

      <p className="mb-2 text-xs text-muted">
        <span className="text-ok">●</span> has its own value · <span className="text-faint">○</span>{' '}
        inherits the global default
      </p>

      <Table head={['Page', 'Type', 'Title', 'Description', 'OG image', 'No-index', '']}>
        {rows.map((row) => {
          const href =
            row.entityType === 'case_study'
              ? `/admin/case-studies/${row.id}`
              : row.entityType === 'project'
                ? `/admin/projects/${row.id}`
                : '/admin/homepage'
          return (
            <Row key={`${row.entityType}:${row.id}`}>
              <Cell>
                <Link href={href} className="font-medium text-ink hover:underline">
                  {row.title}
                </Link>
                {row.slug && <span className="mt-0.5 block text-xs text-faint">/{row.slug}</span>}
              </Cell>
              <Cell className="text-muted">{row.entityType.replace('_', ' ')}</Cell>
              <Cell><Mark on={row.hasTitle} /></Cell>
              <Cell><Mark on={row.hasDescription} /></Cell>
              <Cell><Mark on={row.hasOgImage} /></Cell>
              <Cell>{row.noIndex ? <span className="text-warn">yes</span> : <span className="text-faint">no</span>}</Cell>
              <Cell><StatusBadge status={row.status} /></Cell>
            </Row>
          )
        })}
      </Table>
    </>
  )
}
