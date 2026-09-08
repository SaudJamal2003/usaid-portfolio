import { Fragment } from 'react'
import arrowUp from '../../../assets/figma/shukar-stat-arrow.svg'
import type { CmsBlock, CmsMedia } from '../../../content/types'

/* Same fan/rotation geometry as the Shukar Hai reference -- every Web case
   study gets exactly 3 stat cards, always in this layout, so these
   position/tilt values are fixed template geometry, not per-case-study
   content. Cards stack and un-rotate below lg, same as the reference. */
const CARD_LAYOUT = [
  {
    place: 'lg:absolute lg:left-0 lg:top-[8px] lg:h-[301.067px] lg:w-[340.298px]',
    tilt: 'lg:rotate-[3.66deg]',
  },
  {
    place: 'lg:absolute lg:left-[308px] lg:top-0 lg:h-[299.353px] lg:w-[338.833px]',
    tilt: 'lg:-rotate-[3.34deg]',
  },
  {
    place: 'lg:absolute lg:left-[613.3px] lg:top-[8px] lg:h-[301.067px] lg:w-[340.298px]',
    tilt: 'lg:rotate-[3.66deg]',
  },
]

export function WebHero({
  title,
  subtitle,
  role,
  duration,
  scope,
  client,
  heroImage,
  statCards,
}: {
  title: string
  subtitle: string | null
  role: string | null
  duration: string | null
  scope: string | null
  client: string | null
  heroImage: CmsMedia | null
  statCards: CmsBlock[]
}) {
  const meta = [
    { label: 'ROLE', value: role },
    { label: 'TIMELINE', value: duration },
    { label: 'SCOPE', value: scope },
    { label: 'CLIENT', value: client },
  ].filter((item) => item.value)

  return (
    <section className="px-4 sm:px-6">
      <div className="mx-auto flex w-full max-w-[1071px] flex-col items-center gap-[76px]">
        <header className="flex max-w-[575px] flex-col text-center">
          <h1 className="font-display text-[clamp(38px,4.31vw,62px)] font-medium leading-[1.419] tracking-[-0.0645em] text-ink">
            {title}
          </h1>
          {subtitle && (
            <p className="font-display text-[clamp(18px,1.67vw,24px)] leading-[1.125] text-slate">
              {subtitle}
            </p>
          )}
        </header>

        <div className="flex w-full flex-col items-center gap-[24px]">
          {meta.length > 0 && (
            <dl className="flex flex-wrap items-center justify-center gap-x-[50px] gap-y-[16px] rounded-[10px] border border-hairline bg-panel px-6 py-[24px] drop-shadow-[0_4px_12px_rgba(0,0,0,0.04)] lg:px-[48px]">
              {meta.map((item, index) => (
                <Fragment key={item.label}>
                  {index > 0 && <div aria-hidden className="hidden h-[70px] w-px bg-hairline lg:block" />}
                  <div className="flex flex-col whitespace-nowrap font-display text-[clamp(18px,1.67vw,24px)] leading-[1.458] text-ink">
                    <dt className="font-medium tracking-[-0.0417em]">{item.label}</dt>
                    <dd className="font-light">{item.value}</dd>
                  </div>
                </Fragment>
              ))}
            </dl>
          )}

          {statCards.length > 0 && (
            <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:flex-wrap sm:justify-center lg:block lg:h-[309.07px] lg:w-[953.6px]">
              {statCards.map((block, index) => {
                const layout = CARD_LAYOUT[index % CARD_LAYOUT.length]
                const value = (block.data.value as string) ?? ''
                const cardTitle = (block.data.title as string) ?? ''
                const description = (block.data.description as string) ?? ''
                return (
                  <div key={block.id} className={`flex items-center justify-center ${layout.place}`}>
                    <div className={layout.tilt}>
                      <article className="flex w-[323px] flex-col gap-[16px] rounded-[16px] border border-hairline bg-panel p-[32px] drop-shadow-[0_4px_20.5px_rgba(0,0,0,0.05)]">
                        <div className="flex items-center gap-[16px]">
                          <img src={arrowUp} alt="" className="size-[69px] shrink-0 -rotate-90" />
                          <p className="font-display text-[64px] font-extrabold text-black">{value}</p>
                        </div>
                        <div className="flex flex-col gap-[6px]">
                          <p className="font-display text-[20px] font-bold capitalize text-onyx">{cardTitle}</p>
                          <p className="font-display text-[14px] leading-[1.286] text-slate">{description}</p>
                        </div>
                      </article>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {heroImage && (
          <img src={heroImage.url} alt={heroImage.alt} className="h-auto w-full" width={1071} />
        )}
      </div>
    </section>
  )
}
