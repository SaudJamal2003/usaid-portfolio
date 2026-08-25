import doodleCrown from '../assets/figma/hero-doodle-crown.png'
import doodleProblem from '../assets/figma/hero-doodle-problem.png'
import doodleThink from '../assets/figma/hero-doodle-think.png'
import doodleSolution from '../assets/figma/hero-doodle-solution.png'
import doodleDesign from '../assets/figma/hero-doodle-design.png'
import doodleBlob from '../assets/figma/hero-doodle-blob.png'
import doodleCar from '../assets/figma/hero-doodle-car.png'
import portraitFallback from '../assets/figma/hero-portrait.png'
import { TypingWord } from './TypingWord'
import { useContent } from '../content/context'

/* Cycle through on a shared 700ms timeline (100ms per doodle, see
   hero-doodle-cycle in index.css) — one flashes in, holds briefly, flashes
   out, and the next takes the same slot. */
const HERO_DOODLES = [
  { src: doodleCrown, alt: 'Crown doodle' },
  { src: doodleProblem, alt: '"Problem!" doodle' },
  { src: doodleThink, alt: '"Think!" doodle' },
  { src: doodleSolution, alt: '"Solution!" doodle' },
  { src: doodleDesign, alt: '"Design!" doodle' },
  { src: doodleBlob, alt: 'Blob doodle' },
  { src: doodleCar, alt: 'Car doodle' },
]

/* Bundled fallback for the typed words (§18). */
const HERO_WORDS = ['Overthink', 'Question', 'Rethink', 'Simplify', 'Improve']

export function Hero() {
  const content = useContent()

  /* Content only -- the typing speed, doodle cycle and portrait geometry stay
     here in the component. */
  const eyebrow = content?.hero?.eyebrow ?? 'Hi, myself Usaid! Andd...'
  const titlePrefix = content?.hero?.titlePrefix ?? 'Design is my favorite thing to'
  const words = content?.hero?.typingWords?.length ? content.hero.typingWords : HERO_WORDS
  const portrait = content?.hero?.portrait?.mediumUrl ?? portraitFallback

  return (
    <section id="home" className="mt-[58px]">
      <div className="flex flex-col items-center gap-[29px] px-6 text-center lg:px-[150px]">
        <p className="text-[22px] font-semibold leading-[26px] text-ink">{eyebrow}</p>
        <h1 className="max-w-[720px] font-display text-[clamp(40px,5.56vw,80px)] leading-[1.1] tracking-[-0.05em] text-ink">
          {titlePrefix} <TypingWord words={words} />
        </h1>
      </div>

      {/* Portrait 574×511 with the doodle carousel pinned to its top edge (Figma
          1:6336 / 1:6337). The doodle box is centered on the same spot the
          crown used to occupy, sized to fit the widest doodle. */}
      <div className="relative mx-auto mt-[42px] aspect-[574/511] w-full max-w-[574px]">
        <img
          src={portrait}
          alt="Portrait of Usaid Ahmed"
          className="absolute inset-0 size-full object-contain"
        />
        <div className="absolute left-[19.72%] top-[-2.53%] h-[25.44%] w-[34.84%]" aria-hidden="true">
          {HERO_DOODLES.map((doodle, i) => (
            <img
              key={doodle.src}
              src={doodle.src}
              alt=""
              className={`absolute inset-0 m-auto max-h-full max-w-full object-contain opacity-0 animate-hero-doodle motion-reduce:animate-none ${
                i === 0 ? 'motion-reduce:opacity-100' : 'motion-reduce:opacity-0'
              }`}
              style={{ animationDelay: `${-i * 0.5}s` }}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
