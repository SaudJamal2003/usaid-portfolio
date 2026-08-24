import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { Card, LinkButton, PageHeader } from '@/components/ui'

export const dynamic = 'force-dynamic'

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

export default async function Dashboard() {
  const user = await getSessionUser()

  const [caseStudies, projects, media, drafts, activity] = await Promise.all([
    db.caseStudy.count({ where: { status: { not: 'ARCHIVED' } } }),
    db.project.count({ where: { status: { not: 'ARCHIVED' } } }),
    db.media.count(),
    // Surfaced prominently: the seed intentionally left TODO content as DRAFT,
    // and it stays invisible on the site until it is completed.
    Promise.all([
      db.experience.count({ where: { status: 'DRAFT' } }),
      db.mentor.count({ where: { status: 'DRAFT' } }),
      db.caseStudy.count({ where: { status: 'DRAFT' } }),
      db.project.count({ where: { status: 'DRAFT' } }),
    ]).then((counts) => counts.reduce((total, n) => total + n, 0)),
    db.activityLog.findMany({ orderBy: { createdAt: 'desc' }, take: 6 }),
  ])

  const stats = [
    { label: 'Case Studies', value: caseStudies, href: '/admin/case-studies' },
    { label: 'Projects', value: projects, href: '/admin/projects' },
    { label: 'Media', value: media, href: '/admin/media' },
    { label: 'Drafts', value: drafts, href: '/admin/case-studies' },
  ]

  return (
    <>
      <PageHeader
        title={`Welcome back${user?.name ? `, ${user.name.split(' ')[0]}` : ''}.`}
        description="An overview of what is on the site and what still needs attention."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-faint">{stat.label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-ink">{stat.value}</p>
          </Card>
        ))}
      </div>

      {drafts > 0 && (
        <Card className="mt-6 border-warn/20 bg-warn-bg p-4">
          <p className="text-sm font-medium text-warn">
            {drafts} item{drafts === 1 ? '' : 's'} still in draft
          </p>
          <p className="mt-1 text-sm text-warn/80">
            Draft content never reaches the public site. Three experience roles and two mentors were
            migrated without real copy and are waiting on you.
          </p>
          <div className="mt-3 flex gap-2">
            <LinkButton href="/admin/experience" variant="secondary">
              Complete experience
            </LinkButton>
            <LinkButton href="/admin/mentors" variant="secondary">
              Complete mentors
            </LinkButton>
          </div>
        </Card>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_260px]">
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold text-ink">Recent activity</h2>
          {activity.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">Nothing has happened yet.</p>
          ) : (
            <ul className="flex flex-col">
              {activity.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-baseline justify-between gap-4 border-b border-line py-2.5 last:border-0"
                >
                  <span className="text-sm text-ink-soft">{entry.summary}</span>
                  <span className="shrink-0 text-xs text-faint">{relativeTime(entry.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold text-ink">Quick actions</h2>
          <div className="flex flex-col gap-2">
            <LinkButton href="/admin/case-studies/new" variant="secondary">
              New case study
            </LinkButton>
            <LinkButton href="/admin/projects/new" variant="secondary">
              New project
            </LinkButton>
            <LinkButton href="/admin/media" variant="secondary">
              Upload media
            </LinkButton>
            <LinkButton href="/admin/homepage" variant="secondary">
              Edit homepage
            </LinkButton>
          </div>
        </Card>
      </div>
    </>
  )
}
