import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { ServiceForm, type ServiceValues } from '@/components/ServiceForm'

export const dynamic = 'force-dynamic'

export default async function EditService({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const service = await db.service.findUnique({ where: { id } })
  if (!service) notFound()

  const initial: ServiceValues = {
    id: service.id,
    title: service.title,
    description: service.description,
    iconId: service.iconId ?? '',
    status: service.status,
  }

  return (
    <>
      <div className="mb-5">
        <Link href="/admin/services" className="text-sm text-muted hover:text-ink">
          ← Services
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">{service.title}</h1>
      </div>
      <ServiceForm initial={initial} />
    </>
  )
}
