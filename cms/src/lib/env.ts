// This module holds SESSION_SECRET and the MinIO credentials. The import
// makes bundling it into a client component a build error rather than a silent
// secret leak.
import 'server-only'

import { z } from 'zod'

/* Fail at boot with a readable message rather than at the first request with
   an undefined. Secrets live here and nowhere near CMS-editable content (§13). */
const schema = z.object({
  DATABASE_URL: z.string().url(),

  MINIO_ENDPOINT: z.string().url(),
  MINIO_ROOT_USER: z.string().min(1),
  MINIO_ROOT_PASSWORD: z.string().min(1),
  MINIO_BUCKET: z.string().min(1),
  MEDIA_PUBLIC_URL: z.string().url(),

  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),
  SESSION_TTL_HOURS: z.coerce.number().int().positive().default(168),

  OWNER_EMAIL: z.string().email(),
  OWNER_PASSWORD: z.string().min(12).optional(),

  PUBLIC_CORS_ORIGINS: z
    .string()
    .default('')
    .transform((value) => value.split(',').map((o) => o.trim()).filter(Boolean)),
})

const parsed = schema.safeParse(process.env)

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n')
  throw new Error(`Invalid environment configuration:\n${issues}`)
}

export const env = parsed.data
