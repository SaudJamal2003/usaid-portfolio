import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  SIGNATURE_MARKUP,
  SIGNATURE_STROKES,
  SIGNATURE_TRACE_WIDTH,
  SIGNATURE_VIEW_BOX,
} from "./signatureArtwork";

/* The whole sequence, in one place. The draw duration is handed to the CSS
   animation inline so `signature-draw` in index.css stays a pure shape. */
const DRAW = 2500;
const HOLD = 500;
const REVEAL = 1000;

/* Reduced motion keeps the beat — signature, pause, dissolve — but skips the
   writing itself and lands on the finished mark straight away. */
const REDUCED = { draw: 0, hold: 400, reveal: 400 };

type Phase = "drawing" | "revealing" | "done";

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

type SignatureLoaderProps = {
  /** the site, rendered underneath from the first frame and faded in at the end */
  children: ReactNode;
};

/**
 * Full-screen white overlay that writes the signature once on load, holds it,
 * then dissolves while the site fades up behind it. The site is mounted the
 * whole time — only hidden — so nothing is still loading when it appears.
 */
export function SignatureLoader({ children }: SignatureLoaderProps) {
  const [reduced] = useState(prefersReducedMotion);
  const [phase, setPhase] = useState<Phase>("drawing");
  // useId returns characters that are awkward inside url(#…); keep it to the
  // safe set so several loaders can still coexist without colliding.
  const maskId = `signature-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const timing = reduced ? REDUCED : { draw: DRAW, hold: HOLD, reveal: REVEAL };

  useEffect(() => {
    const toReveal = window.setTimeout(
      () => setPhase("revealing"),
      timing.draw + timing.hold,
    );
    const toDone = window.setTimeout(
      () => setPhase("done"),
      timing.draw + timing.hold + timing.reveal,
    );
    return () => {
      window.clearTimeout(toReveal);
      window.clearTimeout(toDone);
    };
  }, [timing.draw, timing.hold, timing.reveal]);

  // The site is laid out behind the overlay, so it must not scroll under it.
  const finished = phase === "done";
  useEffect(() => {
    if (finished) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [finished]);

  /* The ink does not sit in the middle of its own viewBox — this signature is
     about 5% right of centre — so the mark would hang off-centre on an
     otherwise empty screen. Measure the artwork once and nudge the whole svg,
     mask included, by the difference. Percentages resolve against the rendered
     box, so one measurement holds at every size. */
  const artRef = useRef<SVGGElement>(null);
  const [nudge, setNudge] = useState<{ x: number; y: number } | null>(null);
  useLayoutEffect(() => {
    const art = artRef.current;
    if (!art) return;
    const ink = art.getBBox();
    const [, , boxWidth, boxHeight] = SIGNATURE_VIEW_BOX.split(/\s+/).map(Number);
    setNudge({
      x: ((boxWidth / 2 - (ink.x + ink.width / 2)) / boxWidth) * 100,
      y: ((boxHeight / 2 - (ink.y + ink.height / 2)) / boxHeight) * 100,
    });
  }, []);

  const revealed = phase !== "drawing";

  return (
    <>
      <div
        // Opacity only: a transform or filter here would re-anchor the site's
        // `fixed` header to this element instead of the viewport.
        className={`transition-opacity ease-out ${revealed ? "opacity-100" : "opacity-0"}`}
        style={{ transitionDuration: `${timing.reveal}ms` }}
      >
        {children}
      </div>

      {!finished && (
        <div
          aria-hidden="true"
          className={`fixed inset-0 z-[9999] flex items-center justify-center bg-white transition-opacity ease-out ${
            revealed ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
          style={{ transitionDuration: `${timing.reveal}ms` }}
        >
          <svg
            viewBox={SIGNATURE_VIEW_BOX}
            className={`h-auto w-[clamp(220px,min(42vw,69vh),460px)] max-w-[80vw] text-ink transition-opacity ease-out ${
              revealed ? "opacity-0" : "opacity-100"
            }`}
            // The mark clears a beat before the sheet does, so the white lifts
            // off an already-empty page rather than a dissolving signature.
            style={{
              transitionDuration: `${Math.round(timing.reveal * 0.6)}ms`,
              transform: nudge ? `translate(${nudge.x}%, ${nudge.y}%)` : undefined,
            }}
          >
            <defs>
              <mask id={maskId} maskUnits="userSpaceOnUse">
                {/* White reveals. One path per pen stroke, each normalised with
                    pathLength="1" so a flat 1 -> 0 dashoffset writes it end to
                    end no matter how long the stroke actually is. */}
                {SIGNATURE_STROKES.map((stroke) => (
                  <path
                    key={stroke.d}
                    d={stroke.d}
                    pathLength="1"
                    fill="none"
                    stroke="#fff"
                    strokeWidth={SIGNATURE_TRACE_WIDTH}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={reduced ? undefined : "signature-trace"}
                    style={
                      reduced
                        ? undefined
                        : {
                            animationDuration: `${stroke.duration * timing.draw}ms`,
                            animationDelay: `${stroke.start * timing.draw}ms`,
                            animationTimingFunction: stroke.ease,
                          }
                    }
                  />
                ))}
              </mask>
            </defs>
            {/* The ink override lives on this group, not the <svg>: a rule
                wide enough to reach the mask's own paths would fill them too,
                and a filled trace leaks the whole signature through at once. */}
            <g
              ref={artRef}
              className="signature-ink"
              mask={`url(#${maskId})`}
              dangerouslySetInnerHTML={{ __html: SIGNATURE_MARKUP }}
            />
          </svg>
        </div>
      )}
    </>
  );
}
