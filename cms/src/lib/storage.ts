// Holds the MinIO credentials. Importing this from a client component must
// fail the build, not ship the keys.
import 'server-only'

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { randomBytes } from 'node:crypto'
import { extname } from 'node:path'
import { env } from './env'

/* MinIO speaks S3. forcePathStyle is required: MinIO serves buckets as
   /bucket/key rather than as a subdomain. */
export const s3 = new S3Client({
  endpoint: env.MINIO_ENDPOINT,
  region: 'us-east-1',
  forcePathStyle: true,
  credentials: {
    accessKeyId: env.MINIO_ROOT_USER,
    secretAccessKey: env.MINIO_ROOT_PASSWORD,
  },
})

/* Never trust the uploaded filename for the storage key -- it is attacker
   controlled and ends up in a URL. Keep only the extension, after validating
   it, and generate the rest (§21). */
export function storageKey(originalFilename: string, prefix = 'media') {
  const ext = extname(originalFilename).toLowerCase().replace(/[^.a-z0-9]/g, '')
  return `${prefix}/${Date.now()}-${randomBytes(8).toString('hex')}${ext}`
}

export async function putObject(key: string, body: Buffer, contentType: string) {
  await s3.send(
    new PutObjectCommand({
      Bucket: env.MINIO_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  )
  return key
}

export async function deleteObject(key: string) {
  await s3.send(new DeleteObjectCommand({ Bucket: env.MINIO_BUCKET, Key: key }))
}

export function publicUrl(key: string) {
  return `${env.MEDIA_PUBLIC_URL.replace(/\/$/, '')}/${key}`
}
