import { db } from '@/lib/db'
import { PageHeader } from '@/components/ui'
import { NavigationEditor } from '@/components/NavigationEditor'

export const dynamic = 'force-dynamic'

export default async function NavigationPage() {
  const items = await db.navigationItem.findMany({ orderBy: { displayOrder: 'asc' } })

  return (
    <>
      <PageHeader
        title="Navigation"
        description="The links in the site header. This controls the portfolio only — the CMS has its own navigation and cannot be affected from here."
      />
      <NavigationEditor
        initial={items.map((item) => ({
          id: item.id,
          label: item.label,
          url: item.url,
          openInNewTab: item.openInNewTab,
          visible: item.visible,
        }))}
      />
    </>
  )
}
