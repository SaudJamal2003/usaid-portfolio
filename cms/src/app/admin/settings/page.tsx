import { db } from '@/lib/db'
import { PageHeader } from '@/components/ui'
import { SettingsEditor } from '@/components/SettingsEditor'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const settings = await db.siteSettings.findUnique({ where: { id: 'singleton' } })
  const text = (value: string | null | undefined) => value ?? ''

  return (
    <>
      <PageHeader
        title="Site Settings"
        description="Global identity and defaults. Secrets live in environment variables, never here."
      />
      <SettingsEditor
        initial={{
          siteName: text(settings?.siteName),
          siteDescription: text(settings?.siteDescription),
          contactEmail: text(settings?.contactEmail),
          location: text(settings?.location),
          availabilityLabel: text(settings?.availabilityLabel),
          clientsLabel: text(settings?.clientsLabel),
          defaultSeoTitle: text(settings?.defaultSeoTitle),
          defaultSeoDesc: text(settings?.defaultSeoDesc),
          ogImageId: text(settings?.ogImageId),
          faviconId: text(settings?.faviconId),
        }}
      />
    </>
  )
}
