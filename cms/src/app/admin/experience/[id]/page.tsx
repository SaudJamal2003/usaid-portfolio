import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { ExperienceForm, type ExperienceValues } from '@/components/ExperienceForm'

export const dynamic = 'force-dynamic'

export default async function EditExperience({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const entry = await db.experience.findUnique({ where: { id } })
  if (!entry) notFound()

  const text = (value: string | null) => value ?? ''

  const initial: ExperienceValues = {
    id: entry.id,
    company: entry.company,
    role: entry.role,
    description: text(entry.description),
    highlights: entry.highlights,
    startDate: entry.startDate,
    endDate: text(entry.endDate),
    isCurrent: entry.isCurrent,
    location: text(entry.location),
    logoId: text(entry.logoId),
    status: entry.status,
  }

  return (
    <>
      <div className="mb-5">
        <Link href="/admin/experience" className="text-sm text-muted hover:text-ink">
          ← Experience
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
          {entry.company}
          {entry.role && <span className="text-muted"> · {entry.role}</span>}
        </h1>
      </div>

      <ExperienceForm initial={initial} />
    </>
  )
}
