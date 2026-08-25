import 'server-only'
import { db } from './db'
import { mediaPayload } from './media'
import { publicUrl } from './storage'

/**
 * The published-content payload the portfolio consumes.
 *
 * Every query here filters on status. That filter lives in this module and
 * nowhere else, so "published only" is a property of the data layer rather
 * than something each caller has to remember (§35, §62.11).
 */

const PUBLISHED = { status: 'PUBLISHED' } as const

const mediaSelect = {
  id: true,
  storageKey: true,
  altText: true,
  width: true,
  height: true,
  mimeType: true,
  renditions: true,
} as const

type MediaRow = {
  id: string
  storageKey: string
  altText: string | null
  width: number | null
  height: number | null
  mimeType: string
  renditions: unknown
}

const asMedia = (row: MediaRow | null) => (row ? mediaPayload(row) : null)

export async function buildPublicContent() {
  const [settings, hero, about, footer, contactCta, clientAvatars, nav, socials, stats, experience, mentors, gallery, services, testimonials, projects, caseStudies, seoRows] =
    await Promise.all([
      db.siteSettings.findUnique({
        where: { id: 'singleton' },
        include: { ogImage: { select: mediaSelect }, favicon: { select: mediaSelect } },
      }),
      db.homepageHero.findUnique({
        where: { id: 'singleton' },
        include: { portrait: { select: mediaSelect } },
      }),
      db.aboutContent.findUnique({
        where: { id: 'singleton' },
        include: { portrait: { select: mediaSelect } },
      }),
      db.footerSettings.findUnique({ where: { id: 'singleton' } }),
      db.contactCta.findUnique({ where: { id: 'singleton' } }),
      db.clientAvatar.findMany({
        orderBy: { displayOrder: 'asc' },
        include: { media: { select: mediaSelect } },
      }),
      db.navigationItem.findMany({ where: { visible: true }, orderBy: { displayOrder: 'asc' } }),
      db.socialLink.findMany({
        where: { visible: true },
        orderBy: { displayOrder: 'asc' },
        include: { icon: { select: mediaSelect } },
      }),
      db.statCard.findMany({ where: { visible: true }, orderBy: { displayOrder: 'asc' } }),
      db.experience.findMany({
        where: PUBLISHED,
        orderBy: { displayOrder: 'asc' },
        include: { logo: { select: mediaSelect } },
      }),
      db.mentor.findMany({
        where: PUBLISHED,
        orderBy: { displayOrder: 'asc' },
        include: { photo: { select: mediaSelect } },
      }),
      db.galleryItem.findMany({
        where: PUBLISHED,
        orderBy: { displayOrder: 'asc' },
        include: { image: { select: mediaSelect } },
      }),
      db.service.findMany({
        where: PUBLISHED,
        orderBy: { displayOrder: 'asc' },
        include: { icon: { select: mediaSelect } },
      }),
      db.testimonial.findMany({
        where: PUBLISHED,
        orderBy: { displayOrder: 'asc' },
        include: { avatar: { select: mediaSelect }, companyLogo: { select: mediaSelect } },
      }),
      db.project.findMany({
        where: PUBLISHED,
        orderBy: { displayOrder: 'asc' },
        include: { thumbnail: { select: mediaSelect }, caseStudy: { select: { slug: true, status: true } } },
      }),
      db.caseStudy.findMany({
        where: PUBLISHED,
        orderBy: { publishedAt: 'desc' },
        select: { slug: true, title: true, shortDescription: true, client: true },
      }),
      db.seoMetadata.findMany({ include: { ogImage: { select: mediaSelect } } }),
    ])

  return {
    settings: settings && {
      siteName: settings.siteName,
      siteDescription: settings.siteDescription,
      contactEmail: settings.contactEmail,
      location: settings.location,
      availabilityLabel: settings.availabilityLabel,
      clientsLabel: settings.clientsLabel,
      ogImage: asMedia(settings.ogImage),
      favicon: asMedia(settings.favicon),
    },
    hero: hero && {
      eyebrow: hero.eyebrow,
      titlePrefix: hero.titlePrefix,
      typingWords: hero.typingWords,
      description: hero.description,
      primaryCtaLabel: hero.primaryCtaLabel,
      primaryCtaUrl: hero.primaryCtaUrl,
      portrait: asMedia(hero.portrait),
    },
    about: about && { heading: about.heading, bio: about.bio, portrait: asMedia(about.portrait) },
    footer: footer && {
      description: footer.description,
      email: footer.email,
      copyright: footer.copyright,
      ctaLabel: footer.ctaLabel,
      ctaUrl: footer.ctaUrl,
    },
    contactCta: contactCta && {
      note: contactCta.note,
      buttonLabel: contactCta.buttonLabel,
      buttonUrl: contactCta.buttonUrl,
    },
    clientAvatars: clientAvatars.map((row) => asMedia(row.media)).filter(Boolean),
    navigation: nav.map((n) => ({ label: n.label, url: n.url, openInNewTab: n.openInNewTab })),
    socials: socials.map((s) => ({ platform: s.platform, url: s.url, icon: asMedia(s.icon) })),
    stats: stats.map((s) => ({ value: s.value, caption: s.caption, blurb: s.blurb })),
    experience: experience.map((e) => ({
      company: e.company,
      role: e.role,
      description: e.description,
      highlights: e.highlights,
      startDate: e.startDate,
      endDate: e.endDate,
      isCurrent: e.isCurrent,
      location: e.location,
      logo: asMedia(e.logo),
    })),
    mentors: mentors.map((m) => ({
      name: m.name,
      role: m.role,
      tribute: m.tribute,
      photo: asMedia(m.photo),
    })),
    gallery: gallery.map((g) => ({ caption: g.caption, image: asMedia(g.image) })),
    services: services.map((s) => ({ title: s.title, description: s.description, icon: asMedia(s.icon) })),
    testimonials: testimonials.map((t) => ({
      name: t.name,
      role: t.role,
      company: t.company,
      quote: t.quote,
      linkedinUrl: t.linkedinUrl,
      avatar: asMedia(t.avatar),
      companyLogo: asMedia(t.companyLogo),
    })),
    projects: projects.map((p) => ({
      title: p.title,
      slug: p.slug,
      shortDescription: p.shortDescription,
      aspectRatio: p.aspectRatio,
      thumbnail: asMedia(p.thumbnail),
      featured: p.featured,
      // A project only links through when its case study is itself published.
      caseStudySlug: p.caseStudy?.status === 'PUBLISHED' ? p.caseStudy.slug : null,
    })),
    caseStudies,
    /* Resolved metadata, entity value then global default.
       Stored and served, but NOT rendered per-route: hash routing means every
       URL returns the same index.html, and social scrapers do not run JS. This
       is here so a move to real paths is a wiring change. */
    seo: (() => {
      const byKey = new Map(seoRows.map((row) => [`${row.entityType}:${row.entityId}`, row]))
      const globalOg = settings?.ogImage ? mediaPayload(settings.ogImage) : null
      const resolve = (entityType: string, entityId: string) => {
        const row = byKey.get(`${entityType}:${entityId}`)
        return {
          title: row?.title ?? settings?.defaultSeoTitle ?? null,
          description: row?.description ?? settings?.defaultSeoDesc ?? null,
          canonicalUrl: row?.canonicalUrl ?? null,
          noIndex: row?.noIndex ?? false,
          ogImage: row?.ogImage ? mediaPayload(row.ogImage) : globalOg,
        }
      }
      return {
        defaults: {
          title: settings?.defaultSeoTitle ?? null,
          description: settings?.defaultSeoDesc ?? null,
          ogImage: globalOg,
        },
        homepage: resolve('homepage', 'singleton'),
        byProjectSlug: Object.fromEntries(projects.map((p) => [p.slug, resolve('project', p.id)])),
      }
    })(),
  }
}

export type PublicContent = Awaited<ReturnType<typeof buildPublicContent>>

/** Resolves the media ids inside block payloads into full URLs so the
 *  portfolio never has to make a second request per block. */
async function hydrateBlocks(blocks: { id: string; type: string; data: unknown }[]) {
  const ids = new Set<string>()
  for (const block of blocks) {
    const payload = block.data as Record<string, unknown>
    if (typeof payload?.mediaId === 'string') ids.add(payload.mediaId)
    if (Array.isArray(payload?.mediaIds)) for (const id of payload.mediaIds as string[]) ids.add(id)
  }

  const rows = ids.size
    ? await db.media.findMany({ where: { id: { in: [...ids] } }, select: mediaSelect })
    : []
  const byId = new Map(rows.map((row) => [row.id, mediaPayload(row)]))

  return blocks.map((block) => {
    const payload = { ...(block.data as Record<string, unknown>) }
    if (typeof payload.mediaId === 'string') payload.media = byId.get(payload.mediaId) ?? null
    if (Array.isArray(payload.mediaIds)) {
      payload.media = (payload.mediaIds as string[]).map((id) => byId.get(id) ?? null).filter(Boolean)
    }
    return { id: block.id, type: block.type, data: payload }
  })
}

export async function getCaseStudy(slug: string, options: { includeDrafts?: boolean } = {}) {
  const caseStudy = await db.caseStudy.findFirst({
    where: { slug, ...(options.includeDrafts ? {} : PUBLISHED) },
    include: {
      hero: { select: mediaSelect },
      thumbnail: { select: mediaSelect },
      blocks: { orderBy: { displayOrder: 'asc' } },
    },
  })
  if (!caseStudy) return null

  return {
    slug: caseStudy.slug,
    title: caseStudy.title,
    shortDescription: caseStudy.shortDescription,
    client: caseStudy.client,
    industry: caseStudy.industry,
    projectType: caseStudy.projectType,
    year: caseStudy.year,
    duration: caseStudy.duration,
    role: caseStudy.role,
    team: caseStudy.team,
    prototypeUrl: caseStudy.prototypeUrl,
    heroTitle: caseStudy.heroTitle,
    heroDescription: caseStudy.heroDescription,
    hero: asMedia(caseStudy.hero),
    thumbnail: asMedia(caseStudy.thumbnail),
    status: caseStudy.status,
    seo: await (async () => {
      const [row, settings] = await Promise.all([
        db.seoMetadata.findUnique({
          where: { entityType_entityId: { entityType: 'case_study', entityId: caseStudy.id } },
          include: { ogImage: { select: mediaSelect } },
        }),
        db.siteSettings.findUnique({ where: { id: 'singleton' }, include: { ogImage: { select: mediaSelect } } }),
      ])
      return {
        title: row?.title ?? settings?.defaultSeoTitle ?? null,
        description: row?.description ?? settings?.defaultSeoDesc ?? null,
        canonicalUrl: row?.canonicalUrl ?? null,
        noIndex: row?.noIndex ?? false,
        ogImage: row?.ogImage ? mediaPayload(row.ogImage) : settings?.ogImage ? mediaPayload(settings.ogImage) : null,
      }
    })(),
    blocks: await hydrateBlocks(caseStudy.blocks),
  }
}

export { publicUrl }
