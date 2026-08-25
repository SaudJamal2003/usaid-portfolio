import 'server-only'
import { db } from './db'
import { mediaPayload } from './media'

/**
 * SEO metadata, resolved.
 *
 * ── What this does and does not do ──────────────────────────────────────────
 *
 * It stores and resolves metadata. It does **not** give the portfolio
 * per-route metadata that a crawler or a social scraper will see, and nothing
 * in this file should be read as claiming otherwise.
 *
 * The portfolio is a Vite SPA on hash routing (`#/work/shukar-hai`). A URL
 * fragment is never sent to the server, so every route is served the same
 * index.html with the same static tags. Slack, LinkedIn, X and Facebook do not
 * execute JavaScript at all, so anything React writes into document.head after
 * load is invisible to them. Google sometimes renders JS, but treats
 * client-injected tags as a weak signal at best.
 *
 * So today:
 *   - the live <meta> and og: tags come from my-app/index.html, globally
 *   - values stored here drive the browser tab title and are ready to be used
 *     properly the day the portfolio moves to real paths with prerendering
 *
 * That migration is the only thing that makes per-page SEO real. Until then
 * this module is a well-formed store, not a fix.
 */

export type ResolvedSeo = {
  title: string | null
  description: string | null
  canonicalUrl: string | null
  noIndex: boolean
  ogImage: ReturnType<typeof mediaPayload> | null
  /** Which layer each value came from, so the UI can show what is inherited. */
  source: { title: 'entity' | 'global' | 'none'; description: 'entity' | 'global' | 'none' }
}

const mediaSelect = {
  id: true,
  storageKey: true,
  altText: true,
  width: true,
  height: true,
  mimeType: true,
  renditions: true,
} as const

/**
 * Entity value, then the global default, then nothing.
 *
 * The chain lives here rather than in each consumer, so "inherits from global"
 * means the same thing everywhere.
 */
export async function resolveSeo(entityType: string, entityId: string): Promise<ResolvedSeo> {
  const [entity, settings] = await Promise.all([
    db.seoMetadata.findUnique({
      where: { entityType_entityId: { entityType, entityId } },
      include: { ogImage: { select: mediaSelect } },
    }),
    db.siteSettings.findUnique({
      where: { id: 'singleton' },
      include: { ogImage: { select: mediaSelect } },
    }),
  ])

  const title = entity?.title ?? settings?.defaultSeoTitle ?? null
  const description = entity?.description ?? settings?.defaultSeoDesc ?? null
  const ogRow = entity?.ogImage ?? settings?.ogImage ?? null

  return {
    title,
    description,
    canonicalUrl: entity?.canonicalUrl ?? null,
    noIndex: entity?.noIndex ?? false,
    ogImage: ogRow ? mediaPayload(ogRow) : null,
    source: {
      title: entity?.title ? 'entity' : settings?.defaultSeoTitle ? 'global' : 'none',
      description: entity?.description ? 'entity' : settings?.defaultSeoDesc ? 'global' : 'none',
    },
  }
}

export type SeoInput = {
  title?: string | null
  description?: string | null
  canonicalUrl?: string | null
  noIndex?: boolean
  ogImageId?: string | null
}

/** Upserts one entity's overrides. Blank values are stored as null so they
 *  fall through to the global default rather than overriding it with "". */
export async function saveSeoFor(entityType: string, entityId: string, input: SeoInput) {
  const data = {
    title: input.title?.trim() || null,
    description: input.description?.trim() || null,
    canonicalUrl: input.canonicalUrl?.trim() || null,
    noIndex: input.noIndex ?? false,
    ogImageId: input.ogImageId || null,
  }

  await db.seoMetadata.upsert({
    where: { entityType_entityId: { entityType, entityId } },
    update: data,
    create: { entityType, entityId, ...data },
  })
}

/** Everything with its own overrides, for the overview screen. */
export async function seoOverview() {
  const [caseStudies, projects, rows, settings] = await Promise.all([
    db.caseStudy.findMany({
      where: { status: { not: 'ARCHIVED' } },
      orderBy: { title: 'asc' },
      select: { id: true, title: true, slug: true, status: true },
    }),
    db.project.findMany({
      where: { status: { not: 'ARCHIVED' } },
      orderBy: { displayOrder: 'asc' },
      select: { id: true, title: true, slug: true, status: true },
    }),
    db.seoMetadata.findMany(),
    db.siteSettings.findUnique({ where: { id: 'singleton' } }),
  ])

  const byKey = new Map(rows.map((row) => [`${row.entityType}:${row.entityId}`, row]))
  const decorate = (entityType: string) => (item: { id: string; title: string; slug: string; status: string }) => {
    const row = byKey.get(`${entityType}:${item.id}`)
    return {
      ...item,
      entityType,
      hasTitle: Boolean(row?.title),
      hasDescription: Boolean(row?.description),
      hasOgImage: Boolean(row?.ogImageId),
      noIndex: row?.noIndex ?? false,
    }
  }

  return {
    global: {
      title: settings?.defaultSeoTitle ?? null,
      description: settings?.defaultSeoDesc ?? null,
      hasOgImage: Boolean(settings?.ogImageId),
    },
    homepage: decorate('homepage')({ id: 'singleton', title: 'Homepage', slug: '', status: 'PUBLISHED' }),
    caseStudies: caseStudies.map(decorate('case_study')),
    projects: projects.map(decorate('project')),
  }
}
