# Steady — Client

React + Vite + TypeScript PWA. See the [root README](../README.md) for
philosophy, full environment setup, and deployment instructions — this
file just covers day-to-day commands.

## Commands

```bash
npm run dev         # dev server at http://localhost:5173
npm run build        # production build to dist/
npm run preview       # serve the production build locally
npm run typecheck      # tsc -b --noEmit
npm run lint             # ESLint
npm run test               # Vitest -- component behavior + offline queue
```

## Regenerating icons

`public/icons/*.png` and `public/favicon.svg` were generated to match
`index.css`'s palette tokens. If the palette changes, regenerate them to
match rather than hand-editing the PNGs — see the git history for the
generation script if you need to reproduce it.

## Project structure

```
src/
  components/       -- EmotionSelector, TriggerTagger, LogFlow, Dashboard,
                        ExportPanel, AuthGate
  components/ui/     -- shadcn-pattern primitives (Button, Calendar, Popover)
  hooks/               -- useLogs (React Query), useOfflineSync
  lib/                   -- api-client, offline-db (IndexedDB), onesignal,
                             query-client, utils (cn helper)
  store/                    -- auth (Zustand, persisted)
  types/                      -- emotion, trigger, log shapes
```
