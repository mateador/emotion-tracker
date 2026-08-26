# Steady — Emotion Check-In

A PWA for tracking how you're feeling, twice a day, in two taps. Built
offline-first, with a deliberately muted, non-alarming design system.

## Philosophy

Most habit-tracking and mood-logging apps optimize for engagement —
streaks, notifications, gamification. This one optimizes for something
closer to the opposite: the lowest possible friction to be honest with
yourself about how you're doing, and a UI that doesn't add stress to
someone who might already be anxious or overwhelmed when they open it.

Concretely, that means:
- **Two taps to log, no exceptions.** Select an emotion, confirm. No
  mandatory text fields, no forced categorization.
- **A muted color palette everywhere, including for negative states.**
  Anxious and Frustrated are never rendered in alarm-red — see
  `client/src/index.css` for the full palette and reasoning.
- **Trigger tags are always optional.** They exist to help you notice
  patterns later, not to gate the ability to log an emotion.
- **Offline-first by necessity, not just as a technical feature.** A
  two-tap check-in that fails silently because you're in a tunnel or on a
  bad connection defeats the entire point.

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React 19, Vite, TypeScript (strict), Tailwind CSS v4 |
| Frontend state | TanStack Query (server state) + Zustand (auth session) |
| Frontend UI | Hand-built shadcn-pattern primitives (Button/Calendar/Popover on Radix), Lucide icons, Framer Motion |
| Frontend offline | `vite-plugin-pwa` (Workbox) for the app shell, `idb` (IndexedDB) for the write queue |
| Backend | Node.js, Express 5, TypeScript |
| Database | PostgreSQL on Neon, via `@neondatabase/serverless` |
| Push | OneSignal Web SDK |
| Hosting | Netlify (client) + Render (server), one repo, path-filtered deploys |

## Prerequisites

- Node.js 20+ (developed and verified against Node 22)
- A free [Neon](https://neon.tech) Postgres project — takes about a
  minute, no credit card
- (Optional, for push notifications) A free
  [OneSignal](https://onesignal.com) account

## Local Development Setup

From the repository root:

```bash
npm run install:all
```

Then configure both environments:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Edit `server/.env` — at minimum you need a real Neon `DATABASE_URL` and a
generated `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Apply the database schema:

```bash
cd server && npx tsx src/db/migrate.ts
```

Then, from the repository root, run both apps together:

```bash
npm run dev
```

This runs the client (`http://localhost:5173`) and server
(`http://localhost:4000`) concurrently, with labeled, color-coded output
for each.

### Verifying your setup

```bash
npm run typecheck   # both client and server
cd client && npm run test    # 13 tests: component behavior + offline queue
cd server && npx tsc --noEmit
```

## Environment Variables

**`server/.env`**

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | Yes | Neon pooled connection string |
| `JWT_SECRET` | Yes | 32+ random bytes; see generation command above |
| `CORS_ORIGIN` | Yes | Exact frontend origin, never `*` |
| `PORT` | No | Defaults to 4000 |
| `ONESIGNAL_APP_ID` / `ONESIGNAL_REST_API_KEY` | No | Only needed if you want push notifications working |
| `INTERNAL_CRON_SECRET` | No | Required only if using the reminder-scheduling endpoint (see Deployment Guide, step 4) |
| `ONESIGNAL_API_BASE_URL` | No | Testing-only override, don't set in production |

**`client/.env`**

| Variable | Required | Notes |
|---|---|---|
| `VITE_API_URL` | Yes | `http://localhost:4000` locally, your Render URL in production |
| `VITE_ONESIGNAL_APP_ID` | No | Safe to expose client-side — identifies which OneSignal app to register against, not a secret |

## Deployment Guide

This is a single repository deploying to two platforms: Netlify serves
the static frontend, Render runs the API. Both are configured to build
*only* when their own directory changes — a commit that only touches
`server/` won't trigger a Netlify rebuild, and vice versa.

### 1. Neon (database)

Already live the moment you create the project — nothing to deploy.
Apply migrations once against your real Neon database the same way you
did locally: `npx tsx src/db/migrate.ts` with `DATABASE_URL` pointed at
Neon instead of local Postgres.

### 2. Render (API)

1. Push this repo to GitHub.
2. In Render: **New → Blueprint**, connect the repo. Render reads
   `render.yaml` from the repo root automatically — it already knows the
   service lives in `server/` (`rootDir: server`) and should only
   redeploy when files under `server/**` change (`buildFilter`).
3. Render will prompt for the environment variables marked `sync: false`
   in `render.yaml`: `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`,
   `ONESIGNAL_APP_ID`, `ONESIGNAL_REST_API_KEY`. Fill these in from your
   real Neon project and generated secret.
4. Deploy. Render's free tier spins down after 15 minutes idle — the
   first request after that takes 30-50 seconds to wake up. Expected
   behavior, not a bug, for an app used a couple of times a day.

### 3. Netlify (PWA)

1. In Netlify: **Add new site → Import an existing project**, connect
   the same repo. Netlify reads `netlify.toml` from the repo root
   automatically (`base = "client"`, plus the `ignore` command that
   skips builds when nothing under `client/` changed).
2. Before the first deploy, add a build environment variable:
   `VITE_API_URL` = your live Render URL from step 2.
3. Deploy.
4. **Go back to Render** and update `CORS_ORIGIN` to this exact Netlify
   URL, replacing whatever placeholder you set in step 2 — the API
   won't accept requests from the frontend until this matches exactly.

### Configuring path filters (if you didn't use the Blueprint flow)

If you connect Render manually instead of via Blueprint, add the build
filter yourself under the service's **Settings → Build Filters**:
- Included paths: `server/**`

Netlify's path filtering lives in `netlify.toml`'s `ignore` command
already committed to the repo — nothing to configure separately in
Netlify's UI for this.

### 4. External Cron Wiring (push notification reminders)

The API has an endpoint, `POST /api/internal/send-reminders`, that checks who
hasn't logged an emotion yet in the current check-in window and sends them a
push notification — but nothing calls it on a schedule by itself. Render's
free tier spins down when idle, so an in-process scheduler (`node-cron` or
similar running inside the API) would silently fail to fire whenever the
service happened to be asleep at 11:30 or 4:30 — which, for an app used
twice a day, it very likely will be. The reliable free fix is an **external**
scheduler that hits the endpoint directly; the incoming request itself wakes
the service.

1. Sign up free at [cron-job.org](https://cron-job.org) (or use a GitHub
   Actions scheduled workflow if you'd rather keep this in-repo — either
   works, cron-job.org is simpler to set up).
2. Create **two** scheduled jobs — one per check-in window:

   **Job 1 — morning reminder**
   - URL: `https://your-api.onrender.com/api/internal/send-reminders`
   - Method: `POST`
   - Schedule: daily, **11:30 UTC**
   - Headers: `Content-Type: application/json`, `X-Internal-Secret: <your INTERNAL_CRON_SECRET value>`
   - Body: `{"window":"morning"}`

   **Job 2 — afternoon reminder**
   - Same URL and headers as above
   - Schedule: daily, **16:30 UTC**
   - Body: `{"window":"afternoon"}`

3. **Why UTC specifically, and why those exact times**: `server/src/modules/reminders/query.ts` defines the morning window as starting at `00:00 UTC` and the afternoon window at `12:00 UTC` — this is the v1 timezone simplification documented there (no per-user timezone exists in the schema yet). Scheduling the actual *send* at `11:30`/`16:30` UTC keeps both comfortably inside their respective windows, giving the morning window 11.5 hours to have caught a log before reminding, and the afternoon window 4.5 hours. If wall-clock 11:30 AM in a specific real timezone matters more to you than the UTC-based approximation, that's the point where implementing per-user timezones (a `users.timezone` column plus reworking the window boundaries to be timezone-aware) stops being optional polish and becomes a real requirement — worth treating as a deliberate follow-up, not squeezed into this pass.
4. Set the request timeout generously (60+ seconds) if the scheduler allows configuring it — a cold-started Render free instance can take 30-50 seconds to respond to the very first request after 15 minutes idle, and you don't want the scheduler treating that as a failure.
5. `ONESIGNAL_API_BASE_URL` (see `.env.example`) is a testing-only override — don't set it in Render's production environment; leaving it unset correctly defaults to OneSignal's real API.

## Known Gaps and Assumptions

- **CSV export column layout** (`Date, Time, Emotion, Triggers, Notes`)
  is a reasonable default, not validated against any specific external
  spreadsheet format. If you need to match an existing template, that's
  a one-file change in `server/src/routes/logs.ts`.
- **No login/register screen was in the original component plan** —
  `client/src/components/AuthGate.tsx` is a minimal addition to make the
  rest of the app actually reachable, not a considered part of the
  design system the rest of the UI received. Worth revisiting with the
  same care if this becomes real product surface.
- **Bundle size**: the production client bundle is ~530KB (mostly
  `react-day-picker` + `framer-motion` + React Query in one chunk). Not
  a bug, but a legitimate code-splitting opportunity (dynamic
  `import()` on the `ExportPanel`, which most sessions won't touch) if
  load time becomes a real concern.
- **Push notifications require real OneSignal credentials to do anything**
  — without `ONESIGNAL_APP_ID` set, `requestPushPermission()` no-ops
  quietly (logged at info level) rather than failing, so the app works
  completely normally with push unconfigured. The reminder-sending
  endpoint (`POST /api/internal/send-reminders`) will throw a clear error
  if `ONESIGNAL_APP_ID`/`ONESIGNAL_REST_API_KEY` aren't set, rather than
  silently no-op-ing — the asymmetry is deliberate: a missing client-side
  subscription is a normal, expected state; a scheduled job hitting a
  misconfigured server-side sending path is a real misconfiguration worth
  surfacing loudly.
- **Push notification reminders are fully implemented but have one real limitation, not yet fixed**: the "who hasn't checked in" query (`server/src/modules/reminders/query.ts`) uses fixed UTC time boundaries (00:00/12:00 UTC) as a stand-in for the two daily check-in windows, because there's no per-user timezone stored anywhere in the schema. Someone whose local day doesn't align with UTC will have the morning/afternoon windows land at a different local time than the product brief's "11:30 AM, 4:30 PM" implies. A real fix needs a `users.timezone` column and timezone-aware window logic — this was flagged explicitly rather than silently assumed correct. See the Deployment Guide's cron wiring section for the operational side of this.
- **The OneSignal service worker's coexistence with the app's own PWA service worker was resolved via scoping** (`client/public/push/onesignal/`, not root) rather than merging the two into one file. This is the simpler of OneSignal's two documented approaches; if you ever need both service workers to genuinely share logic (e.g. a custom push handler that also needs Workbox's caching), that would mean switching to the merge approach instead.
- **`POST /api/internal/send-reminders` has no built-in rate limiting** beyond the shared-secret check. Low risk given only your own external scheduler should ever call it, but worth adding if this endpoint's URL or secret ever leaks.
- **`emotion_type` is `TEXT` + `CHECK`, not a native Postgres `ENUM`** —
  deliberate: adding a 6th emotion later is a plain `ALTER TABLE`, not
  the more operationally awkward `ALTER TYPE ... ADD VALUE`.
- **Offline log creation is idempotent via `client_id`** (see migration
  `0002_add_client_id.sql`) — a retried sync after a lost response
  returns the existing log rather than creating a duplicate. This was
  added during Step 5 specifically because the offline queue's
  correctness depends on it; it wasn't part of the original Step 2 plan.
