import { db } from '@/lib/db'
import { createTestimonial, reorderTestimonials } from './actions'
import { OrderableList } from '@/components/OrderableList'
import { mediaPayload } from '@/lib/media'
import { Button, EmptyState, PageHeader } from '@/components/ui'

export const dynamic = 'force-dynamic'

export default async function TestimonialsPage() {
  const items = await db.testimonial.findMany({
    orderBy: { displayOrder: 'asc' },
    include: { avatar: true },
  })

  return (
    <>
      <PageHeader
        title="Testimonials"
        description="What clients and colleagues have said. Separate from Mentors, which is its own section on the site."
        action={
          <form action={createTestimonial}>
            <Button type="submit">+ New testimonial</Button>
          </form>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          title="No testimonials yet."
          description="The portfolio has no testimonials section today, so this collection is intentionally empty. Add entries whenever you have them and they will be ready when a section exists to show them."
          action={
            <form action={createTestimonial}>
              <Button type="submit">+ Add a testimonial</Button>
            </form>
          }
        />
      ) : (
        <OrderableList
          onReorder={reorderTestimonials}
          rows={items.map((item) => ({
            id: item.id,
            href: `/admin/testimonials/${item.id}`,
            primary: item.name,
            secondary: [item.role, item.company].filter(Boolean).join(' · ') || undefined,
            meta: item.featured ? { text: '★ featured', tone: 'muted' as const } : undefined,
            status: item.status,
            thumbUrl: item.avatar ? mediaPayload(item.avatar).thumbUrl : null,
          }))}
        />
      )}
    </>
  )
}
