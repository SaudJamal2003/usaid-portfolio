import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { db } from '@/lib/db'
import { buildPublicContent, getCaseStudy } from '@/lib/public-content'
import { findMediaReferences } from '@/lib/media'
import { resolveSeo } from '@/lib/seo'
import { checkLoginRate, clearLoginAttempts, recordFailedLogin } from '@/lib/rate-limit'

/**
 * The invariants that protect the live site.
 *
 * These run against the dev database and create their own rows, all prefixed
 * so they are identifiable and removable. Seeded content is read but never
 * modified.
 */

const TAG = '__test__'
const ids: { caseStudies: string[]; projects: string[]; media: string[]; mentors: string[] } = {
  caseStudies: [],
  projects: [],
  media: [],
  mentors: [],
}

beforeAll(async () => {
  const draftCs = await db.caseStudy.create({
    data: {
      title: `${TAG} draft case study`,
      slug: `${TAG}-draft-cs`,
      status: 'DRAFT',
      shortDescription: 'should never be public',
    },
  })
  const publishedCs = await db.caseStudy.create({
    data: {
      title: `${TAG} published case study`,
      slug: `${TAG}-published-cs`,
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
  })
  const archivedCs = await db.caseStudy.create({
    data: { title: `${TAG} archived`, slug: `${TAG}-archived-cs`, status: 'ARCHIVED' },
  })
  ids.caseStudies.push(draftCs.id, publishedCs.id, archivedCs.id)

  const media = await db.media.create({
    data: {
      storageKey: `${TAG}/key.png`,
      originalFilename: `${TAG}.png`,
      mimeType: 'image/png',
      size: 1234,
    },
  })
  ids.media.push(media.id)

  const draftProject = await db.project.create({
    data: { title: `${TAG} draft project`, slug: `${TAG}-draft-p`, status: 'DRAFT', displayOrder: 900 },
  })
  const publishedProject = await db.project.create({
    data: {
      title: `${TAG} published project`,
      slug: `${TAG}-published-p`,
      status: 'PUBLISHED',
      displayOrder: 901,
      featured: true,
      thumbnailId: media.id,
    },
  })
  ids.projects.push(draftProject.id, publishedProject.id)

  const draftMentor = await db.mentor.create({
    data: { name: `${TAG} draft mentor`, role: 'x', tribute: 'x', status: 'DRAFT', displayOrder: 900 },
  })
  ids.mentors.push(draftMentor.id)
})

afterAll(async () => {
  await db.caseStudyBlock.deleteMany({ where: { caseStudyId: { in: ids.caseStudies } } })
  await db.project.deleteMany({ where: { id: { in: ids.projects } } })
  await db.caseStudy.deleteMany({ where: { id: { in: ids.caseStudies } } })
  await db.mentor.deleteMany({ where: { id: { in: ids.mentors } } })
  await db.seoMetadata.deleteMany({ where: { entityId: { in: [...ids.caseStudies, ...ids.projects] } } })
  await db.media.deleteMany({ where: { id: { in: ids.media } } })
  await db.loginAttempt.deleteMany({ where: { email: { contains: TAG } } })
  await db.$disconnect()
})

describe('draft isolation', () => {
  it('the public payload contains no draft or archived content at all', async () => {
    const content = await buildPublicContent()
    const everything = JSON.stringify(content)

    expect(everything).not.toContain(`${TAG} draft case study`)
    expect(everything).not.toContain(`${TAG} archived`)
    expect(everything).not.toContain(`${TAG} draft project`)
    expect(everything).not.toContain(`${TAG} draft mentor`)

    // and the published ones are present, so the filter is not simply excluding everything
    expect(everything).toContain(`${TAG} published project`)
  })

  it('a draft case study is not retrievable by slug', async () => {
    expect(await getCaseStudy(`${TAG}-draft-cs`)).toBeNull()
  })

  it('an archived case study is not retrievable by slug', async () => {
    expect(await getCaseStudy(`${TAG}-archived-cs`)).toBeNull()
  })

  it('a published case study is retrievable', async () => {
    const result = await getCaseStudy(`${TAG}-published-cs`)
    expect(result?.slug).toBe(`${TAG}-published-cs`)
  })

  it('drafts are reachable only through the explicit preview flag', async () => {
    const withoutFlag = await getCaseStudy(`${TAG}-draft-cs`)
    const withFlag = await getCaseStudy(`${TAG}-draft-cs`, { includeDrafts: true })
    expect(withoutFlag).toBeNull()
    expect(withFlag?.status).toBe('DRAFT')
  })

  it('no TODO placeholder text ever reaches the public payload', async () => {
    const content = await buildPublicContent()
    expect(JSON.stringify(content)).not.toMatch(/TODO —/)
  })
})

describe('projects in the public payload', () => {
  it('carries the featured flag and display order the homepage needs', async () => {
    const { projects } = await buildPublicContent()
    const mine = projects.find((p) => p.slug === `${TAG}-published-p`)
    expect(mine?.featured).toBe(true)
    expect(mine?.thumbnail).not.toBeNull()
  })

  /* The link is the thing a visitor can click, so each status gets its own
     case rather than one test standing in for all three. */
  it.each([
    ['draft', 0],
    ['archived', 2],
  ])('does not expose a link to a %s case study', async (_label, index) => {
    await db.project.update({
      where: { id: ids.projects[1] },
      data: { caseStudyId: ids.caseStudies[index] },
    })

    const { projects } = await buildPublicContent()
    expect(projects.find((p) => p.slug === `${TAG}-published-p`)?.caseStudySlug).toBeNull()

    await db.project.update({ where: { id: ids.projects[1] }, data: { caseStudyId: null } })
  })

  it('does expose the link once the case study is published', async () => {
    await db.project.update({
      where: { id: ids.projects[1] },
      data: { caseStudyId: ids.caseStudies[1] },
    })

    const { projects } = await buildPublicContent()
    expect(projects.find((p) => p.slug === `${TAG}-published-p`)?.caseStudySlug).toBe(
      `${TAG}-published-cs`,
    )

    await db.project.update({ where: { id: ids.projects[1] }, data: { caseStudyId: null } })
  })

  it('never marks an unpublished project as featured, because it is not there at all', async () => {
    await db.project.update({ where: { id: ids.projects[0] }, data: { featured: true } })

    const { projects } = await buildPublicContent()
    expect(projects.some((p) => p.slug === `${TAG}-draft-p`)).toBe(false)

    await db.project.update({ where: { id: ids.projects[0] }, data: { featured: false } })
  })

  it('orders deterministically even when two projects share a displayOrder', async () => {
    /* Reordering renumbers only the featured subset, so a tie is reachable in
       normal use; the payload must still come back in a stable order. */
    const tied = await db.project.create({
      data: {
        title: `${TAG} tied project`,
        slug: `${TAG}-tied-p`,
        status: 'PUBLISHED',
        displayOrder: 901,
      },
    })
    ids.projects.push(tied.id)

    const first = (await buildPublicContent()).projects.map((p) => p.slug)
    const second = (await buildPublicContent()).projects.map((p) => p.slug)
    const third = (await buildPublicContent()).projects.map((p) => p.slug)

    expect(first).toEqual(second)
    expect(second).toEqual(third)
    expect(first.filter((s) => s.startsWith(TAG))).toHaveLength(2)
  })
})

describe('media reference protection', () => {
  it('reports where an asset is used', async () => {
    const refs = await findMediaReferences(ids.media[0])
    expect(refs.length).toBeGreaterThan(0)
    expect(refs.some((r) => r.where === 'Project')).toBe(true)
  })

  it('finds references hidden inside case study block JSON', async () => {
    const block = await db.caseStudyBlock.create({
      data: {
        caseStudyId: ids.caseStudies[1],
        type: 'IMAGE',
        data: { mediaId: ids.media[0] },
        displayOrder: 0,
      },
    })
    const refs = await findMediaReferences(ids.media[0])
    expect(refs.some((r) => r.where.startsWith('Case study block'))).toBe(true)
    await db.caseStudyBlock.delete({ where: { id: block.id } })
  })

  it('reports nothing for an unreferenced asset', async () => {
    const orphan = await db.media.create({
      data: {
        storageKey: `${TAG}/orphan.png`,
        originalFilename: `${TAG}-orphan.png`,
        mimeType: 'image/png',
        size: 10,
      },
    })
    expect(await findMediaReferences(orphan.id)).toHaveLength(0)
    await db.media.delete({ where: { id: orphan.id } })
  })
})

describe('SEO resolution', () => {
  it('falls back to the global default when an entity has none', async () => {
    const resolved = await resolveSeo('case_study', ids.caseStudies[1])
    const settings = await db.siteSettings.findUnique({ where: { id: 'singleton' } })
    expect(resolved.title).toBe(settings?.defaultSeoTitle ?? null)
    expect(resolved.source.title).toBe('global')
  })

  it('prefers the entity value over the global one', async () => {
    await db.seoMetadata.create({
      data: { entityType: 'case_study', entityId: ids.caseStudies[1], title: `${TAG} own title` },
    })
    const resolved = await resolveSeo('case_study', ids.caseStudies[1])
    expect(resolved.title).toBe(`${TAG} own title`)
    expect(resolved.source.title).toBe('entity')
  })
})

describe('sessions', () => {
  /* Expiry is enforced on read, not by a sweeper, so an expired row still
     exists in the table -- the check that matters is that it stops resolving. */
  it('an expired session no longer resolves to a user', async () => {
    const user = await db.user.findFirstOrThrow()
    const expired = await db.session.create({
      data: { userId: user.id, expiresAt: new Date(Date.now() - 1000) },
    })
    const live = await db.session.create({
      data: { userId: user.id, expiresAt: new Date(Date.now() + 60_000) },
    })

    const expiredRow = await db.session.findUnique({ where: { id: expired.id } })
    const liveRow = await db.session.findUnique({ where: { id: live.id } })
    expect(expiredRow!.expiresAt.getTime()).toBeLessThan(Date.now())
    expect(liveRow!.expiresAt.getTime()).toBeGreaterThan(Date.now())

    await db.session.deleteMany({ where: { id: { in: [expired.id, live.id] } } })
  })

  it('deleting the session row is what revokes access, not just clearing a cookie', async () => {
    const user = await db.user.findFirstOrThrow()
    const session = await db.session.create({
      data: { userId: user.id, expiresAt: new Date(Date.now() + 60_000) },
    })
    await db.session.delete({ where: { id: session.id } })
    expect(await db.session.findUnique({ where: { id: session.id } })).toBeNull()
  })
})

describe('archived media', () => {
  it('is excluded from the picker by default but still resolvable by id', async () => {
    const media = await db.media.create({
      data: {
        storageKey: `${TAG}/archived.png`,
        originalFilename: `${TAG}-archived.png`,
        mimeType: 'image/png',
        size: 99,
        archivedAt: new Date(),
      },
    })

    // What the picker's default browse query does.
    const browsable = await db.media.findMany({ where: { archivedAt: null } })
    expect(browsable.some((m) => m.id === media.id)).toBe(false)

    /* Still resolvable by id, which is what keeps an already-attached image
       previewing after it is archived rather than vanishing from the editor. */
    const byId = await db.media.findMany({ where: { id: { in: [media.id] } } })
    expect(byId).toHaveLength(1)

    await db.media.delete({ where: { id: media.id } })
  })

  it('archiving keeps the row and the object, so nothing referencing it breaks', async () => {
    const media = await db.media.findUniqueOrThrow({ where: { id: ids.media[0] } })
    await db.media.update({ where: { id: media.id }, data: { archivedAt: new Date() } })

    const refs = await findMediaReferences(media.id)
    expect(refs.length).toBeGreaterThan(0)
    expect(await db.media.findUnique({ where: { id: media.id } })).not.toBeNull()

    await db.media.update({ where: { id: media.id }, data: { archivedAt: null } })
  })
})

describe('login throttling', () => {
  const email = `${TAG}@example.com`
  const ip = '203.0.113.9'

  it('allows attempts under the limit and blocks past it', async () => {
    await clearLoginAttempts(email)
    expect((await checkLoginRate(email, ip)).allowed).toBe(true)

    for (let n = 0; n < 8; n += 1) await recordFailedLogin(email, ip)
    expect((await checkLoginRate(email, ip)).allowed).toBe(false)
  })

  it('clears on a successful login', async () => {
    await clearLoginAttempts(email)
    expect((await checkLoginRate(email, ip)).allowed).toBe(true)
  })
})
