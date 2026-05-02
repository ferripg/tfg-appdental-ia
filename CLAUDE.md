# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Stack overview

- **Next.js 16.2** (App Router, React 19.2, `output: "standalone"`).
- **Prisma 7** against PostgreSQL 16 (Auth.js v5 with `@auth/prisma-adapter`).
- **MinIO** S3-compatible object storage for clinical files (radiografies, factures).
- **Tailwind v4** + shadcn (`radix-nova` style, `neutral` base, `lucide` icons).
- Path alias `@/*` points to `./src/*` (see [tsconfig.json:21-23](tsconfig.json#L21-L23)).

## Common commands

Local Node runs against the dockerized Postgres/MinIO. The `nextjs` container is for the production-like build; for day-to-day work run `next dev` on the host.

```bash
# Bring up Postgres + MinIO + Nginx + (built) Next.js
docker compose up -d

# Tear it all down
docker compose down

# Install JS deps and apply pending migrations to the dockerized DB
npm install
npx prisma migrate dev --name <migration_name>

# Regenerate the Prisma client after editing schema.prisma
npx prisma generate

# Inspect/edit data
npx prisma studio          # http://localhost:5555

# Dev server (host) — talks to dockerized Postgres at localhost:5432
npm run dev

# Production build / start (what the Docker image runs)
npm run build
npm start

# Lint
npm run lint
```

No test runner is configured.

## Service topology

The compose stack is fronted by Nginx so the FE/BE/object-store all share `http://localhost`:

- `nginx` (port 80) → reverse-proxies `/` to `nextjs:3000` and `/minio/` to `minio:9001` (see [nginx/nginx.conf](nginx/nginx.conf)). The `Upgrade`/`X-Forwarded-*` headers are required for **Server Actions** and the MinIO console websockets — preserve them when editing the proxy config.
- `nextjs` is built from the multi-stage [Dockerfile](Dockerfile) (`deps → builder → runner`). The runner copies only `.next/standalone` + `.next/static` + `public`; this is why `next.config.ts` sets `output: "standalone"` ([next.config.ts:5](next.config.ts#L5)) — do not remove it or the image stops working.
- `postgres` exposes 5432 on the host *only* to allow Prisma Studio / local `next dev` access; the container-to-container URL uses `postgres:5432`.
- `minio` exposes 9000 (S3 API) and 9001 (console). Inside the network the app reaches it as `minio:9000` (see env in [docker-compose.yml:24-31](docker-compose.yml#L24-L31)).

`depends_on` uses `condition: service_healthy` for both Postgres and MinIO, so the Next.js container won't start until those healthchecks pass.

## Environment

`.env` is required at repo root (gitignored, template in [.env.example](.env.example)). Compose interpolates `POSTGRES_*`, `MINIO_ROOT_*`, and `AUTH_SECRET` into the `nextjs` container; Prisma reads `DATABASE_URL` directly via [prisma.config.ts](prisma.config.ts) (which loads `dotenv/config`). The host-side `DATABASE_URL` must point to `localhost:5432`, while the in-container URL is constructed in compose against `postgres:5432`.

## Data model (Prisma)

[prisma/schema.prisma](prisma/schema.prisma) defines two coupled domains:

1. **Auth.js tables** — `User`, `Account`, `Session` follow the Auth.js v5 Prisma adapter contract. `User` adds a `password` field (bcrypt) and a `Role` enum (`ADMIN | MANAGER | OPERARI`) used for app-level authorization.
2. **Despeses (expenses)** — `Despesa` joins `Proveidor` (supplier, unique `nif`), `TipusDespesa` (category), and `User` (who registered it). `fitxerKey` is the MinIO object key for the attached invoice/receipt — files live in MinIO, only the key is stored in Postgres.

When changing the schema, always run `npx prisma migrate dev --name <change>` (creates a SQL file under `prisma/migrations/`) followed by `npx prisma generate`. Do not edit existing migrations — add new ones.

## Conventions specific to this repo

- App code lives under `src/` (`src/app/`, `src/components/`, `src/lib/`); the `@/*` alias points to `./src/*`. Hexagonal layering uses `src/domain/`, `src/services/`, `src/repositories/` — and `@prisma/client` must NOT be imported outside `src/repositories/`.
- Auth.js v5 keeps its config at the repo root (`auth.config.ts`, `auth.ts`) by convention, NOT under `src/`.
- shadcn components are added under `src/components/ui/` per [components.json](components.json); `cn()` helper is at [src/lib/utils.ts](src/lib/utils.ts).
- The project is documented and commented in **Catalan** (the TFG memòria is in Catalan). Match that language when writing comments, commit messages targeting the memòria, or `.md` documents — see the obligatory tutor-style instructions in [AGENTS.md](AGENTS.md).
