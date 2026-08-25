import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { ContentContext, type ContentState } from './context'
import { looksLikeContent } from './types'

/**
 * Fetches published CMS content once, at mount.
 *
 * The request rides inside the SignatureLoader's window. The loader draws for
 * 2500ms and holds for 500ms with the site already mounted behind it, so on any
 * reasonable connection the content has landed before the reveal and nothing
 * pops in. The loader is not an obstacle to work around — it is the budget.
 *
 * If the CMS is slow or down, the timeout fires, `content` stays null, and every
 * consumer falls back to the constant bundled beside it. A CMS outage must never
 * be able to blank the portfolio (§18).
 */

const API_BASE = import.meta.env.VITE_CMS_URL ?? ''
const TIMEOUT_MS = 2500

export function ContentProvider({ children }: { children: ReactNode }) {
  /* Seeded rather than set from inside the effect: with no CMS configured there
     is nothing to wait for, and calling setState in an effect body just to say
     so costs a second render pass. */
  const [state, setState] = useState<ContentState>(() => ({
    content: null,
    settled: !API_BASE,
  }))

  useEffect(() => {
    // No CMS configured (the default for a plain `npm run dev`): stay on bundled
    // content and never make a request.
    if (!API_BASE) return

    const controller = new AbortController()
    const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS)

    fetch(`${API_BASE}/api/v1/content`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        setState({ content: looksLikeContent(data) ? data : null, settled: true })
      })
      .catch(() => setState({ content: null, settled: true }))
      .finally(() => window.clearTimeout(timer))

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [])

  return <ContentContext.Provider value={state}>{children}</ContentContext.Provider>
}
