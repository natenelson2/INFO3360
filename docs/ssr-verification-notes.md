# SSR verification notes (Sprint 1)

## First-paint checks

Checked against the running Vite/TanStack Start dev server with `curl` (equivalent to View Source for the initial HTML document).

| Route | URL tested | Content visible on hard refresh? | Name/text found in View Source? | Notes |
|-------|------------|----------------------------------|----------------------------------|-------|
| Home | `/` | yes | yes — `Hockey Ops`, `Alex Mercer` | Loader returns `getDirectorySummary()` featured players + upcoming games |
| Players list | `/players` | yes | yes — `Alex Mercer`, `Sam Ortiz` | `listPlayers` via route `loader` + `loaderDeps` from validated search |
| Player detail | `/players/p-17` | yes | yes — `Alex Mercer` | `getPlayerById`; unknown id `/players/nope` shows **Player not found** |
| Games | `/games` | yes | yes — `North Bay`, `Toronto` | `listGames` filtered by validated `team` / `date` search |

Filter samples also SSR correctly:

- `/players?position=G&status=active` → includes `Sam Ortiz`
- `/games?team=TOR&date=2026-03-20` → includes `Toronto`

## Requirements-brief criteria

- [x] No spinner-only empty shell on directory pages
- [x] Player detail bookmark shows identity content without waiting on client-only fetch
- [x] Seed/mock acceptable; Supabase still stubbed: **yes — seed only in `src/data/hockeySeed.ts`; no Supabase client**

## Implementation notes

- New modules: `src/data/hockeySeed.ts`, `src/server/directoryLoader.ts`
- Routes use TanStack Router `loader` / `loaderDeps` + `Route.useLoaderData()` (no `useEffect` fetch for directory body)
- Preserved `parsePlayerIdParam` and `validatePlayersSearch` / `validateGamesSearch`
- Players seed includes `status` so roster search filters map cleanly; games seed includes `team` club codes for search

## Agent follow-ups I needed

- None for the anti-pattern (no client-only initial fetch was introduced)

## Risks / next sprint

- Replace seed with Supabase RPC when auth and live data land
- Richer empty-state polish for zero filter matches / not-found
- Optional home counts could switch to live aggregations
