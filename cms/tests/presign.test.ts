import { describe, expect, it } from 'vitest'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createS3Client, createStorage, storageKey } from '@/lib/storage-core'

/**
 * Guards the R2 presigned-upload contract.
 *
 * The bug these exist for: the SDK defaults requestChecksumCalculation to
 * WHEN_SUPPORTED, which signs a CRC32 of the request body. A presigned PUT has
 * no body at signing time, so the signed value is the CRC32 of nothing
 * (AAAAAA==) while the browser later sends real bytes. MinIO ignores the
 * header and accepts the upload; R2 validates it and rejects every one.
 *
 * The whole local test suite passed while this was broken, so these assertions
 * deliberately inspect the generated URL rather than the result of an upload.
 * No network, no MinIO, no R2 -- signing is entirely local.
 */

const CONFIG = {
  MINIO_ENDPOINT: 'https://accountid.r2.cloudflarestorage.com',
  MINIO_ROOT_USER: 'test-access-key-id',
  MINIO_ROOT_PASSWORD: 'test-secret-access-key',
  MINIO_BUCKET: 'portfolio-media',
  MEDIA_PUBLIC_URL: 'https://media.example.com',
}

async function presignWith(client: S3Client) {
  const url = await getSignedUrl(
    client,
    new PutObjectCommand({ Bucket: CONFIG.MINIO_BUCKET, Key: 'media/probe.mp4', ContentType: 'video/mp4' }),
    { expiresIn: 900 },
  )
  return new URL(url)
}

/** Query params, lowercased, so assertions do not depend on SDK casing. */
function params(url: URL) {
  return [...url.searchParams.entries()].map(([k, v]) => [k.toLowerCase(), v] as const)
}

describe('presigned upload URL (R2 compatibility)', () => {
  it('signs no body checksum, so the browser can send real bytes', async () => {
    const url = await presignWith(createS3Client(CONFIG))
    const keys = params(url).map(([k]) => k)

    expect(keys.filter((k) => k.startsWith('x-amz-checksum-'))).toEqual([])
    expect(keys).not.toContain('x-amz-sdk-checksum-algorithm')
  })

  it('never signs a checksum of an empty body', async () => {
    // AAAAAA== is CRC32 of zero bytes. If this ever appears, R2 rejects every
    // upload whose body is not empty -- which is every real upload.
    const url = await presignWith(createS3Client(CONFIG))
    for (const [, value] of params(url)) expect(value).not.toBe('AAAAAA==')
  })

  it('signs only host, which a browser PUT can satisfy', async () => {
    const url = await presignWith(createS3Client(CONFIG))
    const signed = params(url).find(([k]) => k === 'x-amz-signedheaders')?.[1]

    // Anything beyond host must be reproduced verbatim by the browser or the
    // signature fails; our uploader sends none of it.
    expect(signed).toBe('host')
  })

  it('addresses the bucket path-style, which R2 supports', async () => {
    const url = await presignWith(createS3Client(CONFIG))
    expect(url.pathname).toBe(`/${CONFIG.MINIO_BUCKET}/media/probe.mp4`)
    expect(url.hostname).toBe('accountid.r2.cloudflarestorage.com')
  })

  it('still produces a usable, expiring signature', async () => {
    const url = await presignWith(createS3Client(CONFIG))
    const keys = params(url).map(([k]) => k)

    expect(keys).toContain('x-amz-signature')
    expect(params(url).find(([k]) => k === 'x-amz-expires')?.[1]).toBe('900')
  })

  /* Proves the assertions above are sensitive to the setting rather than
     vacuously true: the default configuration must fail them. */
  it('would fail with the SDK default, confirming the guard is live', async () => {
    const defaulted = new S3Client({
      endpoint: CONFIG.MINIO_ENDPOINT,
      region: 'us-east-1',
      forcePathStyle: true,
      credentials: {
        accessKeyId: CONFIG.MINIO_ROOT_USER,
        secretAccessKey: CONFIG.MINIO_ROOT_PASSWORD,
      },
    })

    const keys = params(await presignWith(defaulted)).map(([k]) => k)
    expect(keys).toContain('x-amz-sdk-checksum-algorithm')
    expect(keys.some((k) => k.startsWith('x-amz-checksum-'))).toBe(true)
  })
})

describe('storage core is safe to import outside Next', () => {
  it('exposes no credentials by import alone', () => {
    // It takes config as an argument; importing it reads no process.env.
    expect(createStorage(CONFIG).publicUrl('media/x.png')).toBe('https://media.example.com/media/x.png')
  })

  it('generates keys that never echo the uploaded filename', () => {
    const key = storageKey('../../etc/passwd.png')
    expect(key).toMatch(/^media\/\d+-[a-f0-9]{16}\.png$/)
    expect(key).not.toContain('passwd')
  })
})
