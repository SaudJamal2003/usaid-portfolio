import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { MentorForm, type MentorValues } from '@/components/MentorForm'

export const dynamic = 'force-dynamic'

export default async function EditMentor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const mentor = await db.mentor.findUnique({ where: { id } })
  if (!mentor) notFound()

  const initial: MentorValues = {
    id: mentor.id,
    name: mentor.name,
    role: mentor.role,
    tribute: mentor.tribute,
    linkedinUrl: mentor.linkedinUrl ?? '',
    photoId: mentor.photoId ?? '',
    status: mentor.status,
  }

  return (
    <>
      <div className="mb-5">
        <Link href="/admin/mentors" className="text-sm text-muted hover:text-ink">
          ← Mentors
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">{mentor.name}</h1>
      </div>
      <MentorForm initial={initial} />
    </>
  )
}
