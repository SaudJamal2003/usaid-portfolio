import { db } from '@/lib/db'
import { PageHeader } from '@/components/ui'
import { HomepageEditor } from '@/components/HomepageEditor'

export const dynamic = 'force-dynamic'

export default async function HomepagePage() {
  const [hero, settings, cards, cta, featured, avatars] = await Promise.all([
    db.homepageHero.findUnique({ where: { id: 'singleton' } }),
    db.siteSettings.findUnique({ where: { id: 'singleton' } }),
    db.statCard.findMany({ orderBy: { displayOrder: 'asc' } }),
    db.contactCta.findUnique({ where: { id: 'singleton' } }),
    db.project.findMany({
      where: { featured: true, status: { not: 'ARCHIVED' } },
      orderBy: { displayOrder: 'asc' },
      select: { id: true, title: true, status: true, slug: true },
    }),
    db.clientAvatar.findMany({ orderBy: { displayOrder: 'asc' }, select: { mediaId: true } }),
  ])

  const text = (value: string | null | undefined) => value ?? ''

  return (
    <>
      <PageHeader
        title="Homepage"
        description="The content of each section on the home page. Layout, type and animation stay in the frontend."
      />
      <HomepageEditor
        hero={{
          eyebrow: text(hero?.eyebrow),
          titlePrefix: text(hero?.titlePrefix),
          typingWords: hero?.typingWords ?? [],
          description: text(hero?.description),
          primaryCtaLabel: text(hero?.primaryCtaLabel),
          primaryCtaUrl: text(hero?.primaryCtaUrl),
          portraitId: text(hero?.portraitId),
        }}
        stats={{
          clientsLabel: text(settings?.clientsLabel),
          availabilityLabel: text(settings?.availabilityLabel),
          cards: cards.map((card) => ({
            id: card.id,
            value: card.value,
            caption: card.caption,
            blurb: text(card.blurb),
          })),
        }}
        cta={{
          note: text(cta?.note),
          buttonLabel: text(cta?.buttonLabel),
          buttonUrl: text(cta?.buttonUrl),
        }}
        featured={featured}
        clientAvatarIds={avatars.map((a) => a.mediaId)}
      />
    </>
  )
}
