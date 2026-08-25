import { z } from 'zod'
import { sanitizeRichText } from './rich-text'

/**
 * Case study block payloads.
 *
 * A discriminated union validated before anything reaches the JSONB column, so
 * the database stays flexible while the application stays typed (§17, §62.16).
 * Adding a block type means adding one member here and one renderer in the
 * portfolio — never a migration.
 */

/* Sanitised at the schema boundary rather than in each action: every write path
   goes through parseBlock, so this is the one place it can be enforced. */
const richText = z.string().max(50_000).transform(sanitizeRichText)
const mediaId = z.string().cuid()

export const blockSchemas = {
  TEXT: z.object({
    heading: z.string().max(200).optional(),
    content: richText,
  }),

  IMAGE: z.object({
    mediaId,
    caption: z.string().max(300).optional(),
  }),

  IMAGE_TEXT: z.object({
    heading: z.string().max(200).optional(),
    content: richText,
    mediaId,
    imagePosition: z.enum(['left', 'right']).default('right'),
  }),

  GALLERY: z.object({
    mediaIds: z.array(mediaId).min(1).max(24),
    columns: z.union([z.literal(2), z.literal(3), z.literal(4)]).default(3),
  }),

  FULL_WIDTH_IMAGE: z.object({
    mediaId,
    caption: z.string().max(300).optional(),
  }),

  VIDEO: z.object({
    mediaId: mediaId.optional(),
    externalUrl: z.string().url().optional(),
    caption: z.string().max(300).optional(),
  }).refine((v) => v.mediaId || v.externalUrl, {
    message: 'Provide either an uploaded video or an external URL',
  }),

  QUOTE: z.object({
    quote: z.string().max(1000),
    attribution: z.string().max(200).optional(),
    role: z.string().max(200).optional(),
  }),

  STATS: z.object({
    items: z
      .array(
        z.object({
          value: z.string().max(20),
          label: z.string().max(120),
        }),
      )
      .min(1)
      .max(6),
  }),

  CTA: z.object({
    heading: z.string().max(200),
    description: z.string().max(600).optional(),
    buttonLabel: z.string().max(60),
    buttonUrl: z.string().max(500),
  }),
} as const

export type BlockTypeName = keyof typeof blockSchemas

export const BLOCK_TYPES = Object.keys(blockSchemas) as BlockTypeName[]

/** Labels and starter payloads for the editor's "add block" menu. */
export const BLOCK_META: Record<BlockTypeName, { label: string; description: string; initial: unknown }> = {
  TEXT: { label: 'Text', description: 'Heading and rich text', initial: { content: '' } },
  IMAGE: { label: 'Image', description: 'A single image with an optional caption', initial: {} },
  IMAGE_TEXT: {
    label: 'Image + Text',
    description: 'Copy beside an image',
    initial: { content: '', imagePosition: 'right' },
  },
  GALLERY: { label: 'Gallery', description: 'A grid of images', initial: { mediaIds: [], columns: 3 } },
  FULL_WIDTH_IMAGE: { label: 'Full width image', description: 'Edge to edge', initial: {} },
  VIDEO: { label: 'Video', description: 'Uploaded file or external URL', initial: {} },
  QUOTE: { label: 'Quote', description: 'A pull quote with attribution', initial: { quote: '' } },
  STATS: { label: 'Statistics', description: 'Outcome figures', initial: { items: [{ value: '', label: '' }] } },
  CTA: { label: 'Call to action', description: 'Heading and a button', initial: { heading: '', buttonLabel: '', buttonUrl: '' } },
}

/** Validates a payload against its type. Returns a discriminated result so
 *  callers must handle failure rather than trusting the cast. */
export function parseBlock(type: string, data: unknown) {
  const schema = blockSchemas[type as BlockTypeName]
  if (!schema) return { ok: false as const, error: `Unknown block type: ${type}` }
  const result = schema.safeParse(data)
  if (!result.success) {
    return { ok: false as const, error: result.error.issues.map((i) => i.message).join('; ') }
  }
  return { ok: true as const, data: result.data }
}

/** Every media id a block references, for the delete-protection check (§38). */
export function mediaIdsInBlock(type: string, data: unknown): string[] {
  const payload = data as Record<string, unknown>
  if (!payload) return []
  if (type === 'GALLERY') return Array.isArray(payload.mediaIds) ? (payload.mediaIds as string[]) : []
  return typeof payload.mediaId === 'string' ? [payload.mediaId] : []
}
