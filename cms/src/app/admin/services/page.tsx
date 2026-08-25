import { db } from '@/lib/db'
import { createService, reorderServices } from './actions'
import { OrderableList } from '@/components/OrderableList'
import { Button, EmptyState, PageHeader } from '@/components/ui'

export const dynamic = 'force-dynamic'

export default async function ServicesPage() {
  const items = await db.service.findMany({
    orderBy: { displayOrder: 'asc' },
    include: { icon: { select: { id: true } } },
  })

  return (
    <>
      <PageHeader
        title="Services"
        description="What you offer. Nothing here appears on the site until a section is designed for it."
        action={
          <form action={createService}>
            <Button type="submit">+ New service</Button>
          </form>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          title="No services yet."
          description="The portfolio has no services section today, so this collection is intentionally empty. Add entries here whenever you want them, and they will be ready when a section exists to show them."
          action={
            <form action={createService}>
              <Button type="submit">+ Add a service</Button>
            </form>
          }
        />
      ) : (
        <OrderableList
          onReorder={reorderServices}
          rows={items.map((item) => ({
            id: item.id,
            href: `/admin/services/${item.id}`,
            primary: item.title,
            secondary: item.description.slice(0, 90) || undefined,
            meta: item.iconId ? undefined : { text: 'no icon', tone: 'muted' as const },
            status: item.status,
          }))}
        />
      )}
    </>
  )
}
