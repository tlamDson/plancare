# Project Voyager — TravelPlan

Agentic travel planner monorepo: React web app, Express API, BullMQ workers, shared Zod contracts, MongoDB.

## Contents

- [Overview](#overview)
- [Tech stack](#tech-stack)
- [Repository layout](#repository-layout)
- [Prerequisites](#prerequisites)
- [Environment variables](#environment-variables)
- [Redis, TLS & BullMQ](#redis-tls--bullmq)
- [Local development](#local-development)
- [Deployment (Railway)](#deployment-railway)
- [Scripts](#scripts)
- [Documentation](#documentation)
- [Troubleshooting](#troubleshooting)

---

## Overview

- **Planner:** Trip generation via Gemini, validation with Mapbox + Google Places (field-masked requests), Mongo `PlaceCache` for repeat queries.
- **Queue:** BullMQ on Redis for trip generation, calendar sync, and destination insight jobs.
- **Auth:** Clerk. **Maps:** Mapbox GL. **Contracts:** `packages/shared` (Zod).

Trip lifecycle (simplified): `DRAFT → QUEUED → PROCESSING → COMPLETED` (or `FAILED`).

---

## Tech stack

| Area | Stack |
|------|--------|
| Monorepo | npm workspaces (`packageManager: npm@10.9.3`) |
| Web | React (Vite), Tailwind, shadcn/ui, TanStack Query, Zustand |
| API | Node 20+, Express, Mongoose, Zod, Envalid, Pino |
| Queue | BullMQ + **ioredis** |
| Data | MongoDB Atlas or local / Docker |
| Deploy | Frontend often Vercel; API + worker + Redis described in `railway.toml` |

---

## Repository layout

```
TravelPlan/
├── backend/                 # Express API + worker entrypoints
├── frontend/web/            # Vite SPA
├── packages/shared/         # Zod schemas & shared types
├── docker-compose.yml       # Local Mongo/Redis (if used)
├── railway.toml             # Railway: API, worker, Redis service
├── env.docker.example       # Template for Docker `.env.docker`
└── README.md
```

---

## Prerequisites

- Node.js **20+**
- **npm** 10+
- **Docker** (optional, for local MongoDB/Redis or compose stack)
- Accounts as needed: Clerk, MongoDB, Mapbox, Google Places, Gemini, etc.

---

## Environment variables

Validated in `backend/src/config/env.ts`. Common variables:

| Variable | Purpose |
|----------|---------|
| `MONGO_URI` | MongoDB connection string |
| `REDIS_HOST` | Redis hostname (e.g. `localhost`, `redis`, or `*.railway.internal`) |
| `REDIS_PORT` | Default `6379` |
| `REDIS_PASSWORD` | Optional locally; set in Docker/prod when Redis requires auth |
| `REDIS_URL` | Optional. If set, overrides host/port/password (e.g. Railway `redis://default:...@...railway.internal:6379`). Use `redis://` for plain TCP, `rediss://` for TLS. |
| `REDIS_TLS` | Optional override: `true` / `false` / `1` / `0` |
| `CLERK_SECRET_KEY` / web publishable key | Auth |
| `GEMINI_API_KEY` | Worker / AI pipeline |
| `MAPBOX_ACCESS_TOKEN` | Geocoding / maps |
| `GOOGLE_PLACES_API_KEY` | Places Text Search, Nearby, photo media |
| `OPENWEATHER_API_KEY` | Weather proxy (optional) |
| `SERPER_API_KEY` | Insight scraping (optional) |

**Frontend (`frontend/web`):** `VITE_*` for API base URL, Clerk, Mapbox, feature flags (see existing sections in repo for Calendar/VIP).

Create `backend/.env` (or `.env.local`) from your team’s template. For **Docker Compose** API/worker, use **`.env.docker`** at repo root (see `env.docker.example`).

---

## Redis, TLS & BullMQ

Connection logic lives in **`backend/src/lib/queue.ts`**.

- **Local / Docker Redis** (`localhost`, `127.0.0.1`): **no TLS**.
- **Railway private Redis** (hostname contains `railway.internal`): **no TLS** — plain TCP on port 6379.
- **Managed TLS Redis** (e.g. Upstash, `*.upstash.io`): **TLS** enabled (`rejectUnauthorized: false` for compatibility with some providers).

**Retry:** ioredis `retryStrategy` backoff is configured for transient disconnects.

**Workers** (`backend/src/worker.ts`, insight worker): BullMQ uses `stalledInterval: 30s` and `lockDuration: 60s` to balance long-running AI/IO jobs vs Redis polling load. On shutdown, trip, calendar, and insight workers are closed cleanly.

**Billing note:** Serverless Redis products often charge **per command**. BullMQ workers generate steady traffic (EVALSHA, ZRANGE, etc.). For a single small deployment, **one Redis instance on the same host as the app** (e.g. Railway Redis service) avoids per-command surprise bills from a separate vendor.

---

## Local development

```bash
git clone <your-repo-url>
cd TravelPlan
npm install
```

1. Start MongoDB and Redis (Docker Compose or local installs).
2. Configure `backend/.env` with `MONGO_URI`, `REDIS_*`, Clerk, `GEMINI_API_KEY`, etc.
3. From repo root:

```bash
npm run dev:api      # API — http://localhost:3000
npm run dev:web      # Web — http://localhost:5173
npm run dev:worker   # Optional — processes BullMQ jobs
```

4. Production build (all workspaces): `npm run build`

**Health:** `GET /health` / `GET /ready` (readiness may check Mongo + Redis).

**Docker:** See `env.docker.example` and project notes for `VITE_API_URL` pointing at the exposed API port.

---

## Deployment (Railway)

`railway.toml` defines services such as:

- **travelplan-api** — `node dist/index.js`
- **travelplan-worker** — `node dist/worker.js`
- **travelplan-redis** — `redis:7-alpine`

Set **`REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD`** from Railway’s Redis service (private host often includes `railway.internal`). Do **not** force TLS for that internal host — the code skips TLS automatically.

Scale workers conservatively if you care about Redis command volume (e.g. one replica unless you need more throughput).

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:api` | Backend dev server |
| `npm run dev:web` | Frontend dev server |
| `npm run dev:worker` | BullMQ worker |
| `npm run build` | Build all workspaces |
| `npm run test` | Tests (where configured per package) |
| `npm run typecheck` | TypeScript checks |

---

## Documentation

| Path | Topic |
|------|--------|
| `docs/agents/*.md` | Role-specific standards (architect, backend, frontend, devops, qa) |
| `docs/` | Roadmap, progress, roles |

---

## Troubleshooting

**Redis connection errors after moving cloud providers**

- Confirm `REDIS_HOST` matches the provider (internal Railway hostname vs public Upstash hostname).
- Wrong TLS mode: internal Railway Redis should **not** use TLS; Upstash **must** use TLS.

**MongoDB connection refused**

- Ensure `MONGO_URI` is correct and the DB is reachable from the API (network / Atlas IP allowlist).

**Worker idle but jobs stuck**

- Ensure `npm run dev:worker` (or Railway worker service) is running and using the **same** Redis as the API.

**Build failures**

- Run `npm run build` from the repo root; fix TypeScript and lint errors before merging.

---

## License

MIT — see `LICENSE` if present.

---

**Last updated:** 2026-04-01
