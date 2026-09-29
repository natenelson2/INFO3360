# Scouting acceptance verification — Hockey Ops

**Date:** (fill when you walk the checklist)  
**Verifier:** (your name)  
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

**How to run the UI (for the walk):** from the project root, start the app with your usual dev command (for example `npm run dev`), open the three scouting routes, and keep the terminal output visible. Result and Evidence columns below stay blank until you test.

## 1. Joined and filtered reads

Criteria come from `docs/scouting-data-requirements.md` (players filters `position` / `teamName`; events join nested `player` with `id`, `full_name`, `position`).

| ID | Criterion | How to check | Result (Pass/Fail/Waived) | Evidence |
|----|-----------|--------------|---------------------------|----------|
| R1 | Players list loads from typed query helpers (not ad-hoc untyped strings in the route) | Open `/scouting/players`; confirm data or empty/error UI appears; skim `src/routes/scouting/players.tsx` + `src/lib/scouting/hooks.ts` (`usePlayers` → `listPlayers`) | | |
| R2 | Events list shows joined player identity scouts need (nested `player` fields) | Open `/scouting/events`; confirm each row shows player name (or clear fallback) from `useEventsWithPlayer` / `listEventsWithPlayer`, not only a bare `player_id` with no label | | |
| R3 | At least one filter from requirements narrows the list without a full page error | On players route, set **Position** and/or **Team name** (the filters named in requirements); list updates; no crash | | |
| R4 | Empty or “no matches” filter state is handled safely | Filter to a value with no rows; UI shows empty state, not a blank crash | | |

## 2. RPC aggregate correctness

Criteria: set-based `player_event_counts_for_game` via `src/lib/scouting/rpc.ts` and `usePlayerEventCountsForGame` (not a client loop over every event).

| ID | Criterion | How to check | Result (Pass/Fail/Waived) | Evidence |
|----|-----------|--------------|---------------------------|----------|
| A1 | Aggregates route uses the RPC helper / hook, not a hand-rolled client loop over every event | Open `/scouting/aggregates`; skim `src/routes/scouting/aggregates.tsx` + `src/lib/scouting/hooks.ts` + `src/lib/scouting/rpc.ts` | | |
| A2 | Aggregate totals match a manual spot-check for one known player | Pick one game and one player; compare UI `goal_count` / `event_count` to a quick count of that player’s events for that game (Supabase Table Editor or seed notes) | | |
| A3 | Aggregate still makes sense after a new event is added for that player | On `/scouting/events`, log an event for that player/game; return to aggregates for the same game; totals increase as expected after invalidation | | |

## 3. Mutation + cache freshness

Criteria come from `docs/scouting-cache-invalidation-map.md` (`useCreateScoutingEvent` → related `scoutingKeys` only).

| ID | Criterion | How to check | Result (Pass/Fail/Waived) | Evidence |
|----|-----------|--------------|---------------------------|----------|
| C1 | Create path uses typed mutations (`createScoutingEvent` via `useCreateScoutingEvent`) | On `/scouting/events`, submit **Log event** with a real player and game; confirm success or visible error from the mutation result | | |
| C2 | After mutation, the lists/keys named in the invalidation map refresh without a manual full reload | After a successful create, watch the events list and (for the same game) aggregates; data matches new server state without browser refresh | | |
| C3 | Unrelated query keys are not blindly cleared (invalidation is intentional) | Compare `src/lib/scouting/mutation-hooks.ts` to the invalidation map; note which `scoutingKeys` factories ran (events + related player/game/aggregates)—not a bare `invalidateQueries()` / wipe of `scoutingKeys.all` | | |

## 4. Typed-safety regression note (no live rename required)

**Prompt for the verifier:** If a column used by `src/lib/scouting/queries.ts` or the RPC return shape were renamed in Postgres and types were **not** regenerated, what should break, and where would you notice it?

| Check | Notes |
|-------|-------|
| Which modules import `src/types/database.ts` for those fields? | |
| Would the failure show up at TypeScript compile time, at runtime, or both if someone cast types away? | |
| What command/process regenerates types after a real schema change? (see earlier typegen notes / `docs/scouting-data-access-api.md`) | |

**Summary (2–4 sentences):**

## 5. Overall gate

| Gate | Status |
|------|--------|
| All R* criteria Pass or Waived with reason | |
| All A* criteria Pass or Waived with reason | |
| All C* criteria Pass or Waived with reason | |
| Typed-safety section completed | |
| Ready for stakeholder handoff step | Yes / No |

## 6. Fixes applied during this pass

| Fail ID | Targeted change (file + brief description) | Re-test result |
|---------|-----------------------------------------------|----------------|
| | | |

## Sign-off

- [ ] Verification matches Hockey Ops success criteria in `docs/scouting-data-requirements.md`
- [ ] Cache behavior matches `docs/scouting-cache-invalidation-map.md`
- [ ] No known Fail rows left unresolved