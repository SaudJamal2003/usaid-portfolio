import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { resolve } from 'node:path'
import { PrismaClient } from '@prisma/client'
import { DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { createS3Client } from '@/lib/storage-core'
import { parseEnv } from '@/lib/env-schema'

/**
 * Verifies the seed actually seeds, against a genuinely clean database.
 *
 * This exists because an earlier audit ran `npm run db:seed >/dev/null 2>&1`
 * and then compared row counts. The seed was crashing on an import; stderr was
 * discarded; the counts were unchanged *because nothing ran*; and unchanged
 * counts were reported as "idempotent". A failed seed was indistinguishable
 * from a successful one. So exit status and the completion sentinel are
 * asserted first, and no count assertion is reachable until they hold.
 *
 * It seeds a throwaway database rather than the shared dev one: dev accrues
 * legitimate manual uploads, so exact counts there drift and an exact-count
 * assertion would either be wrong or have to be loosened into uselessness.
 */

const execFileAsync = promisify(execFile)
const CMS_DIR = resolve(__dirname, '..')
const TEMP_DB = 'portfolio_cms_seedtest'

/** The seed ingests every repo asset under its size limit. The case study
 *  recording is far above it and is uploaded through the CMS instead. */
const EXPECTED_MEDIA = 23

const env = parseEnv(process.env)
const s3 = createS3Client(env)

const tempUrl = env.DATABASE_URL.replace(/\/[^/?]+(\?|$)/, `/${TEMP_DB}$1`)
const adminUrl = env.DATABASE_URL.replace(/\/[^/?]+(\?|$)/, '/postgres$1')

type Run = { code: number; stdout: string; stderr: string }

async function run(command: string): Promise<Run> {
  try {
    const { stdout, stderr } = await execFileAsync(command, {
      cwd: CMS_DIR,
      shell: true,
      maxBuffer: 10 * 1024 * 1024,
      env: { ...process.env, DATABASE_URL: tempUrl, DIRECT_URL: tempUrl },
    })
    return { code: 0, stdout, stderr }
  } catch (error) {
    const e = error as { code?: number; stdout?: string; stderr?: string }
    return { code: e.code ?? 1, stdout: e.stdout ?? '', stderr: e.stderr ?? '' }
  }
}

/** The gate every count assertion must pass through. */
function assertSeedSucceeded(r: Run, label: string) {
  expect(r.code, `${label}: seed exited ${r.code}\n${r.stderr}`).toBe(0)
  expect(r.stdout, `${label}: seed did not report completion`).toContain('Seed complete.')
  expect(r.stderr).not.toMatch(/server-only|Cannot find module|ERR_/i)
}

async function objectExists(key: string) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: env.MINIO_BUCKET, Key: key }))
    return true
  } catch {
    return false
  }
}

const admin = new PrismaClient({ datasourceUrl: adminUrl })
let db: PrismaClient

type Snapshot = {
  media: { id: string; storageKey: string; originalFilename: string }[]
  counts: Record<string, number>
}

async function snapshot(): Promise<Snapshot> {
  return {
    media: await db.media.findMany({
      select: { id: true, storageKey: true, originalFilename: true },
      orderBy: { storageKey: 'asc' },
    }),
    counts: {
      media: await db.media.count(),
      projects: await db.project.count(),
      caseStudies: await db.caseStudy.count(),
      blocks: await db.caseStudyBlock.count(),
      experience: await db.experience.count(),
      mentors: await db.mentor.count(),
      navigation: await db.navigationItem.count(),
      socials: await db.socialLink.count(),
      clientAvatars: await db.clientAvatar.count(),
      stats: await db.statCard.count(),
      users: await db.user.count(),
    },
  }
}

let first: Run
let second: Run
let afterFirst: Snapshot
let afterSecond: Snapshot

beforeAll(async () => {
  await admin.$executeRawUnsafe(`DROP DATABASE IF EXISTS ${TEMP_DB}`)
  await admin.$executeRawUnsafe(`CREATE DATABASE ${TEMP_DB}`)

  const migrated = await run('npx prisma migrate deploy')
  expect(migrated.code, `migrate failed\n${migrated.stderr}`).toBe(0)

  db = new PrismaClient({ datasourceUrl: tempUrl })

  first = await run('npm run db:seed')
  assertSeedSucceeded(first, 'first run')
  afterFirst = await snapshot()

  second = await run('npm run db:seed')
  assertSeedSucceeded(second, 'second run')
  afterSecond = await snapshot()
}, 300_000)

afterAll(async () => {
  // Remove the objects this test's seed uploaded, then the database.
  for (const m of afterFirst?.media ?? []) {
    await s3.send(new DeleteObjectCommand({ Bucket: env.MINIO_BUCKET, Key: m.storageKey })).catch(() => {})
  }
  await db?.$disconnect()
  await admin.$executeRawUnsafe(`DROP DATABASE IF EXISTS ${TEMP_DB}`).catch(() => {})
  await admin.$disconnect()
}, 120_000)

describe('seed runs under plain Node', () => {
  it('exits zero and reports completion', () => {
    assertSeedSucceeded(first, 'first run')
  })

  it('is not tripped by the server-only guard on application modules', () => {
    // The seed reaches storage through storage-core, not storage.ts.
    expect(first.stderr).not.toMatch(/server-only/i)
  })
})

describe('seeding a clean database', () => {
  it(`ingests exactly ${EXPECTED_MEDIA} media rows`, () => {
    expect(afterFirst.media).toHaveLength(EXPECTED_MEDIA)
  })

  it('uploads an object for every media row', async () => {
    const missing: string[] = []
    for (const m of afterFirst.media) {
      if (!(await objectExists(m.storageKey))) missing.push(m.originalFilename)
    }
    expect(missing, `missing objects: ${missing.join(', ')}`).toEqual([])
  })

  it('creates the owner account and the portfolio content', () => {
    expect(afterFirst.counts.users).toBe(1)
    expect(afterFirst.counts.projects).toBeGreaterThan(0)
    expect(afterFirst.counts.mentors).toBeGreaterThan(0)
  })

  it('never stores a duplicate filename', () => {
    const names = afterFirst.media.map((m) => m.originalFilename)
    expect(new Set(names).size).toBe(names.length)
  })
})

describe('seed is idempotent', () => {
  it('creates no duplicate rows on a second run', () => {
    expect(afterSecond.media).toHaveLength(EXPECTED_MEDIA)
  })

  it('leaves the same rows in place, not replacements', () => {
    expect(afterSecond.media.map((m) => m.id)).toEqual(afterFirst.media.map((m) => m.id))
  })

  it('does not re-upload to new storage keys', () => {
    expect(afterSecond.media.map((m) => m.storageKey)).toEqual(afterFirst.media.map((m) => m.storageKey))
  })

  it('leaves every content table identical', () => {
    expect(afterSecond.counts).toEqual(afterFirst.counts)
  })
})
