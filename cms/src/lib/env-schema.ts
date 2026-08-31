/**
 * The environment contract, with no runtime guard.
 *
 * Deliberately separate from env.ts: this file describes and validates the
 * shape, while env.ts binds it to process.env behind `server-only`. Scripts
 * that legitimately run outside Next (the seed, probes) need the validation
 * without the bundler guard, and the alternative -- dropping `server-only`
 * from env.ts -- would trade a real secret-leak protection for a script's
 * convenience.
 *
 * No secret is read here. Importing this module gets you a schema, not values.
 */
import { z } from 'zod'

/* Fail at boot with a readable message rather than at the first request with
   an undefined. Secrets live here and nowhere near CMS-editable content (§13). */
export const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  // Unpooled; used only by `prisma migrate`. Optional at runtime because the
  // running app never needs it -- only the migration step does.
  DIRECT_URL: z.string().url().optional(),

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

export type Env = z.infer<typeof envSchema>

/** Throws with every failing key listed, rather than one at a time. */
export function parseEnv(source: Record<string, string | undefined>): Env {
  const parsed = envSchema.safeParse(source)

  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n')
    throw new Error(`Invalid environment configuration:\n${issues}`)
  }

  return parsed.data
}
