import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { looksLikeContent, type CmsContent } from './types'

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

type ContentState = {
  content: CmsContent | null
  /** false until the request settles either way; useful for debugging, not for gating render. */
  settled: boolean
}

const ContentContext = createContext<ContentState>({ content: null, settled: false })

export function ContentProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ContentState>({ content: null, settled: false })

  useEffect(() => {
    // No CMS configured (the default for a plain `npm run dev`): stay on
    // bundled content and never make a request.
    if (!API_BASE) {
      setState({ content: null, settled: true })
      return
    }

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

export function useContent() {
  return useContext(ContentContext).content
}

/**
 * Picks CMS data when it is actually usable, otherwise the bundled fallback.
 *
 * The emptiness check matters: several collections are deliberately incomplete
 * in the CMS right now because the seed refused to invent copy, and an empty
 * array must not blank a section that currently renders fine from bundled
 * content (§55). Fallbacks come out per module, once that module's content has
 * been completed and verified.
 */
export function useCollection<T>(select: (content: CmsContent) => T[] | undefined, fallback: T[]): T[] {
  const content = useContent()
  if (!content) return fallback
  const value = select(content)
  return value && value.length > 0 ? value : fallback
}

/** Same idea for a single value. */
export function useValue<T>(select: (content: CmsContent) => T | null | undefined, fallback: T): T {
  const content = useContent()
  if (!content) return fallback
  const value = select(content)
  return value ?? fallback
}
