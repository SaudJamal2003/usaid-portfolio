import rawSignature from "../assets/signature.svg?raw";

/* The signature is a set of filled, compound outline paths (an image trace of a
   real pen stroke), not stroked ones — so `stroke-dasharray` on the artwork
   itself is impossible. Instead the artwork is left untouched and revealed
   through a mask whose single stroked path follows the pen's own centreline in
   writing order. Everything below is derived from the source file so swapping
   the artwork never means editing the component; only SIGNATURE_TRACE is
   hand-authored against this particular signature.

   `?raw` inlines the file's bytes at build time so the loader never waits on a
   second request — it can draw on its first frame. The raw string is read in
   exactly one place, inside this function, because a bundler that sees it in
   two will happily inline ~200 kB twice. */
function readSource(svg: string) {
  const openTagEnd = svg.indexOf(">", svg.indexOf("<svg"));
  return {
    /** viewBox of the source file, so the loader scales it without distortion. */
    viewBox: /viewBox="([^"]+)"/.exec(svg.slice(0, openTagEnd))?.[1] ?? "0 0 466 401",
    /** Everything inside the source `<svg>`, injected verbatim: the artwork is
        masked, never redrawn or simplified. */
    markup: svg.slice(openTagEnd + 1, svg.lastIndexOf("</svg>")),
  };
}

const source = readSource(rawSignature);

export const SIGNATURE_VIEW_BOX = source.viewBox;
export const SIGNATURE_MARKUP = source.markup;

/* The reveal centreline, traced by hand through the artwork in the order a pen
   would write it. Stroked at SIGNATURE_TRACE_WIDTH the five strokes together
   cover 99.96% of the artwork's pixels, so nothing is left behind at the end.

   They are separate paths rather than subpaths of one path because SVG restarts
   a dash pattern at every `M` — one multi-subpath trace draws all five strokes
   at once instead of in sequence.

   `start` and `duration` are fractions of the draw rather than milliseconds, so
   the loader owns the tempo; the gaps between them are the pen off the paper.
   Each path carries pathLength="1", which is what lets a plain 1 -> 0 dashoffset
   animation drive strokes of very different real lengths. */
export const SIGNATURE_STROKES = [
  {
    // the name itself: the U and its ascender, back down through the wave, then
    // up and over the tall loop and down into the descender
    d: "M59 131 L58 138 L57 151 L56 166 L54 180 L54 195 L54 208 L55 220 L57 231 L60 240 L66 246 L72 252 L78 255 L86 256 L92 254 L98 250 L103 244 L106 236 L109 225 L111 212 L114 198 L116 182 L119 168 L121 153 L123 140 L124 138 L123 147 L122 159 L121 173 L120 186 L118 199 L118 211 L117 222 L117 232 L118 240 L120 245 L122 246 L126 245 L131 242 L136 237 L140 231 L145 225 L150 220 L154 215 L158 211 L162 208 L164 207 L168 207 L170 209 L174 212 L177 214 L180 216 L183 218 L186 216 L188 214 L192 210 L194 205 L198 201 L201 198 L205 195 L210 192 L214 190 L220 188 L224 187 L230 186 L234 186 L240 187 L244 188 L250 189 L254 191 L260 192 L264 192 L270 189 L274 186 L279 182 L282 179 L286 178 L289 174 L293 166 L296 157 L299 146 L301 132 L303 118 L305 104 L307 90 L309 82 L310 76 L312 76 L315 78 L317 85 L320 95 L322 106 L322 116 L323 127 L323 137 L322 146 L321 154 L318 162 L316 168 L312 176 L310 183 L307 192 L304 200 L302 210 L302 220 L301 229 L301 238 L301 242",
    start: 0,
    duration: 0.62,
    ease: "cubic-bezier(0.45, 0, 0.4, 1)",
  },
  {
    // first tick
    d: "M205 231 L207 232 L212 235 L216 236 L218 238 L222 237 L224 234 L228 232 L231 228 L233 227",
    start: 0.644,
    duration: 0.028,
    ease: "ease-out",
  },
  {
    // second tick
    d: "M238 226 L240 225 L244 222 L248 220 L251 218 L255 216 L258 215 L260 214",
    start: 0.696,
    duration: 0.022,
    ease: "ease-out",
  },
  {
    // lower underline, a fast swipe back in from the left
    d: "M150 306 L160 303 L180 297 L200 291 L220 284 L240 278 L260 270 L280 263 L300 256 L320 248 L340 240 L360 232 L380 224 L390 220",
    start: 0.76,
    duration: 0.11,
    ease: "cubic-bezier(0.2, 0.55, 0.25, 1)",
  },
  {
    // the finish: one long flick out past the end of the name
    d: "M130 281 L140 279 L160 276 L180 272 L200 266 L220 262 L240 256 L260 251 L280 246 L300 241 L320 238 L340 234 L360 230 L380 226 L400 223 L423 219 L449 215 L462 213",
    start: 0.9,
    duration: 0.1,
    ease: "cubic-bezier(0.2, 0.55, 0.25, 1)",
  },
] as const;

/** Wide enough to swallow the thickest part of the brush stroke (~22 units). */
export const SIGNATURE_TRACE_WIDTH = 34;
