# Scouting acceptance verification — Hockey Ops

**Date:** 2026-09-29  
**Verifier:** Nate Nelson  
**App routes checked:** `/scouting/players`, `/scouting/events`, `/scouting/aggregates`  
**Sources:** `docs/scouting-data-requirements.md`, `docs/scouting-cache-invalidation-map.md`

## Modules and routes to reference while checking

| Layer | Path |
|-------|------|
| Requirements (reads) | `docs/scouting-data-requirements.md` |
| Invalidation map | `docs/scouting-cache-invalidation-map.md` |
| Typed queries | `src/lib/scouting/queries.ts` |
| Typed mutations | `src/lib/scouting/mutations.ts` |
| RPC aggregate | `src/lib/scouting/rpc.ts` |
| Query hooks | `src/lib/scouting/hooks.ts` |
| Mutation hooks | `src/lib/scouting/mutation-hooks.ts` |
| Query key factory | `src/lib/scouting/query-keys.ts` |
| Database types | `src/types/database.ts` |
| Players route | `src/routes/scouting/players.tsx` |
| Events route | `src/routes/scouting/events.tsx` |
| Aggregates route | `src/routes/scouting/aggregates.tsx` |

**How to run the UI (for the walk):** `npm run dev` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local`, then open the three scouting routes. Results below are from that walk plus a code review of the modules listed above.

## 1. Joined and filtered reads

Criteria come from `docs/scouting-data-requirements.md` (players filters `position` / `teamName`; events join nested `player` with `id`, `full_name`, `position`).

| ID | Criterion | How to check | Result (Pass/Fail/Waived) | Evidence |
|----|-----------|--------------|---------------------------|----------|
| R1 | Players list loads from typed query helpers (not ad-hoc untyped strings in the route) | Open `/scouting/players`; confirm data or empty/error UI appears; skim `src/routes/scouting/players.tsx` + `src/lib/scouting/hooks.ts` (`usePlayers` → `listPlayers`) | Pass | Opened `/scouting/players`. Roster rows rendered `full_name`, `position`, and `team_name`. Route only imports `usePlayers` from `hooks.ts` (no `createClient` / raw `supabase.from` in the route). Hook `queryFn` calls `listPlayers` from `queries.ts`. |
| R2 | Events list shows joined player identity scouts need (nested `player` fields) | Open `/scouting/events`; confirm each row shows player name (or clear fallback) from `useEventsWithPlayer` / `listEventsWithPlayer`, not only a bare `player_id` with no label | Pass | Opened `/scouting/events`. Existing rows showed `event_type - {player full_name} (game {game_id})` using `event.player?.full_name`. Confirmed `listEventsWithPlayer` selects `player:players(id, full_name, position)`. |
| R3 | At least one filter from requirements narrows the list without a full page error | On players route, set **Position** and/or **Team name** (the filters named in requirements); list updates; no crash | Pass | On `/scouting/players`, set Position to `F` (Forward). List narrowed to forwards only; no crash. Cleared Position and typed a real `team_name` value; list narrowed to that team. |
| R4 | Empty or “no matches” filter state is handled safely | Filter to a value with no rows; UI shows empty state, not a blank crash | Pass | On `/scouting/players`, set Team name to `ZZZ-NOMATCH`. UI showed “No players match this filter.” Page stayed intact (header + filters still visible). |

## 2. RPC aggregate correctness

Criteria: set-based `player_event_counts_for_game` via `src/lib/scouting/rpc.ts` and `usePlayerEventCountsForGame` (not a client loop over every event).

| ID | Criterion | How to check | Result (Pass/Fail/Waived) | Evidence |
|----|-----------|--------------|---------------------------|----------|
| A1 | Aggregates route uses the RPC helper / hook, not a hand-rolled client loop over every event | Open `/scouting/aggregates`; skim `src/routes/scouting/aggregates.tsx` + `src/lib/scouting/hooks.ts` + `src/lib/scouting/rpc.ts` | Pass | `/scouting/aggregates` calls `usePlayerEventCountsForGame(gameId)`. Hook `queryFn` calls `getPlayerEventCountsForGame` in `rpc.ts`, which uses `supabase.rpc('player_event_counts_for_game', { p_game_id })`. No per-event client loop in the route. |
| A2 | Aggregate totals match a manual spot-check for one known player | Pick one game and one player; compare UI `goal_count` / `event_count` to a quick count of that player’s events for that game (Supabase Table Editor or seed notes) | Pass | Selected one game on `/scouting/aggregates`. For one `player_id` in the table, counted that player’s `events` rows for the same `game_id` in Supabase Table Editor. UI `event_count` and `goal_count` (rows with `event_type = goal`) matched the manual count. |
| A3 | Aggregate still makes sense after a new event is added for that player | On `/scouting/events`, log an event for that player/game; return to aggregates for the same game; totals increase as expected after invalidation | Pass | Logged a `goal` on `/scouting/events` for the same player/game. Without a full browser reload, re-selected that game on `/scouting/aggregates`. That player’s `goal_count` and `event_count` each increased by 1. |

## 3. Mutation + cache freshness

Criteria come from `docs/scouting-cache-invalidation-map.md` (`useCreateScoutingEvent` → related `scoutingKeys` only).

| ID | Criterion | How to check | Result (Pass/Fail/Waived) | Evidence |
|----|-----------|--------------|---------------------------|----------|
| C1 | Create path uses typed mutations (`createScoutingEvent` via `useCreateScoutingEvent`) | On `/scouting/events`, submit **Log event** with a real player and game; confirm success or visible error from the mutation result | Pass | Submitted **Log event** with player + game + type `shot`. Saw “Event saved. Lists and aggregates should refresh.” Route uses `useCreateScoutingEvent` → `createScoutingEvent` with `EventInsert` typing (no raw insert in the route). |
| C2 | After mutation, the lists/keys named in the invalidation map refresh without a manual full reload | After a successful create, watch the events list and (for the same game) aggregates; data matches new server state without browser refresh | Pass | After create, `/scouting/events` list gained the new row (player name + type) without reload. `/scouting/aggregates` for that `game_id` refreshed totals after `scoutingKeys.events()`, filtered event keys, `playerEventCountsForGame(gameId)`, and `aggregates()` invalidation. |
| C3 | Unrelated query keys are not blindly cleared (invalidation is intentional) | Compare `src/lib/scouting/mutation-hooks.ts` to the invalidation map; note which `scoutingKeys` factories ran (events + related player/game/aggregates)—not a bare `invalidateQueries()` / wipe of `scoutingKeys.all` | Pass | Code review of `invalidateAfterScoutingEvent`: invalidates `events()`, `eventList` / `eventsWithPlayerList` for player/game, `playerDetail`, `gameDetail`, `playerEventCountsForGame(gameId)`, and `aggregates()`. No bare `invalidateQueries()` and no wipe of `scoutingKeys.all`. Matches `docs/scouting-cache-invalidation-map.md`. |

## 4. Typed-safety regression note (no live rename required)

**Prompt for the verifier:** If a column used by `src/lib/scouting/queries.ts` or the RPC return shape were renamed in Postgres and types were **not** regenerated, what should break, and where would you notice it?

| Check | Notes |
|-------|-------|
| Which modules import `src/types/database.ts` for those fields? | `src/lib/scouting/queries.ts` (`PlayerRow` / `GameRow` / `EventRow` and select filters like `team_name`, `full_name`), `src/lib/scouting/mutations.ts` (`EventInsert`, `PlayerUpdate.notes`), `src/lib/scouting/rpc.ts` (`PlayerEventCountRow` from `Functions.player_event_counts_for_game.Returns`), and `src/lib/scouting/mutation-hooks.ts` (`EventInsert`). Routes consume those types indirectly through hooks. |
| Would the failure show up at TypeScript compile time, at runtime, or both if someone cast types away? | Compile time first: after regenerating or hand-editing `database.ts` to the new names, `tsc` fails where old property names are still used (for example `player.full_name` or RPC `goal_count`). If someone bypassed types with `any` / unchecked casts, the failure would slip to runtime (empty fields or Supabase column errors). Without regenerating types at all, TypeScript can stay green while the live API returns unexpected shapes—so typegen is required after schema changes. |
| What command/process regenerates types after a real schema change? (see earlier typegen notes / `docs/scouting-data-access-api.md`) | Prefer Supabase CLI typegen into `src/types/database.ts` (or manually extend `Database['public']['Tables']` / `Functions` to match the migration). Update `docs/scouting-data-access-api.md` when new RPCs or public helpers are added. Do not cast RPC results to `any`. |

**Summary (2–4 sentences):**  
If Postgres renames a column used by scouting reads/writes (for example `players.full_name` or an RPC return field like `goal_count`) and `src/types/database.ts` is not updated, the typed helpers in `queries.ts`, `mutations.ts`, and `rpc.ts` are the first place the contract drifts. Once types are regenerated to the new names, TypeScript should fail at compile time in those modules and in any hook/route that still uses the old field names—before a scout sees a blank board. That is why generated (or carefully hand-synced) `Database` types matter: they turn schema drift into a build break instead of a silent UI bug.

## 5. Overall gate

| Gate | Status |
|------|--------|
| All R* criteria Pass or Waived with reason | Pass (R1–R4) |
| All A* criteria Pass or Waived with reason | Pass (A1–A3) |
| All C* criteria Pass or Waived with reason | Pass (C1–C3) |
| Typed-safety section completed | Yes |
| Ready for stakeholder handoff step | Yes |

## 6. Fixes applied during this pass

| Fail ID | Targeted change (file + brief description) | Re-test result |
|---------|-----------------------------------------------|----------------|
| (none) | No Fail rows on this pass; no application code changes | n/a |

## Sign-off

- [x] Verification matches Hockey Ops success criteria in `docs/scouting-data-requirements.md`
- [x] Cache behavior matches `docs/scouting-cache-invalidation-map.md`
- [x] No known Fail rows left unresolved