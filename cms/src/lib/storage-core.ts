/**
 * S3-compatible storage, with no runtime guard and no ambient credentials.
 *
 * Everything here takes its configuration as an argument, so the seed can use
 * the identical client the application uses without importing anything behind
 * `server-only`. Credentials are never read from process.env in this file --
 * importing it exposes nothing.
 *
 * storage.ts binds this to the validated env and keeps the guard.
 */
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { randomBytes } from 'node:crypto'
import { extname } from 'node:path'

export type StorageConfig = {
  MINIO_ENDPOINT: string
  MINIO_ROOT_USER: string
  MINIO_ROOT_PASSWORD: string
  MINIO_BUCKET: string
  MEDIA_PUBLIC_URL: string
}

/* Never trust the uploaded filename for the storage key -- it is attacker
   controlled and ends up in a URL. Keep only the extension, after validating
   it, and generate the rest (§21). */
export function storageKey(originalFilename: string, prefix = 'media') {
  const ext = extname(originalFilename).toLowerCase().replace(/[^.a-z0-9]/g, '')
  return `${prefix}/${Date.now()}-${randomBytes(8).toString('hex')}${ext}`
}

/**
 * One client shape for MinIO and R2 alike.
 *
 * forcePathStyle: MinIO serves buckets as /bucket/key rather than as a
 * subdomain. R2 supports path style too, so this is safe for both.
 *
 * requestChecksumCalculation: the SDK defaults to WHEN_SUPPORTED, which adds
 * x-amz-sdk-checksum-algorithm and a CRC32 of the body to every PutObject. For
 * a *presigned* PUT there is no body at signing time, so the signed value is
 * the CRC32 of nothing -- AAAAAA==. MinIO ignores the header, which is why
 * this was invisible locally; R2 validates it and rejects the real upload.
 * WHEN_REQUIRED omits the checksum for PutObject, which does not require one.
 */
export function createS3Client(config: StorageConfig) {
  return new S3Client({
    endpoint: config.MINIO_ENDPOINT,
    region: 'us-east-1',
    forcePathStyle: true,
    requestChecksumCalculation: 'WHEN_REQUIRED',
    credentials: {
      accessKeyId: config.MINIO_ROOT_USER,
      secretAccessKey: config.MINIO_ROOT_PASSWORD,
    },
  })
}

export function createStorage(config: StorageConfig) {
  const s3 = createS3Client(config)

  async function putObject(key: string, body: Buffer, contentType: string) {
    await s3.send(
      new PutObjectCommand({
        Bucket: config.MINIO_BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    )
    return key
  }

  async function deleteObject(key: string) {
    await s3.send(new DeleteObjectCommand({ Bucket: config.MINIO_BUCKET, Key: key }))
  }

  function publicUrl(key: string) {
    return `${config.MEDIA_PUBLIC_URL.replace(/\/$/, '')}/${key}`
  }

  return { s3, putObject, deleteObject, publicUrl }
}
