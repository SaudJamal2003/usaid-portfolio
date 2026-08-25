# SEO: what the CMS does, and what it cannot do yet

Short version: **the CMS stores metadata correctly, and none of it reaches a
crawler or a link preview today.** That is not a bug in the CMS — it is a
property of how the portfolio is routed, and it will stay true until the
routing changes.

## Why

The portfolio is a Vite SPA using hash routing:

```
https://www.usaidux.space/#/work/shukar-hai
                          └──────────────┘
                          never sent to the server
```

A URL fragment is a client-side concept. The server sees a request for `/` and
returns the same `index.html` for every route, carrying one fixed set of tags.

On top of that, the scrapers that build link previews — Slack, LinkedIn, X,
Facebook, WhatsApp, iMessage — **do not execute JavaScript at all**. They fetch
the HTML, read the `og:` tags, and stop. Anything React writes into
`document.head` after load happens long after they have left.

Google does render JavaScript for many pages, but treats client-injected
metadata as a weaker signal than what is in the served HTML, and gives no
guarantee about timing.

So today:

| | Source | Per-page? |
|---|---|---|
| `<title>`, `description`, `og:*` on the live site | `my-app/index.html` | No — one set, site-wide |
| Values stored in the CMS | Postgres, served via `/api/v1/content` | Yes, but not rendered |

Pasting a link to any case study into Slack shows the site-wide preview image
and the site-wide title, no matter what is set in the CMS.

## What was built anyway, and why it is not wasted

- Global defaults on Site Settings.
- Per-entity overrides for the homepage, every project and every case study.
- A resolution chain — entity value, then global default, then nothing — that
  lives in one module (`cms/src/lib/seo.ts`) so "inherits from global" means the
  same thing everywhere.
- Resolved metadata served in the public payload (`seo.defaults`,
  `seo.homepage`, `seo.byProjectSlug`) and on each case study.

The data model and the content are the slow part of an SEO migration. Doing
them now means the migration below is a wiring change rather than a content
project.

## What would make it real

Either of these, in order of effort:

**1. Path routing plus prerendering (keeps Vite).**
Replace `#/work/:slug` with `/work/:slug`, add a prerender step that emits one
HTML file per route with that route's tags baked in, and rebuild on publish via
a webhook. Keeps every existing animation and component. Costs a build on each
publish (~1 minute) instead of the current instant 30-second cache window.

**2. Move the portfolio to Next.js.**
Metadata becomes server-rendered per route with no build step. This is the
option the original requirements document assumed, and the one explicitly ruled
out — it means re-implementing routing and re-verifying the scroll pin, the
signature loader and the mentors carousel.

Neither is scheduled. Both are unblocked by the work already done.

## The one thing that does work client-side

`document.title` can be updated from React and the browser tab, history entry
and bookmark name follow it. That is a real if modest improvement when someone
opens a case study. It is **not** SEO and it is not a link preview — no scraper
sees it.

This is not currently wired up, deliberately: a half-measure that looks like
per-page SEO invites the assumption that the rest works too.

## If someone asks "is our SEO set up?"

Yes for the data. No for the delivery. The honest answer is: the metadata is
written and stored per page; the site serves one global set of tags until the
routing migration happens.
