# SEO: how per-page metadata reaches link previews

Short version: **CMS-stored metadata reaches real link previews** (Slack,
LinkedIn, X, WhatsApp, iMessage) within about 30 seconds of publishing, no
deployment required. This wasn't always true — see "How it used to work" below
for why, and why fixing it required a routing change first.

## How it works today

The portfolio uses real path routing (`/work/shukar-hai`, `/about`), not hash
routing. A Vercel Routing Middleware (`my-app/middleware.ts`) inspects every
request to `/`, `/about`, and `/work/:slug`:

- **A normal browser** gets the exact same static `index.html` and
  client-side app as always — the middleware does nothing for real visitors.
- **A known crawler/bot user agent** (Facebook, Slack, X, WhatsApp, LinkedIn,
  Discord, Telegram, Google, Apple, Pinterest, Reddit) gets the same HTML,
  but with the `<title>` and `og:`/`twitter:` tags swapped for that specific
  page's CMS-resolved values, fetched live from `/api/v1/content` or
  `/api/v1/case-studies/:slug` at request time.

Because the middleware fetches live, updating SEO fields in the CMS and
publishing is enough — the next crawler request (cached up to 30 seconds,
same window as the rest of the public API) sees the new values. No rebuild,
no webhook.

If the CMS is unreachable, or a slug is unpublished, the middleware fails
open: it serves the original, unmodified default tags rather than erroring —
a generic preview beats a broken one, and a draft's content can never leak
through it (the CMS's case-study endpoint never serves an unpublished slug in
the first place).

## How it used to work (kept for context)

The portfolio used to be a Vite SPA on **hash routing**
(`#/work/shukar-hai`). A URL fragment never reaches a server — that's true
for any HTTP client, not just browsers — so the server only ever saw a
request for `/` and returned one fixed `index.html` for every "page." Social
scrapers don't execute JavaScript either, so whatever a page's React
component might set on `document.head` after load was invisible to them.
Every shared link showed the same site-wide title and image, regardless of
which case study.

The CMS's SEO data model — the resolution chain in `cms/src/lib/seo.ts`, the
resolved payload in the public API — predates this fix and was unchanged by
it. What changed is delivery: real paths mean a crawler's request actually
carries which page it wants, which a hash fragment could never do.

## If someone asks "is our SEO set up?"

Yes, for both the data and the delivery. Set a title, description, and OG
image on a project or case study in the CMS, publish, and a link shared
within about 30 seconds to a minute shows exactly that.
