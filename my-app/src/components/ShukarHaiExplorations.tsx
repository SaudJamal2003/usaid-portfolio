import exploration1 from '../assets/figma/shukar-explore-1.png'
import exploration2 from '../assets/figma/shukar-explore-2.png'

/* Each card is a 589x514 window onto a much taller page mockup. The exports are
   already cropped to the visible slice (plus the mockup's own shadow bleed), so
   the offsets below are that slice expressed as a share of the card — which
   keeps the crop identical as the card scales down. */
const EXPLORATIONS = [
  {
    src: exploration1,
    alt: 'First direction: a light landing page leading with the sacrifice picker',
    inset: { left: '3.854%', top: '3.6965%', width: '92.5297%', height: '96.3035%' },
  },
  {
    src: exploration2,
    alt: 'Second direction: a darker, orange-led landing page with the meal counter up front',
    inset: { left: '6.7215%', top: '7.0039%', width: '86.7573%', height: '93.0039%' },
  },
]

export function ShukarHaiExplorations() {
  return (
    <section className="mt-[200px] px-4 sm:px-6">
      <div className="mx-auto flex w-full max-w-[1226px] flex-col gap-[45px]">
        <header className="flex max-w-[1188px] flex-col gap-[18px]">
        <h2 className="font-display text-[clamp(32px,3.89vw,56px)] font-medium tracking-[-0.0357em] text-ink">
          Iterating in multiple directions
        </h2>
        <p className="font-display text-[clamp(20px,1.94vw,28px)] text-black">
          I explored different ways to balance purpose, product clarity, and conversion without
          making the experience feel like a conventional charity website or an e-commerce store.
        </p>
      </header>

      <div className="grid grid-cols-1 items-center gap-[44px] lg:grid-cols-2">
        {EXPLORATIONS.map((exploration) => (
          <div
            key={exploration.alt}
            className="relative aspect-[589/514] w-full max-w-[589px] overflow-hidden rounded-[20px] border border-white bg-panel shadow-[0_4px_21px_0_rgba(0,0,0,0.07)]"
          >
            <img
              src={exploration.src}
              alt={exploration.alt}
              className="absolute max-w-none"
              style={exploration.inset}
            />
          </div>
          ))}
        </div>
      </div>
    </section>
  )
}
