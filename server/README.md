# Steady — Server

Express + TypeScript API. See the [root README](../README.md) for
environment setup and deployment — this file covers day-to-day commands.

## Commands

```bash
npm run dev         # tsx watch -- auto-restarts on file changes
npm run build         # tsc -> dist/
npm start               # node dist/index.js -- what Render actually runs
npm run typecheck         # tsc --noEmit
```

## Database

```bash
npx tsx src/db/migrate.ts            # apply pending migrations
npx tsx src/db/migrate.ts --status    # show applied vs. pending, no changes
```

Migrations are plain numbered SQL files in `src/db/migrations/`, tracked
in a `schema_migrations` table — not a framework, by design (see the root
README's stack rationale). No seed script exists for this project;
accounts are created through `POST /api/auth/register` directly.

## API surface

| Method | Path | Auth |
|---|---|---|
| GET | `/api/health` | none |
| POST | `/api/auth/register` | none |
| POST | `/api/auth/login` | none |
| GET | `/api/logs` | Bearer JWT |
| POST | `/api/logs` | Bearer JWT |
| GET | `/api/logs/export` | Bearer JWT |
| PATCH | `/api/user/onesignal-player-id` | Bearer JWT |

All authenticated routes expect `Authorization: Bearer <token>`, not a
cookie — see the root README's "Known Gaps" section for why this was the
deliberate choice over httpOnly cookies for this project.

## A note on the database driver

`src/db/pool.ts` uses `@neondatabase/serverless`, which requires Neon's
actual WebSocket proxy protocol — it will refuse to connect to a plain
local Postgres instance. For local development, point `DATABASE_URL` at
a real (free) Neon project rather than a local Postgres install; this
avoids needing a second, different local setup than production uses.
