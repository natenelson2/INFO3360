# Scouting data-access public API

## Purpose
UI routes and TanStack Query hooks may talk to Supabase **only** through the
modules below. This keeps joins, filters, writes, and the aggregate RPC
schema-safe for Hockey Ops scouts.

## Allowed imports (public)

| Module | Functions UI may import | Scout use |
|--------|-------------------------|-----------|
| `src/lib/scouting/queries.ts` | `listPlayers`, `getPlayerById`, `listGames`, `getGameById`, `listEvents`, `listEventsWithPlayer` (plus exported filter/result types) | Board lists, detail cards, event rows with player labels |
| `src/lib/scouting/mutations.ts` | `createScoutingEvent`, `updatePlayerNotes` (plus `MutationResult`) | Log events; edit player notes |
| `src/lib/scouting/rpc.ts` | `getPlayerEventCountsForGame` (plus `PlayerEventCountRow`) | Set-based per-player totals for a game |

## Private (do not import from routes or hooks)
- `src/lib/supabase/client.ts` — use the client only inside `src/lib/scouting/*` (and server-only modules that already own their own client)
- Raw `supabase.from('...')` in route files
- Raw `supabase.rpc('some_string', ...)` outside `src/lib/scouting/rpc.ts`
- Hand-written SQL strings in the app

## Type contract
- All helpers must use types from `src/types/database.ts`.
- After any new migration/RPC, update `Database['public']['Functions']` (or regenerate types) **before** adding UI callers.
- The aggregate RPC name is exactly `player_event_counts_for_game` (see `supabase/migrations/002_scouting_aggregates_rpc.sql`).
- Callers must not cast RPC results to `any`.

## Stability rule
If a new scout screen needs data you do not expose here, **add a typed helper
in `src/lib/scouting`** and update this doc—do not bypass the layer.