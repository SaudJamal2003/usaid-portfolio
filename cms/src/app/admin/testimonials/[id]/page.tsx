import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { TestimonialForm, type TestimonialValues } from '@/components/TestimonialForm'

export const dynamic = 'force-dynamic'

export default async function EditTestimonial({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const testimonial = await db.testimonial.findUnique({ where: { id } })
  if (!testimonial) notFound()

  const text = (value: string | null) => value ?? ''

  const initial: TestimonialValues = {
    id: testimonial.id,
    name: testimonial.name,
    role: text(testimonial.role),
    company: text(testimonial.company),
    quote: testimonial.quote,
    linkedinUrl: text(testimonial.linkedinUrl),
    avatarId: text(testimonial.avatarId),
    companyLogoId: text(testimonial.companyLogoId),
    featured: testimonial.featured,
    status: testimonial.status,
  }

  return (
    <>
      <div className="mb-5">
        <Link href="/admin/testimonials" className="text-sm text-muted hover:text-ink">
          ← Testimonials
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">{testimonial.name}</h1>
      </div>
      <TestimonialForm initial={initial} />
    </>
  )
}
