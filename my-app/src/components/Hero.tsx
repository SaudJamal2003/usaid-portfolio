import crown from '../assets/figma/hero-crown.png'
import portrait from '../assets/figma/hero-portrait.png'

export function Hero() {
  return (
    <section id="home" className="mt-[58px]">
      <div className="flex flex-col items-center gap-[29px] px-6 text-center lg:px-[150px]">
        <p className="text-[22px] font-semibold leading-[26px] text-ink">Hi, myself Usaid! Andd...</p>
        <h1 className="max-w-[720px] font-display text-[clamp(40px,5.56vw,80px)] leading-[1.1] tracking-[-0.05em] text-ink">
          Design is my favorite thing to <span className="text-accent">Overthink</span>
        </h1>
      </div>

      {/* Portrait 574×511 with the crown pinned to its top edge (Figma 1:6336 / 1:6337).
          The crown export carries a 3.5px effect bleed on every side, so its box is
          nudged out by that amount to keep the designed geometry. */}
      <div className="relative mx-auto mt-[42px] aspect-[574/511] w-full max-w-[574px]">
        <img
          src={portrait}
          alt="Portrait of Usaid Ahmed"
          className="absolute inset-0 size-full object-contain"
        />
        <img
          src={crown}
          alt=""
          className="absolute left-[24.65%] top-[-0.68%] w-[24.96%]"
        />
      </div>
    </section>
  )
}
