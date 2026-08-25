import type { CmsMedia } from '../../content/types'
import { RichText } from './RichText'

/**
 * One component per block type, built from the visual language already in the
 * Shukar Hai sections: the 200px section rhythm, the display-font heading
 * clamp, the 20px radius / white border / soft shadow image treatment, and the
 * panel-backed 30px cards.
 *
 * The CMS decides what appears and in what order. It has no say in any of the
 * classes below.
 */

const SECTION = 'mt-[120px] px-4 first:mt-0 sm:px-6'
const CONTAINER = 'mx-auto flex w-full max-w-[1240px] flex-col gap-[32px]'
const HEADING =
  'font-display text-[clamp(32px,3.89vw,56px)] font-medium leading-[1.107] tracking-[-0.0357em] text-ink'
const IMAGE_FRAME =
  'overflow-hidden rounded-[20px] border border-white bg-panel shadow-[0_4px_21px_0_rgba(0,0,0,0.07)]'
const CAPTION = 'font-display text-[16px] leading-[1.5] text-muted'

/** A block that cannot render is skipped, never thrown — one bad block must not
 *  take the page down with it. */
export type BlockResult = React.ReactElement | null

function Caption({ text }: { text?: string }) {
  if (!text?.trim()) return null
  return <p className={CAPTION}>{text}</p>
}

export function TextBlock({ heading, content }: { heading?: string; content?: string }) {
  if (!content?.trim() && !heading?.trim()) return null
  return (
    <section className={SECTION}>
      <div className={CONTAINER}>
        {heading?.trim() && <h2 className={HEADING}>{heading}</h2>}
        <RichText html={content ?? ''} />
      </div>
    </section>
  )
}

export function ImageBlock({ media, caption }: { media?: CmsMedia | null; caption?: string }) {
  if (!media) return null
  return (
    <section className={SECTION}>
      <div className={CONTAINER}>
        <figure className="flex flex-col gap-[14px]">
          <div className={IMAGE_FRAME}>
            <img
              src={media.mediumUrl}
              alt={media.alt}
              loading="lazy"
              className="h-auto w-full object-cover"
            />
          </div>
          {caption?.trim() && (
            <figcaption>
              <Caption text={caption} />
            </figcaption>
          )}
        </figure>
      </div>
    </section>
  )
}

export function ImageTextBlock({
  heading,
  content,
  media,
  imagePosition = 'right',
}: {
  heading?: string
  content?: string
  media?: CmsMedia | null
  imagePosition?: 'left' | 'right'
}) {
  if (!media && !content?.trim()) return null
  return (
    <section className={SECTION}>
      <div className="mx-auto grid w-full max-w-[1240px] grid-cols-1 items-center gap-[44px] lg:grid-cols-2">
        {/* Order flips on the grid rather than reordering the DOM, so the copy
            still reads before the image for a screen reader. */}
        <div className={`flex flex-col gap-[24px] ${imagePosition === 'left' ? 'lg:order-2' : ''}`}>
          {heading?.trim() && <h2 className={HEADING}>{heading}</h2>}
          <RichText html={content ?? ''} />
        </div>
        {media && (
          <div className={`${IMAGE_FRAME} ${imagePosition === 'left' ? 'lg:order-1' : ''}`}>
            <img
              src={media.mediumUrl}
              alt={media.alt}
              loading="lazy"
              className="h-auto w-full object-cover"
            />
          </div>
        )}
      </div>
    </section>
  )
}

export function GalleryBlock({ media, columns = 3 }: { media?: CmsMedia[]; columns?: 2 | 3 | 4 }) {
  const images = (media ?? []).filter(Boolean)
  if (images.length === 0) return null

  const grid =
    columns === 2
      ? 'sm:grid-cols-2'
      : columns === 4
        ? 'sm:grid-cols-2 lg:grid-cols-4'
        : 'sm:grid-cols-2 lg:grid-cols-3'

  return (
    <section className={SECTION}>
      <div className="mx-auto w-full max-w-[1240px]">
        <div className={`grid grid-cols-1 gap-[24px] ${grid}`}>
          {images.map((image, index) => (
            <div key={image.id ?? index} className={IMAGE_FRAME}>
              <img
                src={image.thumbUrl}
                alt={image.alt}
                loading="lazy"
                className="aspect-[4/3] w-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function FullWidthImageBlock({
  media,
  caption,
}: {
  media?: CmsMedia | null
  caption?: string
}) {
  if (!media) return null
  return (
    <section className="mt-[120px] first:mt-0">
      {/* Edge to edge, the way the existing photo band is. */}
      <img src={media.url} alt={media.alt} loading="lazy" className="h-auto w-full object-cover" />
      {caption?.trim() && (
        <div className="mx-auto mt-[14px] w-full max-w-[1240px] px-4 sm:px-6">
          <Caption text={caption} />
        </div>
      )}
    </section>
  )
}

export function VideoBlock({
  media,
  externalUrl,
  caption,
}: {
  media?: CmsMedia | null
  externalUrl?: string
  caption?: string
}) {
  const source = media?.url ?? (externalUrl?.trim() ? externalUrl.trim() : null)
  if (!source) return null

  const isFile = Boolean(media) || /\.(mp4|webm)(\?|$)/i.test(source)

  return (
    <section className={SECTION}>
      <div className={CONTAINER}>
        {isFile ? (
          /* muted + playsInline are what let this autoplay at all on mobile;
             the existing photo band already autoplays a silent loop, so this
             matches rather than introduces the behaviour. */
          <video
            src={source}
            controls
            loop
            muted
            playsInline
            preload="metadata"
            className={`h-auto w-full ${IMAGE_FRAME}`}
          />
        ) : (
          <a
            href={source}
            target="_blank"
            rel="noreferrer noopener"
            className="font-display text-[clamp(18px,1.6vw,24px)] text-accent-deep underline underline-offset-2"
          >
            Watch the video
          </a>
        )}
        <Caption text={caption} />
      </div>
    </section>
  )
}

export function QuoteBlock({
  quote,
  attribution,
  role,
}: {
  quote?: string
  attribution?: string
  role?: string
}) {
  if (!quote?.trim()) return null
  return (
    <section className={SECTION}>
      <div className="mx-auto w-full max-w-[1240px]">
        <figure className="border-l-3 border-accent-deep px-[20px] py-[10px]">
          <blockquote className="font-display text-[clamp(20px,1.94vw,28px)] leading-[1.4] text-black">
            {quote}
          </blockquote>
          {(attribution?.trim() || role?.trim()) && (
            <figcaption className="mt-[14px] font-display text-[16px] text-muted">
              {attribution?.trim()}
              {attribution?.trim() && role?.trim() && ' · '}
              {role?.trim()}
            </figcaption>
          )}
        </figure>
      </div>
    </section>
  )
}

export function StatsBlock({ items }: { items?: { value: string; label: string }[] }) {
  const stats = (items ?? []).filter((item) => item?.value?.trim())
  if (stats.length === 0) return null

  return (
    <section className={SECTION}>
      <div className="mx-auto w-full max-w-[1240px]">
        <div className="grid grid-cols-1 gap-[24px] sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="flex flex-col gap-[12px] rounded-[20px] bg-panel p-[32px]"
            >
              <p className="font-display text-[clamp(36px,4vw,56px)] leading-[1.107] tracking-[-0.0357em] text-ink">
                {stat.value}
              </p>
              <p className="font-display text-[clamp(16px,1.4vw,20px)] leading-[1.4] text-body">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/** Internal anchors and safe schemes only — a CTA is the one block where a URL
 *  comes straight from content. */
function safeCtaHref(raw?: string): string | null {
  const value = raw?.trim()
  if (!value) return null
  if (value.startsWith('#') || value.startsWith('/')) return value
  if (/^(https?:|mailto:)/i.test(value)) return value
  return null
}

export function CtaBlock({
  heading,
  description,
  buttonLabel,
  buttonUrl,
}: {
  heading?: string
  description?: string
  buttonLabel?: string
  buttonUrl?: string
}) {
  if (!heading?.trim()) return null
  const href = safeCtaHref(buttonUrl)

  return (
    <section className={SECTION}>
      <div className="mx-auto w-full max-w-[1240px]">
        <div className="flex flex-col items-start gap-[24px] rounded-[30px] bg-panel p-6 sm:p-10 lg:p-[60px]">
          <h2 className={HEADING}>{heading}</h2>
          {description?.trim() && (
            <p className="max-w-[820px] font-display text-[clamp(18px,1.6vw,24px)] leading-[1.6] text-body">
              {description}
            </p>
          )}
          {href && buttonLabel?.trim() && (
            <a
              href={href}
              {...(/^https?:/i.test(href) ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
              className="inline-flex h-[52px] items-center justify-center rounded-[12px] border-3 border-ink bg-accent px-[28px] text-[16px] font-semibold text-ink transition-transform duration-300 ease-out hover:scale-[1.03]"
            >
              {buttonLabel}
            </a>
          )}
        </div>
      </div>
    </section>
  )
}
