# Portfolio CMS — Architecture Decisions

Companion to `USAID_UX_Portfolio_CMS_Requirements.md`. That document assumes a
Next.js portfolio; this one records what actually changes because the portfolio
is a Vite SPA, and pins the decisions made on 2026-08-24.

## Decisions

| Question | Decision |
|---|---|
| Portfolio frontend | **Stays a Vite SPA.** Not ported to Next.js. |
| Content delivery | Runtime fetch from a content API, with the current hardcoded content as fallback |
| Hosting | Self-hosted VPS — Docker, Postgres, MinIO |
| CMS app | Separate app; the portfolio build is untouched |

## What this costs, stated plainly

Choosing "keep Vite as-is" makes three sections of the requirements doc
undeliverable or reduced. None of these are blockers, but none should be
discovered later.

**§30 SEO module is out of MVP scope.** Routing is `#/about`,
`#/work/shukar-hai`. A fragment never reaches the server, so every route serves
one `index.html` with one set of meta tags. Crawlers do not run the app's JS, so
nothing React writes to `document.head` is seen by Google, Slack, LinkedIn or
X. Per-case-study SEO title / description / OG image / canonical cannot work.

  - The CMS **will still store** SEO fields per entity, so the data exists on the
    day routing changes.
  - The live source of truth stays the static block in `index.html`.
  - Revisit only if path routing + prerendering is adopted later.

**§33 cache invalidation becomes trivial.** There is no build step to trigger
and no ISR to revalidate. Publishing writes to Postgres and the next fetch sees
it. HTTP cache headers on the public API are the whole strategy.

**§32 preview gets easier, not harder.** Because the portfolio already fetches
at runtime, preview is the same fetch with a token that permits draft content.
No separate preview deployment.

## The pop-in problem, and why it is already solved

Content is currently bundled, so it paints instantly. Fetching it at runtime
would normally mean the hero text arrives a beat late — a bad trade on a
portfolio whose identity is a polished intro.

`SignatureLoader` already holds the page for a DRAW → HOLD → REVEAL cycle. The
content fetch belongs inside that window. The loader is not a delay to work
around; it is the fetch budget.

```
mount ──► start signature animation
      └─► GET /api/v1/content  (parallel)

  reveal when BOTH the animation has finished AND content has resolved,
  falling back to bundled content if the request fails or is slow
```

Anything slower than the animation falls back rather than stalling the page.

## Content model

Derived from the audit of what is actually hardcoded today.

```
site_settings ──── singleton: site name, contact email, availability, socials
navigation_items ─ label, url, new_tab, visible, order
footer_settings ── singleton: email, copyright, CTA

homepage_hero ──── singleton: typing words[], doodles, CTA label/url
about ──────────── singleton: heading, bio, profile image
stats ──────────── repeatable: value, caption, blurb, order
experience ─────── repeatable: company, role, period, logo, highlights[]   ← per-role
mentors ────────── repeatable: name, role, photo, tribute, order
gallery_items ──── repeatable: image, caption, order          (Life Outside Figma)

projects ───────── title, slug, blurb, cover, aspect, featured, order, status
case_studies ───── title, slug, client, meta, status, published_at
case_study_blocks  case_study_id, type, order, data JSONB

media ──────────── storage_key, mime, size, w, h, alt_text, caption
seo_metadata ───── entity_type, entity_id, title, description, og_image_id
activity_logs ──── actor, action, entity_type, entity_id, created_at
users ──────────── single owner initially
```

Note `experience.highlights` is **per-role**. Today `Journey.tsx` shares one
`HIGHLIGHTS` array across all four roles, so every card renders identical
bullets. Modelling it correctly forces that content to be written.

### What must never enter the CMS

Matches §3 of the requirements doc. These are motion and geometry, not content:

- `TypingWord` — TYPING_SPEED, DELETE_SPEED, WORD_PAUSE, HUMAN_JITTER
- `SignatureLoader` — DRAW, HOLD, REVEAL
- `Journey` — DESKTOP, REDUCED_MOTION, pin travel geometry
- `Mentors` — STAGE, PRIMARY, PREVIEW, TO_PREVIEW, SIDEWAYS, EASE, ARROW_HIT

## API surface

Two boundaries, as §35 requires. Drafts are never reachable from the public
API — the filter is applied in the query, not in the caller.

```
PUBLIC   GET /api/v1/content            entire published site payload, one request
         GET /api/v1/case-studies/:slug
         GET /api/v1/preview/:token     draft content, token-gated, short TTL

ADMIN    POST   /api/admin/auth/login
         CRUD   /api/admin/{projects,case-studies,mentors,experience,…}
         POST   /api/admin/case-studies/:id/blocks/reorder
         POST   /api/admin/case-studies/:id/publish
         POST   /api/admin/media          multipart → MinIO → row
         GET    /api/admin/activity
```

The public payload is deliberately one request. The portfolio needs everything
at once during the loader window; N requests would defeat the fetch budget.

## Media

122 MB currently lives in `src/assets/figma/` and is bundled into `dist/`
(`shukar-hai-recording.mp4` alone is ~99 MB). Moving it to MinIO is worth doing
on its own merits — it is not CMS-specific.

```
upload → validate mime + size → generate storage key → MinIO
       → derive thumb / medium / large → media row → return id
```

Originals are retained. The portfolio references media by id and receives a
signed or public URL in the content payload.

## Fallback strategy

Per §55. Every consumer keeps its current hardcoded constant as the default:

```
CMS payload has the key?  ── yes ──► use it
                          ── no  ──► use the bundled constant
```

Fallbacks are removed per-module only after that module is migrated and
verified in production. This makes each migration step independently
revertible.

## Phases

Sequenced so something works end to end early, per §60.

| Phase | Delivers |
|---|---|
| 1 | Docker compose (Postgres, MinIO), Prisma schema, migrations, seed from current content |
| 2 | Auth, CMS shell, dashboard |
| 3 | Media library + picker |
| 4 | **Vertical slice:** case study → create → blocks → publish → live portfolio |
| 5 | Projects, then homepage modules |
| 6 | Experience, mentors, gallery, navigation, footer, settings |
| 7 | Preview tokens, activity log, archive/restore |
| 8 | Version history, autosave, scheduled publish |

Phase 4 is the proof. Nothing after it is architecturally novel — it is the
same pattern repeated per entity.

## Open items

- Mentors 2 and 3 are placeholder content and currently live on `main`.
- Per-role experience bullets need writing (see above).
- VPS specifics not yet captured: distro, existing reverse proxy, TLS, whether
  Docker is already installed, and the domain to serve the CMS from.
