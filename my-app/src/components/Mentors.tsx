import { useCallback, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useContent } from '../content/ContentProvider'
import type { CmsMentor } from '../content/types'
import mentorMain from '../assets/figma/mentor-main.png'
import mentorSecond from '../assets/figma/mentor-polaroid-2.png'
import mentorThird from '../assets/figma/mentor-polaroid-1.png'
import underline from '../assets/figma/mentor-underline.svg'

type Mentor = {
  name: string
  role: string
  photo: string
  tribute: string
}

/* Bundled fallback, used when the CMS is unreachable or has nothing publishable
   (§18). Kept verbatim so the fallback render is identical to what ships. */
const FALLBACK_MENTORS: Mentor[] = [
  {
    name: 'Tarib Ahmed',
    role: 'COO - Techtree',
    photo: mentorMain,
    tribute:
      'My brother, Tarib Ahmed, has been one of the most influential people in my life. More than a brother, he has been a mentor, guide, and constant source of support throughout my journey. From teaching me valuable lessons early on to helping me navigate challenges and opportunities, his advice and encouragement have shaped the way I think and grow. Through every high and low, he has always stood beside me, believing in me even when I doubted myself. Much of who I am today—both personally and professionally—is a reflection of the support, values, and confidence he helped instill in me.',
  },
  {
    name: 'Talha Yasin',
    role: 'Fractional Head of Design for SaaS & B2B Founders',
    photo: mentorThird,
    tribute:
      'Talha Yasin was one of the people who helped shape the way I approach UI design. He taught me how to move beyond simply recreating existing interfaces and start thinking about creating new flows and experiences from scratch. Through his guidance and mentorship, I learned how to explore different design approaches, practice consistently, and understand the reasoning behind good UI decisions. His feedback pushed me to experiment, improve my visual thinking, and become more confident in my design process. A lot of the fundamentals I rely on today were strengthened through the time I spent learning and practicing under his mentorship.',
  },
  {
    name: 'Asad Anwer',
    role: 'Co-founder - Bytecorp',
    photo: mentorSecond,
    tribute:
      'Asad Anwer played an important role in helping me understand UX and how design can be used to solve real-world problems. He taught me to look beyond the visuals and think deeply about users, their needs, behaviors, and the challenges they are trying to solve. His guidance helped me develop a stronger sense of direction when approaching design problems and understand how thoughtful design can turn user needs into meaningful experiences. He consistently pushed me to explore new ideas, learn new things, and keep improving my design thinking. Much of the way I approach UX today has been shaped by his guidance and mentorship.',
  },
]

/* The photo stage keeps the Figma geometry and is scaled down as a whole on
   narrow screens, the way the collage it replaces was. */
const STAGE = { width: 724, height: 540 }
const PRIMARY = { left: 87, top: 0, width: 396, height: 540 }
/* Bottom-aligned with the primary card, so the foot of the preview is the foot
   of the whole composition — that edge is what the text column lines up to. */
const PREVIEW = { left: 491, top: STAGE.height - 180, width: 172, height: 180 }

/* Where the primary card has to travel to sit over the preview slot. The
   incoming card grows out of that slot and the outgoing one recedes into it,
   which is what ties the two positions together instead of reading as a swap. */
const TO_PREVIEW = `translate(${
  PREVIEW.left + PREVIEW.width / 2 - (PRIMARY.left + PRIMARY.width / 2)
}px, ${PREVIEW.top + PREVIEW.height / 2 - (PRIMARY.top + PRIMARY.height / 2)}px) scale(0.55)`
const SIDEWAYS = 'translateX(-72px) scale(0.94)'

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

function subscribeToMotionPreference(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeToMotionPreference,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  )
}

/* The stage is scaled to 0.42 on phones, which would leave these circles as
   19px targets. The pseudo-element widens the tap area without touching the
   layout or the look; the x-inset stays inside the 15px gap so the two arrows
   can never claim the same tap. */
const ARROW_HIT = "relative before:absolute before:-inset-y-[22px] before:-inset-x-[7px] before:content-['']"

function Chevron({ back }: { back?: boolean }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="size-[18px]">
      <path
        d={back ? 'M12.25 4.75 7 10l5.25 5.25' : 'M7.75 4.75 13 10l-5.25 5.25'}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PrimaryCard({ mentor }: { mentor: Mentor }) {
  return (
    <div className="size-full overflow-hidden rounded-[30px] border-4 border-[rgba(250,250,250,0.93)] shadow-[0_4px_24px_0_rgba(0,0,0,0.4)]">
      <img src={mentor.photo} alt={mentor.name} className="size-full object-cover" />
    </div>
  )
}

/**
 * CMS mentors are used only when they are at least as good as what ships.
 *
 * The carousel needs a preview card that is a different person from the active
 * one, so a single published mentor would leave it showing the same face twice.
 * Falling back until the CMS set is complete keeps a migration from quietly
 * degrading the section.
 */
function isCmsMentorsComplete(entries: CmsMentor[]) {
  return (
    entries.length >= FALLBACK_MENTORS.length &&
    entries.every(
      (entry) =>
        entry.name.trim() &&
        entry.role.trim() &&
        entry.tribute.trim() &&
        !entry.name.startsWith('TODO') &&
        !entry.tribute.startsWith('TODO'),
    )
  )
}

export function Mentors() {
  const reduced = usePrefersReducedMotion()
  const content = useContent()

  /* Content only. Card geometry, the grow-from-preview animation and the
     stacked text box all stay in this component. */
  const cmsMentors = content?.mentors ?? []
  const MENTORS: Mentor[] = isCmsMentorsComplete(cmsMentors)
    ? cmsMentors.map((entry, index) => ({
        name: entry.name,
        role: entry.role,
        tribute: entry.tribute,
        photo: entry.photo?.mediumUrl ?? FALLBACK_MENTORS[index % FALLBACK_MENTORS.length].photo,
      }))
    : FALLBACK_MENTORS

  /* One source of truth. `previous` exists only for the length of a transition,
     so the outgoing card can be animated away; everything on screen — photo,
     name, role, tribute, preview — is read from `index`. */
  const [stage, setStage] = useState({ index: 0, previous: -1, direction: 1 as 1 | -1, token: 0 })
  const { index, previous, direction, token } = stage

  const enterRef = useRef<HTMLDivElement>(null)
  const leaveRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLButtonElement>(null)

  /* `count` is in the deps deliberately: MENTORS was a module constant, but it
     now changes when CMS content lands, and an empty dep list would leave this
     wrapping against the bundled length forever. */
  const count = MENTORS.length
  const go = useCallback(
    (step: 1 | -1) => {
      setStage((current) => ({
        index: (current.index + step + count) % count,
        previous: current.index,
        direction: step,
        token: current.token + 1,
      }))
    },
    [count],
  )

  useLayoutEffect(() => {
    if (previous < 0) return

    const settle = () =>
      setStage((current) => (current.token === token ? { ...current, previous: -1 } : current))

    if (reduced) {
      settle()
      return
    }

    // Arrival and departure swap with the direction, so "next" grows the preview
    // into place and "previous" sends the current card back down into it.
    const arriving = direction === 1 ? TO_PREVIEW : SIDEWAYS
    const departing = direction === 1 ? SIDEWAYS : TO_PREVIEW

    const running: Animation[] = []
    const play = (node: Element | null, keyframes: Keyframe[], duration: number) => {
      if (node) running.push(node.animate(keyframes, { duration, easing: EASE, fill: 'both' }))
    }

    play(
      enterRef.current,
      [
        { opacity: 0, transform: arriving },
        { opacity: 1, transform: 'none' },
      ],
      520,
    )

    play(
      leaveRef.current,
      [
        { opacity: 1, transform: 'none' },
        { opacity: 0, transform: departing },
      ],
      460,
    )

    // The copy moves with the cards rather than after them, so it is never a
    // frame out of step with the photo it belongs to.
    play(
      textRef.current,
      [
        { opacity: 0, transform: `translateX(${direction * 20}px)` },
        { opacity: 1, transform: 'none' },
      ],
      420,
    )

    play(
      previewRef.current,
      [
        { opacity: 0.5, transform: 'scale(0.92)' },
        { opacity: 1, transform: 'none' },
      ],
      420,
    )

    Promise.all(running.map((animation) => animation.finished)).then(settle, () => {})

    return () => running.forEach((animation) => animation.cancel())
  }, [token, previous, direction, index, reduced])

  const preview = MENTORS[(index + 1) % MENTORS.length]

  return (
    <section className="mt-[100px] px-6">
      <div className="mx-auto flex w-full max-w-[1288px] flex-col gap-16 lg:grid lg:grid-cols-[524px_724px] lg:gap-[40px]">
        <div className="lg:pt-[15.9px]">
          <h2 className="max-w-[467px] font-display text-[clamp(36px,3.9vw,56px)] leading-[1.119] tracking-[-0.0536em] text-black">
             The Mentors <br /> Behind My Growth
          </h2>
          <img src={underline} alt="" className="-mt-[9px] h-[29px] w-[363px] max-w-full" />

          {/* Every mentor's copy stacked into one grid cell, the way TypingWord
              pre-sizes its box: the column takes the height of the longest
              tribute once and never reflows as the carousel moves. */}
          <div ref={textRef} className="mt-[83px] grid">
            {MENTORS.map((mentor, position) => {
              const current = position === index
              return (
                <div
                  key={mentor.name}
                  className={`col-start-1 row-start-1 ${current ? '' : 'invisible'}`}
                  aria-hidden={!current}
                >
                  <p className="font-display text-[40px] capitalize leading-[1.119] tracking-[-0.05em] text-black">
                    {mentor.name}
                  </p>
                  <p className="mt-[8px] font-display text-[24px] capitalize leading-[1.119] tracking-[-0.0417em] text-muted">
                    {mentor.role}
                  </p>
                  <p className="mt-[40px] max-w-[524px] text-[20px] font-medium leading-[26px] text-ink">
                    {mentor.tribute}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex h-[240px] justify-center overflow-hidden sm:h-[330px] lg:h-auto lg:justify-start lg:self-end lg:overflow-visible">
          <div className="origin-top scale-[0.42] sm:scale-[0.6] lg:scale-100">
            <div className="relative shrink-0" style={{ width: STAGE.width, height: STAGE.height }}>
              <div
                className="absolute z-30 flex gap-[15px]"
                style={{ right: STAGE.width - (PREVIEW.left + PREVIEW.width), top: 8 }}
              >
                <button
                  type="button"
                  onClick={() => go(-1)}
                  aria-label="Previous mentor"
                  className={`flex size-[46px] items-center justify-center rounded-full border border-hairline bg-white text-ink ${ARROW_HIT}`}
                >
                  <Chevron back />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  aria-label="Next mentor"
                  className={`flex size-[46px] items-center justify-center rounded-full bg-accent text-white ${ARROW_HIT}`}
                >
                  <Chevron />
                </button>
              </div>

              {/* Two layers only while a transition is in flight — the outgoing
                  card has to stay mounted long enough to animate away. */}
              <div className="absolute" style={PRIMARY}>
                {previous >= 0 && !reduced && (
                  <div ref={leaveRef} className="absolute inset-0 z-10">
                    <PrimaryCard mentor={MENTORS[previous]} />
                  </div>
                )}
                <div ref={enterRef} className="absolute inset-0 z-20">
                  <PrimaryCard mentor={MENTORS[index]} />
                </div>
              </div>

              <button
                ref={previewRef}
                type="button"
                onClick={() => go(1)}
                aria-label={`Show ${preview.name}`}
                className="absolute z-40 overflow-hidden rounded-[30px] border-4 border-[rgba(250,250,250,0.93)] shadow-[0_4px_24px_0_rgba(0,0,0,0.25)]"
                style={PREVIEW}
              >
                <img src={preview.photo} alt="" className="size-full object-cover" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
