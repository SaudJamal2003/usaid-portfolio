import { createContext, useContext } from 'react'
import type { CmsContent } from './types'

/**
 * The context and its hook live apart from the provider component.
 *
 * A module that exports both a component and other values breaks Fast Refresh —
 * editing the hook would force a full reload instead of a hot update.
 */

export type ContentState = {
  content: CmsContent | null
  /** false until the request settles either way; useful when debugging, not for gating render. */
  settled: boolean
}

export const ContentContext = createContext<ContentState>({ content: null, settled: false })

/** Published CMS content, or null when it is unavailable — in which case every
 *  consumer falls back to the constant bundled beside it. */
export function useContent() {
  return useContext(ContentContext).content
}
