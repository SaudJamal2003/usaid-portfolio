import type { CmsBlock, CmsMedia } from '../../content/types'
import {
  CtaBlock,
  FullWidthImageBlock,
  GalleryBlock,
  ImageBlock,
  ImageTextBlock,
  QuoteBlock,
  StatsBlock,
  TextBlock,
  VideoBlock,
} from './blocks'

/**
 * Maps a CMS block to a component through an explicit switch.
 *
 * Deliberately not a lookup table keyed by the payload's own `type` string:
 * a switch is exhaustively checkable, and nothing here can be coerced into
 * executing a component the payload names. An unrecognised type renders
 * nothing rather than throwing.
 */

type Payload = Record<string, unknown>

const str = (data: Payload, key: string) =>
  typeof data[key] === 'string' ? (data[key] as string) : undefined

/** The API hydrates media ids into objects on the same key; both shapes are
 *  read defensively because a block is JSONB and could predate a field. */
const one = (data: Payload): CmsMedia | null => {
  const media = data.media
  if (!media || Array.isArray(media)) return null
  return media as CmsMedia
}

const many = (data: Payload): CmsMedia[] => {
  const media = data.media
  return Array.isArray(media) ? (media as CmsMedia[]) : []
}

function render(block: CmsBlock) {
  const data = (block.data ?? {}) as Payload

  switch (block.type) {
    case 'TEXT':
      return <TextBlock heading={str(data, 'heading')} content={str(data, 'content')} />

    case 'IMAGE':
      return <ImageBlock media={one(data)} caption={str(data, 'caption')} />

    case 'IMAGE_TEXT':
      return (
        <ImageTextBlock
          heading={str(data, 'heading')}
          content={str(data, 'content')}
          media={one(data)}
          imagePosition={data.imagePosition === 'left' ? 'left' : 'right'}
        />
      )

    case 'GALLERY': {
      const columns = data.columns
      return (
        <GalleryBlock
          media={many(data)}
          columns={columns === 2 || columns === 4 ? columns : 3}
        />
      )
    }

    case 'FULL_WIDTH_IMAGE':
      return <FullWidthImageBlock media={one(data)} caption={str(data, 'caption')} />

    case 'VIDEO':
      return (
        <VideoBlock
          media={one(data)}
          externalUrl={str(data, 'externalUrl')}
          caption={str(data, 'caption')}
        />
      )

    case 'QUOTE':
      return (
        <QuoteBlock
          quote={str(data, 'quote')}
          attribution={str(data, 'attribution')}
          role={str(data, 'role')}
        />
      )

    case 'STATS': {
      const items = Array.isArray(data.items)
        ? (data.items as { value?: unknown; label?: unknown }[])
            .filter((item) => item && typeof item.value === 'string')
            .map((item) => ({
              value: item.value as string,
              label: typeof item.label === 'string' ? item.label : '',
            }))
        : []
      return <StatsBlock items={items} />
    }

    case 'CTA':
      return (
        <CtaBlock
          heading={str(data, 'heading')}
          description={str(data, 'description')}
          buttonLabel={str(data, 'buttonLabel')}
          buttonUrl={str(data, 'buttonUrl')}
        />
      )

    default:
      // An unknown type is a CMS that has moved ahead of this build. Skipping it
      // keeps the rest of the case study readable.
      return null
  }
}

export function BlockRenderer({ blocks }: { blocks: CmsBlock[] }) {
  return (
    <>
      {blocks.map((block, index) => {
        // One malformed payload must not take the page down (§18).
        let rendered: React.ReactElement | null
        try {
          rendered = render(block)
        } catch {
          rendered = null
        }
        return rendered ? <div key={block.id ?? index}>{rendered}</div> : null
      })}
    </>
  )
}
