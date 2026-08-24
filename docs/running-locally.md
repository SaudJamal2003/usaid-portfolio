# Running the CMS and portfolio locally

Everything runs on this machine. Nothing here touches the VPS, DNS, or any
production service.

## Start (in order)

Postgres and MinIO first — the CMS will not boot without them.

```bash
# 1. Infrastructure (Postgres + MinIO + bucket init)
cd c:/Usaid-Portfolio/my-portfolio/cms
docker compose up -d

# 2. CMS  (http://localhost:3001)
cd c:/Usaid-Portfolio/my-portfolio/cms
npm run dev

# 3. Portfolio  (http://localhost:5173) — separate terminal
cd c:/Usaid-Portfolio/my-portfolio/my-app
npm run dev
```

Docker Desktop must be running before step 1. If `docker compose up` reports it
cannot reach the daemon, launch Docker Desktop and wait for it to settle.

There is no separate API process — the API is served by the CMS app itself, as
Next route handlers under `/api`.

## URLs

| What | URL |
|---|---|
| CMS | http://localhost:3001 |
| Portfolio | http://localhost:5173 |
| Public content API | http://localhost:3001/api/v1/content |
| Case study API | http://localhost:3001/api/v1/case-studies/shukar-hai |
| MinIO console | http://localhost:59001 |
| Postgres | localhost:55432 (loopback only) |

Login: the `OWNER_EMAIL` / `OWNER_PASSWORD` from `cms/.env`.

MinIO console signs in with `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` from the
same file.

## Stop

```bash
# Ctrl-C both dev servers, then:
cd c:/Usaid-Portfolio/my-portfolio/cms
docker compose stop          # keeps all data
```

`docker compose stop` leaves the volumes intact. `docker compose down -v` would
**destroy the database and all uploaded media** — do not use it unless you
intend to start from nothing.

## First run on a clean machine

Only needed if the volumes do not exist yet.

```bash
cd c:/Usaid-Portfolio/my-portfolio/cms
cp .env.example .env          # then fill in the secrets
npm install
docker compose up -d
npx prisma migrate deploy     # create the schema
npm run db:seed               # load the portfolio's existing content
```

The seed is idempotent — it upserts, so re-running will not duplicate rows.

## Connecting the portfolio to the CMS

`my-app/.env.local`:

```
VITE_CMS_URL=http://localhost:3001
```

With this unset the portfolio never makes a request and renders entirely from
bundled content. That is also the fallback path when the CMS is unreachable, so
removing the line is a quick way to check the site still stands on its own.

## Ports

Non-default on purpose: the VPS this eventually lands on runs other
applications, and a stock 5432 or 9000 would collide.

| Service | Host port |
|---|---|
| CMS (Next) | 3001 |
| Portfolio (Vite) | 5173 |
| Postgres | 55432 |
| MinIO API | 59000 |
| MinIO console | 59001 |

Postgres and MinIO are bound to `127.0.0.1`, so they are not reachable from the
network.
