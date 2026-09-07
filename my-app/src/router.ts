import { useSyncExternalStore, type MouseEvent } from 'react'

/**
 * A tiny, dependency-free path router.
 *
 * Mirrors the previous hash-based approach exactly, just keyed off
 * `location.pathname`/`location.search` instead of `location.hash` — paths
 * reach the server (crawlers, the OG-tag middleware) where fragments never
 * did. That is the entire reason this file exists; see docs/seo-limitation.md.
 */

function subscribe(onChange: () => void) {
  window.addEventListener('popstate', onChange)
  return () => window.removeEventListener('popstate', onChange)
}

export function usePathname() {
  return useSyncExternalStore(
    subscribe,
    () => window.location.pathname,
    () => '/',
  )
}

export function useHash() {
  return useSyncExternalStore(
    subscribe,
    () => window.location.hash,
    () => '',
  )
}

/** Programmatic navigation without a full page reload. `pushState` alone does
 *  not fire `popstate`, so every route hook would miss it — dispatch the same
 *  event back/forward already delivers natively. */
export function navigate(href: string) {
  const current = window.location.pathname + window.location.search + window.location.hash
  if (href === current) return
  history.pushState(null, '', href)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

/**
 * Attach to any internal link's onClick — path links (`/about`) and bare
 * in-page anchors (`#work`) alike.
 *
 * A path href (starting with "/", not "//") is always intercepted into an
 * in-app navigation. A bare "#anchor" href is left to the browser untouched
 * when already on "/" — exactly today's native behaviour — but is turned
 * into a real navigation to `/` + the anchor from any other page: path and
 * hash are independent now, so without this a plain "#work" click from, say,
 * the About page would only rewrite the fragment in place and never actually
 * go anywhere, since `pathname` never changes on its own. Every other kind of
 * link — external, mailto:/tel:, modified clicks, target="_blank" — is left
 * to the browser exactly as it works today.
 *
 * Typed as HTMLElement, not HTMLAnchorElement: a couple of call sites render
 * a polymorphic `'a' | 'div'` tag, where TypeScript can't narrow the handler
 * to just the anchor branch. `.target` simply reads as undefined on anything
 * that isn't a real anchor, which the `=== '_blank'` check already treats as
 * false — safe on any element, not just an `<a>`.
 */
export function handleLinkClick(event: MouseEvent<HTMLElement>, href: string) {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    (event.currentTarget as HTMLAnchorElement).target === '_blank'
  ) {
    return
  }

  if (href.startsWith('/') && !href.startsWith('//')) {
    event.preventDefault()
    navigate(href)
    return
  }

  if (href.startsWith('#') && window.location.pathname !== '/') {
    event.preventDefault()
    navigate(`/${href}`)
  }
}

/**
 * One-time correction for old-style hash links ("#/work/slug", "#/about")
 * already shared somewhere before this migration shipped. Runs at module
 * load, before the first render, so the very first route read already
 * reflects the corrected path. A crawler's request is unaffected either way
 * — old shared links were already broken for crawlers, which is the entire
 * reason this migration exists — this only helps a real visitor's browser.
 */
;(function redirectLegacyHash() {
  if (typeof window === 'undefined') return
  const match = window.location.hash.match(/^#\/(work\/[^/?]+|about)(?:\?(.*))?$/)
  if (!match) return
  const [, path, query] = match
  history.replaceState(null, '', `/${path}${query ? `?${query}` : ''}`)
})()
