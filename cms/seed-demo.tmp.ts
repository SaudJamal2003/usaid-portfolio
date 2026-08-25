/* Builds one case study exercising every block type, so the renderer is
   verified against real payloads rather than hand-written fixtures. */
import { PrismaClient, ContentStatus } from '@prisma/client'
const db = new PrismaClient()

async function main() {
  const media = await db.media.findMany({ where: { mimeType: { startsWith: 'image/' } }, take: 6 })
  const video = await db.media.findFirst({ where: { mimeType: 'video/mp4' } })
  if (media.length < 4) throw new Error('need images seeded first')

  await db.caseStudyBlock.deleteMany({ where: { caseStudy: { slug: 'block-showcase' } } })
  await db.caseStudy.deleteMany({ where: { slug: 'block-showcase' } })

  const cs = await db.caseStudy.create({
    data: {
      title: 'Block Showcase',
      slug: 'block-showcase',
      client: 'Internal',
      role: 'UX Designer',
      duration: 'Aug 2026',
      projectType: 'Verification',
      heroTitle: 'Every block type, rendered',
      heroDescription: 'A case study built to exercise the public block renderer end to end.',
      heroId: media[0].id,
      thumbnailId: media[0].id,
      status: ContentStatus.PUBLISHED,
      publishedAt: new Date(),
    },
  })

  const blocks: { type: string; data: unknown }[] = [
    { type: 'TEXT', data: { heading: 'The brief', content: '<h3>Why this exists</h3><p>This paragraph carries <strong>bold</strong> and <em>italic</em> text plus a <a href="https://example.com">link</a>.</p><ul><li>First bullet</li><li>Second bullet</li></ul><blockquote>A quote inside rich text.</blockquote>' } },
    { type: 'IMAGE', data: { mediaId: media[1].id, caption: 'A standard image block with a caption.' } },
    { type: 'IMAGE_TEXT', data: { heading: 'Image beside text', content: '<p>Copy sits beside the image. The image can be placed on either side.</p>', mediaId: media[2].id, imagePosition: 'right' } },
    { type: 'IMAGE_TEXT', data: { heading: 'Flipped', content: '<p>Same block, image on the left.</p>', mediaId: media[3].id, imagePosition: 'left' } },
    { type: 'GALLERY', data: { mediaIds: media.slice(0, 3).map((m) => m.id), columns: 3 } },
    { type: 'FULL_WIDTH_IMAGE', data: { mediaId: media[1].id, caption: 'Edge to edge.' } },
    ...(video ? [{ type: 'VIDEO', data: { mediaId: video.id, caption: 'An uploaded video.' } }] : []),
    { type: 'QUOTE', data: { quote: 'The renderer maps a block type to a component through an explicit switch.', attribution: 'Engineering note', role: 'Architecture' } },
    { type: 'STATS', data: { items: [{ value: '9', label: 'Block types supported' }, { value: '1', label: 'API request per page' }, { value: '0', label: 'Uses of dangerouslySetInnerHTML' }] } },
    { type: 'CTA', data: { heading: 'Ready to talk?', description: 'The CTA block validates its URL before rendering a link.', buttonLabel: 'Get in touch', buttonUrl: '#contact' } },
    // Deliberately malformed / unknown, to prove they degrade rather than crash
    { type: 'IMAGE', data: { mediaId: 'cly000000000000000000000' } },
    { type: 'FUTURE_BLOCK_TYPE', data: { anything: true } },
  ]

  for (const [i, b] of blocks.entries()) {
    await db.caseStudyBlock.create({
      data: { caseStudyId: cs.id, type: b.type as never, data: b.data as never, displayOrder: i },
    })
  }
  console.log(`created /#/work/block-showcase with ${blocks.length} blocks (incl. 1 missing-media, 1 unknown type)`)
}
main().catch((e) => { console.error(e); process.exit(1) }).finally(() => db.$disconnect())
