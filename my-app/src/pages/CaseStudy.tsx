import { useEffect, useState } from 'react'
import { ConnectCta } from '../components/ConnectCta'
import { SiteFooter } from '../components/SiteFooter'
import { SiteHeader } from '../components/SiteHeader'
import { WebCaseStudyTemplate } from '../components/caseStudy/template/WebCaseStudyTemplate'
import type { CmsCaseStudy } from '../content/types'
import { handleLinkClick } from '../router'

/**
 * A CMS-authored case study.
 *
 * One request for the whole page: the API hydrates every block's media into the
 * same payload, so there is no per-block or per-image fetch. Shukar Hai keeps
 * its hand-built page — this route only handles studies that exist in the CMS.
 */

const API_BASE = import.meta.env.VITE_CMS_URL ?? ''
const TIMEOUT_MS = 4000

type Load =
  | { state: 'loading' }
  | { state: 'ready'; caseStudy: CmsCaseStudy; preview: boolean }
  | { state: 'missing' }

function looksLikeCaseStudy(value: unknown): value is CmsCaseStudy {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  return typeof candidate.title === 'string' && Array.isArray(candidate.blocks)
}

export function CaseStudy({ slug, previewToken }: { slug: string; previewToken?: string }) {
  /* Seeded rather than set from inside the effect: with no CMS configured there
     is nothing to fetch, and saying so via setState costs a render pass. */
  const [load, setLoad] = useState<Load>(() =>
    API_BASE ? { state: 'loading' } : { state: 'missing' },
  )

  useEffect(() => {
    if (!API_BASE) return

    const controller = new AbortController()
    const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS)

    // A preview token is the only way to reach an unpublished study, and it is
    // minted by the CMS for an authenticated editor.
    const url = previewToken
      ? `${API_BASE}/api/v1/preview/${encodeURIComponent(previewToken)}`
      : `${API_BASE}/api/v1/case-studies/${encodeURIComponent(slug)}`

    fetch(url, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        const record = previewToken ? data?.caseStudy : data
        setLoad(
          looksLikeCaseStudy(record)
            ? { state: 'ready', caseStudy: record, preview: Boolean(previewToken) }
            : { state: 'missing' },
        )
      })
      .catch(() => setLoad({ state: 'missing' }))
      .finally(() => window.clearTimeout(timer))

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [slug, previewToken])

  return (
    <>
      <div className="mx-auto w-full max-w-[1440px] overflow-x-clip bg-white font-sans text-ink antialiased">
        <SiteHeader current="Work" className="h-[110px]" />

        <main className="pt-[204px]">
          {load.state === 'ready' && load.preview && (
            <div className="mx-auto mb-[40px] w-full max-w-[1240px] px-4 sm:px-6">
              <p className="rounded-[12px] bg-mint px-4 py-2 font-display text-[16px] text-black">
                Preview — this is a draft and is not visible on the live site.
              </p>
            </div>
          )}

          {load.state === 'loading' && (
            <section className="px-4 sm:px-6">
              <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-[24px]">
                <h1 className="font-display text-[clamp(40px,5.56vw,80px)] leading-[1.1] tracking-[-0.0375em] text-ink">
                  {' '}
                </h1>
              </div>
            </section>
          )}

          {load.state === 'ready' && load.caseStudy.category === 'APP' && (
            /* No design exists for App case studies yet -- title and client
               only, styled like the "isn't available" empty state below,
               deliberately not the full Web hero/meta/block treatment. */
            <section className="px-4 sm:px-6">
              <div className="mx-auto flex w-full max-w-[1240px] flex-col items-start gap-[20px]">
                <h1 className="font-display text-[clamp(32px,3.89vw,56px)] font-medium leading-[1.107] tracking-[-0.0357em] text-ink">
                  {load.caseStudy.title}
                </h1>
                {load.caseStudy.client && (
                  <p className="font-display text-[clamp(18px,1.6vw,24px)] text-muted">
                    {load.caseStudy.client}
                  </p>
                )}
                <p className="font-display text-[clamp(18px,1.6vw,24px)] text-body">Coming soon.</p>
              </div>
            </section>
          )}

          {load.state === 'ready' && load.caseStudy.category !== 'APP' && (
            <WebCaseStudyTemplate caseStudy={load.caseStudy} />
          )}

          {load.state === 'missing' && (
            <section className="px-4 sm:px-6">
              <div className="mx-auto flex w-full max-w-[1240px] flex-col items-start gap-[20px]">
                <h2 className="font-display text-[clamp(32px,3.89vw,56px)] font-medium leading-[1.107] tracking-[-0.0357em] text-ink">
                  This case study isn&rsquo;t available.
                </h2>
                <p className="font-display text-[clamp(18px,1.6vw,24px)] text-body">
                  It may have moved, or it may not be published yet.
                </p>
                <a
                  href="/#work"
                  onClick={(e) => handleLinkClick(e, '/#work')}
                  className="inline-flex h-[52px] items-center justify-center rounded-[12px] border-3 border-ink bg-accent px-[28px] text-[16px] font-semibold text-ink"
                >
                  See all work
                </a>
              </div>
            </section>
          )}

          <ConnectCta className="mt-[200px]" />
        </main>
      </div>
      <SiteFooter />
    </>
  )
}
