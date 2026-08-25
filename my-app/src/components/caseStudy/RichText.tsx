import { createElement, type ReactNode } from 'react'

/**
 * Renders CMS rich text without ever handing HTML to the DOM.
 *
 * The CMS sanitises on write, but that is its boundary, not this one. Here the
 * markup is parsed and rebuilt as React elements from an allow-list, so an
 * unexpected tag or attribute cannot be rendered even if it somehow reached the
 * payload — there is no innerHTML anywhere in this path.
 *
 * Typography is the portfolio's. The CMS supplies structure and words; every
 * class below comes from the existing case study sections.
 */

const BLOCK_TAGS: Record<string, string> = {
  P: 'p',
  H2: 'h2',
  H3: 'h3',
  H4: 'h4',
  UL: 'ul',
  OL: 'ol',
  LI: 'li',
  BLOCKQUOTE: 'blockquote',
  BR: 'br',
}

const INLINE_TAGS: Record<string, string> = {
  STRONG: 'strong',
  B: 'strong',
  EM: 'em',
  I: 'em',
  A: 'a',
}

/* Matches the existing sections: body copy is display font at the same clamp
   the challenge and exploration sections use. */
const CLASSES: Record<string, string> = {
  p: 'font-display text-[clamp(18px,1.6vw,24px)] leading-[1.6] text-body',
  h2: 'font-display text-[clamp(28px,3vw,44px)] font-medium leading-[1.107] tracking-[-0.0357em] text-ink',
  h3: 'font-display text-[clamp(22px,2.2vw,32px)] font-medium leading-[1.2] tracking-[-0.02em] text-ink',
  h4: 'font-display text-[clamp(20px,1.8vw,26px)] font-medium leading-[1.3] text-ink',
  ul: 'flex list-disc flex-col gap-[10px] ps-[24px] font-display text-[clamp(18px,1.6vw,24px)] leading-[1.6] text-body',
  ol: 'flex list-decimal flex-col gap-[10px] ps-[24px] font-display text-[clamp(18px,1.6vw,24px)] leading-[1.6] text-body',
  li: '',
  blockquote: 'border-l-3 border-accent-deep px-[20px] py-[10px] font-display text-[clamp(20px,1.94vw,28px)] text-black',
  a: 'text-accent-deep underline underline-offset-2',
  strong: 'font-semibold text-ink',
  em: 'italic',
}

/** Only schemes that cannot execute. Anything else loses its href entirely. */
function safeHref(raw: string | null): string | undefined {
  if (!raw) return undefined
  const value = raw.trim()
  if (value.startsWith('#') || value.startsWith('/')) return value
  if (/^(https?:|mailto:)/i.test(value)) return value
  return undefined
}

function toReact(node: Node, key: number): ReactNode {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent

  if (node.nodeType !== Node.ELEMENT_NODE) return null
  const element = node as Element
  const tag = BLOCK_TAGS[element.tagName] ?? INLINE_TAGS[element.tagName]

  const children = Array.from(element.childNodes).map((child, index) => toReact(child, index))

  // Unknown tag: keep the words, drop the wrapper. Sanitising must never
  // silently delete someone's copy.
  if (!tag) return children.length ? children : null
  if (tag === 'br') return createElement('br', { key })

  if (tag === 'a') {
    const href = safeHref(element.getAttribute('href'))
    if (!href) return children
    const external = /^https?:/i.test(href)
    return createElement(
      'a',
      {
        key,
        href,
        className: CLASSES.a,
        ...(external ? { target: '_blank', rel: 'noreferrer noopener' } : {}),
      },
      children,
    )
  }

  return createElement(tag, { key, className: CLASSES[tag] || undefined }, children)
}

export function RichText({ html }: { html: string }) {
  const value = html?.trim()
  if (!value) return null

  // Content authored before the rich-text editor is plain text, and stays valid.
  if (!/<[a-z][\s\S]*>/i.test(value)) {
    return <p className={CLASSES.p}>{value}</p>
  }

  let body: HTMLElement
  try {
    body = new DOMParser().parseFromString(value, 'text/html').body
  } catch {
    return <p className={CLASSES.p}>{value}</p>
  }

  return (
    <div className="flex flex-col gap-[24px]">
      {Array.from(body.childNodes).map((node, index) => toReact(node, index))}
    </div>
  )
}
