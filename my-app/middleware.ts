import { next } from '@vercel/functions'

/**
 * Rewrites OG/social meta tags for crawlers only.
 *
 * A URL fragment (`#/work/shukar-hai`) never reaches a server, so hash
 * routing made per-page previews impossible no matter what the CMS stored —
 * see docs/seo-limitation.md. Real paths (`/work/shukar-hai`) fixed that half
 * of the problem; this is the other half. It only ever does anything for a
 * known bot user agent — every real visitor gets the exact same static
 * index.html and client-side app as before, untouched.
 */

export const config = {
  matcher: ['/', '/about', '/work/:slug*'],
}

// Mirrors the same production default set in src/content/ContentProvider.tsx.
const CMS_URL = 'https://cms.usaidux.space'

const BOT_UA =
  /facebookexternalhit|Facebot|Twitterbot|Slackbot|WhatsApp|LinkedInBot|Discordbot|TelegramBot|Googlebot|Applebot|Pinterest|redditbot/i

type Seo = {
  title: string | null
  description: string | null
  canonicalUrl: string | null
  noIndex: boolean
  ogImage: { url: string; mediumUrl: string } | null
}

/**
 * "/" and "/about" share one resolution (homepage, falling back to the site
 * default) — there is no distinct "About" SEO entity in the CMS's data model
 * today. A case study reads its own resolved `seo` field, which is the
 * correct source of truth for that page (not `content.seo.byProjectSlug`,
 * a different entity/keyspace keyed by project, not case-study, slug).
 */
async function resolveSeoFor(pathname: string): Promise<Seo | null> {
  try {
    if (pathname.startsWith('/work/')) {
      const slug = pathname.slice('/work/'.length).replace(/\/$/, '')
      if (!slug) return null
      const res = await fetch(`${CMS_URL}/api/v1/case-studies/${encodeURIComponent(slug)}`)
      if (!res.ok) return null
      const data = (await res.json()) as { seo?: Seo }
      return data?.seo ?? null
    }

    const res = await fetch(`${CMS_URL}/api/v1/content`)
    if (!res.ok) return null
    const data = (await res.json()) as { seo?: { homepage?: Seo; defaults?: Seo } }
    return data?.seo?.homepage ?? data?.seo?.defaults ?? null
  } catch {
    return null
  }
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/**
 * Swaps values into the fixed tag set already in index.html. Never emits an
 * empty content="" — any field the CMS returns null for keeps its existing
 * hardcoded value. og:image:width/:height stay as hints; a CMS image's exact
 * pixel size isn't guaranteed to match, and platforms treat these as hints,
 * not strict checks.
 */
function injectTags(html: string, seo: Seo | null, canonicalUrl: string): string {
  if (!seo) return html

  const title = seo.title
  const description = seo.description
  const image = seo.ogImage?.mediumUrl ?? seo.ogImage?.url ?? null
  const url = seo.canonicalUrl ?? canonicalUrl

  let out = html

  if (title) {
    out = out.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`)
    out = out.replace(/(property="og:title"\s+content=")[^"]*(")/, `$1${escapeHtml(title)}$2`)
    out = out.replace(/(name="twitter:title"\s+content=")[^"]*(")/, `$1${escapeHtml(title)}$2`)
  }

  if (description) {
    out = out.replace(/(property="og:description"\s+content=")[^"]*(")/, `$1${escapeHtml(description)}$2`)
    out = out.replace(/(name="twitter:description"\s+content=")[^"]*(")/, `$1${escapeHtml(description)}$2`)
  }

  if (image) {
    out = out.replace(/(property="og:image"\s+content=")[^"]*(")/, `$1${escapeHtml(image)}$2`)
    out = out.replace(/(name="twitter:image"\s+content=")[^"]*(")/, `$1${escapeHtml(image)}$2`)
    // No separate alt field on the CMS's resolved SEO record (only on the
    // media asset itself, not part of this shape) — the title doubles as it.
    if (title) {
      out = out.replace(/(property="og:image:alt"\s+content=")[^"]*(")/, `$1${escapeHtml(title)}$2`)
    }
  }

  out = out.replace(/(property="og:url"\s+content=")[^"]*(")/, `$1${escapeHtml(url)}$2`)

  if (seo.noIndex) {
    out = out.replace('</head>', '<meta name="robots" content="noindex" />\n  </head>')
  }

  return out
}

export default async function middleware(request: Request) {
  const userAgent = request.headers.get('user-agent') ?? ''
  if (!BOT_UA.test(userAgent)) return next()

  const url = new URL(request.url)

  try {
    const [seo, htmlRes] = await Promise.all([
      resolveSeoFor(url.pathname),
      fetch(new URL('/index.html', url.origin)),
    ])

    // Fail open on any problem reaching the CMS or the static shell — a
    // crawler getting the generic site-wide preview is a far better outcome
    // than an error, and a draft's real title/image can never leak this way:
    // the CMS's own case-study endpoint never serves an unpublished slug.
    if (!htmlRes.ok) return next()

    const html = await htmlRes.text()
    const modified = injectTags(html, seo, url.href)

    return new Response(modified, {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, max-age=30, stale-while-revalidate=300',
      },
    })
  } catch {
    return next()
  }
}
