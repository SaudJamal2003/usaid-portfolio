import { useEffect, useState, useSyncExternalStore } from 'react'

/* Tempo. Per-character delays get a little random spread so the rhythm never
   reads as mechanical — set HUMAN_JITTER to 0 for an even cadence. */
const TYPING_SPEED = 100
const DELETE_SPEED = 60
const WORD_PAUSE = 1800
const BETWEEN_WORDS_PAUSE = 400
const HUMAN_JITTER = 0.35

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

function subscribeToMotionPreference(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

/* Live rather than sampled once, so toggling the OS setting stops or restarts
   the typing straight away. useSyncExternalStore matches how App.tsx already
   subscribes to the hash. */
function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeToMotionPreference,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  )
}

function humanised(delay: number) {
  return delay * (1 + (Math.random() * 2 - 1) * HUMAN_JITTER)
}

type TypingWordProps = {
  /** cycled in order; declare it at module scope so the reference stays stable */
  words: readonly string[]
}

/**
 * One word of a headline, typed and backspaced a character at a time. The box
 * is pre-sized to the widest word in the list, so a centred headline neither
 * reflows nor re-centres while the characters appear.
 */
export function TypingWord({ words }: TypingWordProps) {
  const reduced = usePrefersReducedMotion()
  const [index, setIndex] = useState(0)
  const [typed, setTyped] = useState(0)
  const [deleting, setDeleting] = useState(false)

  const word = words[index]

  /* Finishing a word, or clearing one, is the moment the timer waits out a
     pause rather than stepping to the next character. */
  const resting = deleting ? typed === 0 : typed === word.length

  useEffect(() => {
    if (reduced) return

    const step = () => {
      if (!deleting) {
        if (typed < word.length) return setTyped(typed + 1)
        return setDeleting(true)
      }
      if (typed > 0) return setTyped(typed - 1)
      setIndex((current) => (current + 1) % words.length)
      setDeleting(false)
    }

    const pause = deleting ? BETWEEN_WORDS_PAUSE : WORD_PAUSE
    const timer = window.setTimeout(
      step,
      resting ? pause : humanised(deleting ? DELETE_SPEED : TYPING_SPEED),
    )
    return () => window.clearTimeout(timer)
  }, [reduced, deleting, typed, resting, word, words])

  const shown = reduced ? words[0] : word.slice(0, typed)

  return (
    <span className="relative inline-block whitespace-nowrap text-left align-baseline text-accent">
      {/* What assistive tech reads, in place of text that rewrites itself. */}
      <span className="sr-only">{words[0]}</span>

      {/* Every word stacked into a single grid cell. The cell takes the width of
          the widest of them and the height of one line, which is what holds the
          headline still — measured rather than guessed, since the display font
          may fall back differently from one machine to the next. */}
      <span aria-hidden="true" className="invisible inline-grid">
        {words.map((candidate) => (
          <span key={candidate} className="col-start-1 row-start-1">
            {candidate}
          </span>
        ))}
      </span>

      {/* Out of flow, so the characters appearing can never move anything. */}
      <span aria-hidden="true" className="absolute left-0 top-0">
        {shown}
      </span>
    </span>
  )
}
