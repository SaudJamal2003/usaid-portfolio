import { db } from '@/lib/db'
import { PageHeader } from '@/components/ui'
import { FooterEditor } from '@/components/FooterEditor'

export const dynamic = 'force-dynamic'

export default async function FooterPage() {
  const [footer, socials] = await Promise.all([
    db.footerSettings.findUnique({ where: { id: 'singleton' } }),
    db.socialLink.findMany({ orderBy: { displayOrder: 'asc' } }),
  ])

  const text = (value: string | null | undefined) => value ?? ''

  return (
    <>
      <PageHeader title="Footer" description="The email and the social row at the bottom of every page." />
      <FooterEditor
        initial={{
          email: text(footer?.email),
          description: text(footer?.description),
          copyright: text(footer?.copyright),
          ctaLabel: text(footer?.ctaLabel),
          ctaUrl: text(footer?.ctaUrl),
        }}
        socials={socials.map((s) => ({
          id: s.id,
          platform: s.platform,
          url: s.url,
          visible: s.visible,
          iconId: text(s.iconId),
        }))}
      />
    </>
  )
}
