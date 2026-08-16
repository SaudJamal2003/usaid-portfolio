import note from '../assets/figma/about-note.png'

const BIO = `I'm a UX Designer who loves turning confusion into clarity and friction into flow. I combine research, empathy, and systems thinking to create products people don't have to fight with.  Because the best interface isn't the one with the most animations. It's the one users never have to think about.`

/* Figma 1:7953 — a 759px copy column butted straight against a 531×477 box that
   holds the 473×408 note card at 9°. The card's rotated bounding box is exactly
   531×477, which is why the two columns need no gap between them. */
export function AboutIntro() {
  return (
    <section id="home" className="mt-[185px] px-6 lg:ps-[100px] lg:pe-0">
      <div className="flex flex-col items-start gap-16 lg:flex-row lg:items-start lg:gap-0">
        <div className="flex w-full flex-col gap-[20px] font-display font-medium lg:w-[759px]">
          <h1 className="text-[clamp(38px,4.3vw,62px)] leading-[1.419] tracking-[-0.0323em] text-ink">
            Hi, myself Usaid! Andd...
          </h1>
          <p className="whitespace-pre-wrap text-[clamp(20px,2.22vw,32px)] leading-[1.5625] text-body">
            {BIO}
          </p>
        </div>

        <div className="flex h-[290px] w-full shrink-0 justify-center overflow-hidden sm:h-[380px] lg:h-[476.998px] lg:w-[531.025px] lg:items-center lg:overflow-visible">
          <div className="origin-top scale-[0.55] sm:scale-75 lg:scale-100">
            <div className="flex h-[476.998px] w-[531.025px] items-center justify-center">
              <div className="rotate-9">
                <div className="h-[408px] w-[473px] rounded-[30px] border border-hairline shadow-[0_4px_24px_0_rgba(0,0,0,0.1)]">
                  <img
                    src={note}
                    alt="A note reading “Boss: Finish that design by tomorrow. Me:” above two sketches of a cheetah, one sprinting and one strolling."
                    className="size-full rounded-[30px] object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
