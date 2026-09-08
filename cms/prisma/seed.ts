/**
 * Seeds the CMS with the content that is currently hardcoded in the portfolio.
 *
 * Two rules, both from the requirements doc (§24, §9):
 *   - Nothing is invented. Where the portfolio has placeholder copy, or has no
 *     copy at all, the row is written with a TODO marker and left as a DRAFT so
 *     it cannot reach the public API by accident.
 *   - Experience highlights are per-role. The frontend currently shares one
 *     HIGHLIGHTS array across all four roles, so only the first role's bullets
 *     are real; the rest are marked for the owner to write.
 *
 * Idempotent: re-running upserts rather than duplicating.
 */
import { PrismaClient, ContentStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { readFile, stat } from 'node:fs/promises'
import { join, extname } from 'node:path'
import sharp from 'sharp'
import { createStorage, storageKey } from '../src/lib/storage-core'
import { parseEnv } from '../src/lib/env-schema'

const db = new PrismaClient()

/* Validated the same way the app validates it, but without the server-only
   guard the app's env module carries -- see env-schema.ts. */
const env = parseEnv(process.env)
const { putObject } = createStorage(env)

const ASSETS = join(process.cwd(), '..', 'my-app', 'src', 'assets', 'figma')

/** Files above this are left for manual upload through the CMS; the case study
 *  recording alone is ~99 MB and would make seeding unusable. */
const MAX_SEED_BYTES = 12 * 1024 * 1024

const MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
}

const skipped: string[] = []

/** Uploads a repo asset to MinIO and returns its Media id, or null if skipped. */
async function ingest(filename: string, altText: string): Promise<string | null> {
  const path = join(ASSETS, filename)

  let size: number
  try {
    size = (await stat(path)).size
  } catch {
    skipped.push(`${filename} (not found)`)
    return null
  }

  if (size > MAX_SEED_BYTES) {
    skipped.push(`${filename} (${(size / 1024 / 1024).toFixed(0)} MB, over seed limit)`)
    return null
  }

  const existing = await db.media.findFirst({ where: { originalFilename: filename } })
  if (existing) return existing.id

  const body = await readFile(path)
  const ext = extname(filename).toLowerCase()
  const mimeType = MIME[ext] ?? 'application/octet-stream'

  let width: number | undefined
  let height: number | undefined
  if (mimeType.startsWith('image/') && ext !== '.svg') {
    try {
      const meta = await sharp(body).metadata()
      width = meta.width
      height = meta.height
    } catch {
      /* dimensions are optional metadata */
    }
  }

  const key = storageKey(filename)
  await putObject(key, body, mimeType)

  const media = await db.media.create({
    data: {
      storageKey: key,
      originalFilename: filename,
      mimeType,
      size,
      width,
      height,
      altText,
    },
  })
  return media.id
}

const TODO = (what: string) => `TODO — ${what} needs to be written by the site owner.`

async function main() {
  console.log('Seeding from', ASSETS)

  // ---- owner ------------------------------------------------------------
  if (!env.OWNER_PASSWORD) throw new Error('OWNER_PASSWORD must be set to seed the owner account')
  const passwordHash = await bcrypt.hash(env.OWNER_PASSWORD, 12)
  await db.user.upsert({
    where: { email: env.OWNER_EMAIL },
    update: {},
    create: { email: env.OWNER_EMAIL, passwordHash, name: 'Usaid Ahmed', role: 'OWNER' },
  })
  console.log('  owner account ready')

  // ---- media ------------------------------------------------------------
  const heroPortrait = await ingest('hero-portrait.png', 'Usaid Ahmed portrait')
  const aboutNote = await ingest('about-note.png', 'Handwritten note')
  const mentorMain = await ingest('mentor-main.png', 'Tarib Ahmed')
  const mentorTwo = await ingest('mentor-polaroid-2.png', 'Mentor portrait')
  const mentorThree = await ingest('mentor-polaroid-1.png', 'Mentor portrait')
  const workShukar = await ingest('work-shukar-hai.png', 'Shukar Hai case study cover')
  const workCricpr = await ingest('work-cricpr.png', 'CricPR project cover')
  const workSprinto = await ingest('work-sprinto.png', 'Sprinto project cover')
  const workKaroCar = await ingest('work-karo-car.png', 'Karo Car project cover')
  const clientAvatars: (string | null)[] = []
  for (let n = 1; n <= 5; n += 1) {
    clientAvatars.push(await ingest(`client-${n}.png`, 'Client'))
  }
  const jobLogos = [
    await ingest('job-1.png', 'Bytecorp Technologies logo'),
    await ingest('job-2.png', 'Codefied logo'),
    await ingest('job-3.png', 'Techtree.io logo'),
    await ingest('job-4.png', 'Improdata logo'),
  ]
  console.log('  media ingested')

  // ---- singletons -------------------------------------------------------
  await db.siteSettings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      siteName: 'Usaid Ahmed',
      siteDescription:
        'Usaid Ahmed — product designer. Design is my favorite thing to overthink.',
      contactEmail: 'usaid.ahmedmay@gmail.com',
      availabilityLabel: 'Available for new projects',
      clientsLabel: '100+ Clients',
      defaultSeoTitle: 'Usaid Ahmed - UX Designer',
      defaultSeoDesc:
        'Usaid Ahmed — product designer. Design is my favorite thing to overthink.',
    },
  })

  await db.homepageHero.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      eyebrow: 'Hi, myself Usaid! Andd...',
      titlePrefix: 'Design is my favorite thing to',
      typingWords: ['Overthink', 'Question', 'Rethink', 'Simplify', 'Improve'],
      portraitId: heroPortrait,
    },
  })

  await db.aboutContent.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      heading: 'Hi, myself Usaid! Andd...',
      bio: "I'm a UX Designer who loves turning confusion into clarity and friction into flow. I combine research, empathy, and systems thinking to create products people don't have to fight with.  Because the best interface isn't the one with the most animations. It's the one users never have to think about.",
      portraitId: aboutNote,
    },
  })

  // The Connect block on the homepage. Only the words are content -- the
  // button's gradients and hover burst stay in the frontend.
  await db.contactCta.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      note: "Tap this 'tiny' button to highlight your product =)",
      buttonLabel: 'Connect',
      buttonUrl: '#contact',
    },
  })

  await db.footerSettings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: { id: 'singleton', email: 'usaid.ahmedmay@gmail.com' },
  })
  console.log('  singletons ready')

  // ---- navigation & socials --------------------------------------------
  const nav = [
    { label: 'Home', url: '#home' },
    { label: 'About', url: '/about' },
    { label: 'Work', url: '#work' },
  ]
  for (const [i, item] of nav.entries()) {
    await db.navigationItem.upsert({
      where: { id: `nav-${i}` },
      update: {},
      create: { id: `nav-${i}`, ...item, displayOrder: i },
    })
  }

  const socials = ['X', 'Instagram', 'Dribbble', 'Threads', 'LinkedIn']
  for (const [i, platform] of socials.entries()) {
    const iconId = await ingest(`social-${i + 1}.png`, `${platform} icon`)
    await db.socialLink.upsert({
      where: { id: `social-${i}` },
      update: { iconId },
      // The icons currently link to #contact rather than anywhere real, so the
      // URL is left blank for the owner to fill in. Visible, because they are
      // on the live site today.
      create: { id: `social-${i}`, platform, url: '', visible: true, displayOrder: i, iconId },
    })
  }
  for (const [index, mediaId] of clientAvatars.entries()) {
    if (!mediaId) continue
    await db.clientAvatar.upsert({
      where: { id: `client-avatar-${index}` },
      update: {},
      create: { id: `client-avatar-${index}`, mediaId, displayOrder: index },
    })
  }
  console.log('  navigation + socials + client avatars ready')

  // ---- stats ------------------------------------------------------------
  const stats = [
    { value: '90%', caption: 'Return on investment', blurb: 'Earn back on your investment within 30 days' },
    { value: '$2.5K+', caption: 'revenue Generated', blurb: 'Earn back on your investment within 30 days' },
    {
      value: '4.8/5',
      caption: 'Trusted by clients',
      blurb: 'I have delivered 50+ projects. helping service-based and product-based companies',
    },
  ]
  for (const [i, s] of stats.entries()) {
    await db.statCard.upsert({
      where: { id: `stat-${i}` },
      update: {},
      create: { id: `stat-${i}`, ...s, displayOrder: i },
    })
  }

  // ---- experience -------------------------------------------------------
  // Only the first role's bullets exist in the frontend; the other three
  // currently render the same array, which is the bug being fixed here.
  const realHighlights = [
    'Own end to end product design across Resident App, ERP, Payments, Helpdesk, and Smart Devices.',
    'Led the design and launch of QuickPass, now used across 500+ societies with 28,000+ downloads.',
    'Redesigned the Helpdesk ecosystem and contributed to large scale payments and access control experiences.',
  ]
  const roles = [
    { company: 'Bytecorp Technologies', role: 'Associate UX Designer', startDate: "Jan '26", endDate: null, isCurrent: true, highlights: realHighlights },
    { company: 'Codefied', role: 'UX Designer', startDate: "Jun '25", endDate: "Jan '26", isCurrent: false, highlights: [] },
    { company: 'Techtree.io', role: 'UX Designer', startDate: "Jun '25", endDate: "Jan '26", isCurrent: false, highlights: [] },
    { company: 'Improdata', role: 'UI/UX Designer Intern', startDate: "Jun '25", endDate: "Jan '26", isCurrent: false, highlights: [] },
  ]
  for (const [i, r] of roles.entries()) {
    await db.experience.upsert({
      where: { id: `exp-${i}` },
      update: {},
      create: {
        id: `exp-${i}`,
        ...r,
        location: 'KHI',
        logoId: jobLogos[i],
        displayOrder: i,
        description: r.highlights.length ? null : TODO(`highlights for ${r.company}`),
        // Roles without real bullets stay DRAFT so they cannot go public as-is.
        status: r.highlights.length ? ContentStatus.PUBLISHED : ContentStatus.DRAFT,
      },
    })
  }
  console.log('  experience ready (3 roles need bullets written)')

  // ---- mentors ----------------------------------------------------------
  /* All three are real. The owner wrote the second and third directly in
     Mentors.tsx after the first seed ran, so this migrates their words rather
     than inventing any. Photo assignment follows the frontend exactly. */
  const mentors = [
    {
      name: 'Tarib Ahmed',
      role: 'COO - Techtree',
      photoId: mentorMain,
      status: ContentStatus.PUBLISHED,
      tribute:
        'My brother, Tarib Ahmed, has been one of the most influential people in my life. More than a brother, he has been a mentor, guide, and constant source of support throughout my journey. From teaching me valuable lessons early on to helping me navigate challenges and opportunities, his advice and encouragement have shaped the way I think and grow. Through every high and low, he has always stood beside me, believing in me even when I doubted myself. Much of who I am today—both personally and professionally—is a reflection of the support, values, and confidence he helped instill in me.',
    },
    {
      name: 'Talha Yasin',
      role: 'Fractional Head of Design for SaaS & B2B Founders',
      photoId: mentorThree,
      status: ContentStatus.PUBLISHED,
      tribute:
        'Talha Yasin was one of the people who helped shape the way I approach UI design. He taught me how to move beyond simply recreating existing interfaces and start thinking about creating new flows and experiences from scratch. Through his guidance and mentorship, I learned how to explore different design approaches, practice consistently, and understand the reasoning behind good UI decisions. His feedback pushed me to experiment, improve my visual thinking, and become more confident in my design process. A lot of the fundamentals I rely on today were strengthened through the time I spent learning and practicing under his mentorship.',
    },
    {
      name: 'Asad Anwer',
      role: 'Co-founder - Bytecorp',
      photoId: mentorTwo,
      status: ContentStatus.PUBLISHED,
      tribute:
        'Asad Anwer played an important role in helping me understand UX and how design can be used to solve real-world problems. He taught me to look beyond the visuals and think deeply about users, their needs, behaviors, and the challenges they are trying to solve. His guidance helped me develop a stronger sense of direction when approaching design problems and understand how thoughtful design can turn user needs into meaningful experiences. He consistently pushed me to explore new ideas, learn new things, and keep improving my design thinking. Much of the way I approach UX today has been shaped by his guidance and mentorship.',
    },
  ]
  for (const [i, m] of mentors.entries()) {
    await db.mentor.upsert({
      where: { id: `mentor-${i}` },
      update: {},
      create: { id: `mentor-${i}`, ...m, displayOrder: i },
    })
  }
  console.log(`  ${mentors.length} mentors ready`)

  // ---- case study + projects -------------------------------------------
  const shukar = await db.caseStudy.upsert({
    where: { slug: 'shukar-hai' },
    update: {},
    create: {
      title: 'Shukar Hai',
      slug: 'shukar-hai',
      client: 'Osamah Nasir',
      role: 'UX Designer',
      duration: 'Apr - Jun 2025',
      projectType: 'Design Revamp',
      shortDescription:
        'Voice that finally works is here. Flow lets you create, code, message, and write at the speed of thought.',
      heroId: workShukar,
      thumbnailId: workShukar,
      featured: true,
      status: ContentStatus.PUBLISHED,
      publishedAt: new Date(),
    },
  })

  const projects = [
    { title: 'Shukar hai', slug: 'shukar-hai-project', cover: workShukar, aspect: '586/466', caseStudyId: shukar.id, blurb: 'Voice that finally works is here. Flow lets you create, code, message, and write at the speed of thought.' },
    { title: 'CricPR', slug: 'cricpr', cover: workCricpr, aspect: '675/466', caseStudyId: null, blurb: 'Voice that finally works is here. Flow lets you create, code, message, and write at the speed of thought, 4x faster than your keyboard.' },
    { title: 'Sprinto', slug: 'sprinto', cover: workSprinto, aspect: '675/466', caseStudyId: null, blurb: 'Voice that finally works is here. Flow lets you create, code, message, and write at the speed of thought, 4x faster than your keyboard.' },
    { title: 'Karo Car', slug: 'karo-car', cover: workKaroCar, aspect: '586/466', caseStudyId: null, blurb: 'Voice that finally works is here. Flow lets you create, code, message, and write at the speed of thought.' },
  ]
  for (const [i, p] of projects.entries()) {
    await db.project.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        title: p.title,
        slug: p.slug,
        shortDescription: p.blurb,
        thumbnailId: p.cover,
        aspectRatio: p.aspect,
        caseStudyId: p.caseStudyId,
        featured: true,
        displayOrder: i,
        status: ContentStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    })
  }
  console.log('  case study + 4 projects ready')

  // Services and testimonials have no counterpart in the portfolio today, so
  // there is nothing to migrate. The modules exist; the tables stay empty.

  await db.activityLog.create({
    data: { action: 'SEED', entityType: 'system', summary: 'Seeded CMS from existing portfolio content' },
  })

  if (skipped.length) {
    console.log('\n  skipped media (upload via the CMS if needed):')
    for (const s of skipped) console.log(`    - ${s}`)
  }
  console.log('\nSeed complete.')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
