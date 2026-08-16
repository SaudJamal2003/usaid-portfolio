import { Fragment } from 'react'
import arrowUp from '../assets/figma/shukar-stat-arrow.svg'
import heroMockup from '../assets/figma/shukar-hero-mockup.png'

const META = [
  { label: 'ROLE', value: 'UX Designer' },
  { label: 'TIMELINE', value: 'Apr - Jun 2025' },
  { label: 'SCOPE', value: 'Design Revamp' },
  { label: 'CLIENT', value: 'Osamah Nasir' },
]

const OUTCOME_BLURB =
  'Fewer residents abandoned payments mid flow, particularly during card transactions where external redirects had previously introduced friction.'

/* Figma lays the three cards out as a fanned, overlapping group. The `place`
   classes only kick in at lg, where there is room for the fan; below that the
   cards stack and un-rotate so the 14px body copy stays readable. */
const OUTCOMES = [
  {
    value: '47%',
    title: 'Increase in conversion rate',
    place: 'lg:absolute lg:left-0 lg:top-[8px] lg:h-[301.067px] lg:w-[340.298px]',
    tilt: 'lg:rotate-[3.66deg]',
  },
  {
    value: '65%',
    title: 'Faster Task Completion',
    place: 'lg:absolute lg:left-[308px] lg:top-0 lg:h-[299.353px] lg:w-[338.833px]',
    tilt: 'lg:-rotate-[3.34deg]',
  },
  {
    value: '47%',
    title: 'User Satisfaction Score',
    place: 'lg:absolute lg:left-[613.3px] lg:top-[8px] lg:h-[301.067px] lg:w-[340.298px]',
    tilt: 'lg:rotate-[3.66deg]',
  },
]

export function ShukarHaiIntro() {
  return (
    <section className="px-4 sm:px-6">
      <div className="mx-auto flex w-full max-w-[1071px] flex-col items-center gap-[76px]">
        <header className="flex max-w-[575px] flex-col text-center">
          <h1 className="font-display text-[clamp(38px,4.31vw,62px)] font-medium leading-[1.419] tracking-[-0.0645em] text-ink">
            Shukar Hai
          </h1>
          <p className="font-display text-[clamp(18px,1.67vw,24px)] leading-[1.125] text-slate">
            Shukar Hai turns an everyday moment of gratitude into a meal for someone who rarely gets
            to choose what they eat. But the brand sits in an unusual space, somewhere between
            business and social enterprise.
          </p>
        </header>

        <div className="flex w-full flex-col items-center gap-[24px]">
          <dl className="flex flex-wrap items-center justify-center gap-x-[50px] gap-y-[16px] rounded-[10px] border border-hairline bg-panel px-6 py-[24px] drop-shadow-[0_4px_12px_rgba(0,0,0,0.04)] lg:px-[48px]">
            {META.map((item, index) => (
              <Fragment key={item.label}>
                {index > 0 && (
                  <div aria-hidden className="hidden h-[70px] w-px bg-hairline lg:block" />
                )}
                <div className="flex flex-col whitespace-nowrap font-display text-[clamp(18px,1.67vw,24px)] leading-[1.458] text-ink">
                  <dt className="font-medium tracking-[-0.0417em]">{item.label}</dt>
                  <dd className="font-light">{item.value}</dd>
                </div>
              </Fragment>
            ))}
          </dl>

          <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:flex-wrap sm:justify-center lg:block lg:h-[309.07px] lg:w-[953.6px]">
            {OUTCOMES.map((outcome) => (
              <div key={outcome.title} className={`flex items-center justify-center ${outcome.place}`}>
                <div className={outcome.tilt}>
                  <article className="flex w-[323px] flex-col gap-[16px] rounded-[16px] border border-hairline bg-panel p-[32px] drop-shadow-[0_4px_20.5px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center gap-[16px]">
                      <img src={arrowUp} alt="" className="size-[69px] shrink-0 -rotate-90" />
                      <p className="font-display text-[64px] font-extrabold text-black">
                        {outcome.value}
                      </p>
                    </div>
                    <div className="flex flex-col gap-[6px]">
                      <p className="font-display text-[20px] font-bold capitalize text-onyx">
                        {outcome.title}
                      </p>
                      <p className="font-display text-[14px] leading-[1.286] text-slate">
                        {OUTCOME_BLURB}
                      </p>
                    </div>
                  </article>
                </div>
              </div>
            ))}
          </div>
        </div>

        <img
          src={heroMockup}
          alt="The redesigned Shukar Hai homepage shown on a laptop, with the Dawat-in-a-box donation panel open"
          className="h-auto w-full"
          width={1071}
          height={602}
        />
      </div>
    </section>
  )
}
