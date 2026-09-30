# Hockey Ops — Scouting Data Layer Stakeholder Handoff

**Sprint:** Typed Data Access and Cached Server State  
**Audience:** Scouts, ops, engineering  
**Status:** Ready for handoff — implementation complete for in-scope work  
**Core promise:** A schema change should not silently break the board.

**Sources used (verbatim paths):**
- `docs/scouting-data-requirements.md`
- `docs/scouting-schema-notes.md` *(listed as a consumed path for this step; file is not present in the repo yet — schema facts below come from `supabase/migrations/001_scouting_schema.sql`, `docs/scouting-data-requirements.md`, and `src/types/database.ts`)*
- `docs/scouting-data-access-api.md`
- `docs/scouting-cache-invalidation-map.md`
- `docs/scouting-acceptance-verification.md`

---

## 1. For scouts and ops (plain summary)

Hockey Ops scouts can browse **players**, **games**, and **events** with filters the database understands (`position` / `teamName` on the roster; event rows join player name and position so the board is readable without a second lookup).

Per-game totals (event count and goal count by player) come from a **server-side RPC** (`player_event_counts_for_game`), not fragile math in the browser.

When a scout **logs an event** (or updates player notes), the related lists and aggregate view refresh through **explicit cache invalidation** so the board does not keep showing stale rows.

If a column or table changes in Supabase, **TypeScript types and typed query helpers are the contract that should fail in development** — not quietly on the board in production. That is the same promise as acceptance section 4 in `docs/scouting-acceptance-verification.md`.

---

## 2. What we built (in scope)

### 2.1 Schema entities and relationships

| Entity | Role for scouts | Keys / relationships (summary) |
|--------|-----------------|--------------------------------|
| `players` | Who is being evaluated (name, position, team, notes) | Primary key `id`; referenced by `events.player_id` |
| `games` | When/where context for evaluation (season, opponent, date) | Primary key `id`; referenced by `events.game_id` |
| `events` | Observations tied to a player and game (`event_type`, period, notes) | Foreign keys → `players`, `games` (ON DELETE CASCADE in migration `001`) |

Details: `supabase/migrations/001_scouting_schema.sql`  
Original success criteria (reads/filters/joins): `docs/scouting-data-requirements.md`

**Why this protects the board:** Relationships live in Postgres (keys and constraints), not only in UI string joins. Renaming or dropping a required column should surface when types and typed helpers are updated — not as a silent blank board.

### 2.2 Typed data-access boundary

Public modules UI and hooks should call (from `docs/scouting-data-access-api.md`):

| Module | What scouts get |
|--------|-----------------|
| `src/lib/scouting/queries.ts` | Typed reads: `listPlayers`, `getPlayerById`, `listGames`, `getGameById`, `listEvents`, `listEventsWithPlayer` |
| `src/lib/scouting/mutations.ts` | Typed writes that exist today: `createScoutingEvent`, `updatePlayerNotes` |
| `src/lib/scouting/rpc.ts` | Set-based aggregate: `getPlayerEventCountsForGame` |
| `src/lib/scouting/hooks.ts` / `mutation-hooks.ts` | TanStack Query wrappers over those helpers |
| `src/types/database.ts` | `Database` contract for tables + `Functions.player_event_counts_for_game` |

**Boundary rule:** Smoke-test routes under `/scouting/*` import hooks/helpers only. They do not embed raw untyped `supabase.from(...)` / `supabase.rpc(...)` for scouting tables. Private client: `src/lib/supabase/client.ts` (anon key only; see API doc).

**Why this protects the board:** New scout screens must add a typed helper and update the API doc — not bypass the layer with ad-hoc strings that ignore schema drift.

### 2.3 RPC aggregate purpose

- **What:** Postgres function `player_event_counts_for_game(p_game_id)` returns per-player `event_count` and `goal_count` for one game (migration `002_scouting_aggregates_rpc.sql`).
- **Why RPC:** Aggregation runs in the database over the matching set — consistent and cheaper than pulling every event into the browser and counting in JavaScript.
- **App entry:** `src/lib/scouting/rpc.ts` → hook `usePlayerEventCountsForGame` → route `/scouting/aggregates`.
- **Type rule:** Callers must not cast RPC results to `any` (`docs/scouting-data-access-api.md`).

**Why this protects the board:** If the RPC return shape changes, `Database['public']['Functions']` and `rpc.ts` should break at typecheck before totals silently go wrong on the aggregate page.

### 2.4 Cache invalidation rules

Summary from `docs/scouting-cache-invalidation-map.md` (real writes only — this sprint did **not** ship player/game CRUD helpers):

| After this write | Invalidate / refetch these `scoutingKeys` |
|------------------|-------------------------------------------|
| `createScoutingEvent` (via `useCreateScoutingEvent`) | `events()`; filtered `eventList` / `eventsWithPlayerList` for player/game; `playerDetail`; `gameDetail`; `playerEventCountsForGame(gameId)`; `aggregates()` |
| `updatePlayerNotes` (via `useUpdatePlayerNotes`) | `players()`; `playerDetail(playerId)` |

Rules that matter for freshness:
- Invalidate **related** keys only — never a bare `invalidateQueries()` and never a blind wipe of `scoutingKeys.all`.
- Event creates always refresh event list prefixes **and** aggregate keys.

**Why this protects the board:** Mutations target the same query keys the list and aggregate hooks use, so logging a goal updates the board without hoping the scout hits refresh.

### 2.5 Acceptance snapshot

From `docs/scouting-acceptance-verification.md` (verifier Nate Nelson, 2026-09-29). This was a **manual smoke walk** of `/scouting/players`, `/scouting/events`, and `/scouting/aggregates` plus code review — **not** a full Playwright suite or production security sign-off.

| Area | Result | What was proved |
|------|--------|-----------------|
| R1–R4 Joined/filtered reads | **Pass** | Players load via `usePlayers` → `listPlayers`; events show joined `player.full_name`; `position` / `teamName` filters work; empty filter shows “No players match this filter.” |
| A1–A3 RPC aggregate | **Pass** | Aggregates use `usePlayerEventCountsForGame` / RPC; spot-check matched Table Editor counts; totals rose after logging a goal without full reload |
| C1–C3 Mutation + cache | **Pass** | Create uses `useCreateScoutingEvent`; events list + aggregates refreshed; invalidation matched the map (related keys only) |
| Typed-safety note | **Completed** | Documents compile-time break in `database.ts` consumers if types are not regenerated after a rename |
| Overall gate | **Yes** — ready for this stakeholder handoff step | |

**Do not read this as:** full E2E coverage, auth role testing, or production RLS approval.

---

## 3. Explicitly out of scope (next topic / sprint)

Do **not** treat these as done in this sprint:

1. **Auth roles** — Scout vs coach vs admin permissions and Supabase Auth role mapping are not completed work in this handoff.
2. **Playwright coverage depth** — Smoke-test routes and a filled acceptance checklist exist; full end-to-end Playwright suites, CI browser matrices, and edge-case E2E depth are deferred.
3. **Production RLS policy polish** — Migrations and RPC grants exist for development use; locking down production-grade Row Level Security, policy tests, and role-by-role access proofs is next-sprint work.
4. **Player/game CRUD writes** — `createPlayer` / `updatePlayer` / `createGame` / `updateGame` / `updateEvent` are **not** in `mutations.ts` yet (`docs/scouting-cache-invalidation-map.md`). Only `createScoutingEvent` and `updatePlayerNotes` are public writes today.
5. **Missing planning artifact** — `docs/scouting-schema-notes.md` was named as an input for this handoff but is not in the repo; add it next if stakeholders want a dedicated schema narrative separate from the SQL migrations.
6. **Nice-to-haves not in requirements** — Export/reporting pipelines, mobile apps, and non-scouting domains are out of bounds unless newly prioritized.

---

## 4. How schema evolution should work next time

1. Change schema in a **new** Supabase migration (do not edit production by hand only).
2. Regenerate or carefully update `src/types/database.ts` (including `Functions` when RPCs change).
3. Fix typed queries / mutations / RPC wrappers until the typechecker is clean — **no `any` casts** on RPC results.
4. Update `docs/scouting-data-access-api.md` if public helpers change.
5. Update query keys / `docs/scouting-cache-invalidation-map.md` if new lists or writes appear.
6. Re-run checks in `docs/scouting-acceptance-verification.md` (and amend evidence).
7. Amend this handoff if stakeholder-visible behavior changed.

That loop is how we keep the promise: **a schema change should not silently break the board.**

---

## 5. Artifact index (evidence)

| Doc / area | Path |
|------------|------|
| Requirements and success criteria | `docs/scouting-data-requirements.md` |
| Schema notes (expected path; missing — use migration instead) | `docs/scouting-schema-notes.md` → see `supabase/migrations/001_scouting_schema.sql` |
| Data-access public API | `docs/scouting-data-access-api.md` |
| Cache invalidation map | `docs/scouting-cache-invalidation-map.md` |
| Acceptance verification (smoke + code review) | `docs/scouting-acceptance-verification.md` |
| Aggregate RPC migration | `supabase/migrations/002_scouting_aggregates_rpc.sql` |
| Smoke routes | `src/routes/scouting/players.tsx`, `events.tsx`, `aggregates.tsx` |
| This handoff | `docs/scouting-stakeholder-handoff.md` |

---

## 6. Recommended next-sprint boundaries

| Track | Goal | Depends on this sprint |
|-------|------|------------------------|
| Auth and RLS | Role-aware access for scouts/ops; production policy polish | Stable tables + typed API |
| E2E quality | Deeper Playwright + CI signal beyond manual smoke | Stable routes + query keys |
| Schema notes + CRUD | Add `docs/scouting-schema-notes.md`; typed player/game writes if product needs them | Current migrations + API boundary |
| Product UX | Richer filters, empty states, scout workflows | Cached lists + invalidation |

---

## 7. Review pass (handoff vs five source docs)

Compared this draft to the five listed inputs:

| Check | Finding |
|-------|---------|
| Missing in-scope fact? | `docs/scouting-schema-notes.md` is absent; schema section cites migrations + requirements instead of inventing notes. Real writes are only `createScoutingEvent` / `updatePlayerNotes` (not generic player/game CRUD from the scaffold). |
| Out-of-scope incorrectly marked done? | No. Auth roles, Playwright depth, and production RLS are listed as **not done**. Acceptance is described as smoke + code review only. |
| Overclaim risk? | Avoided claiming full E2E or security sign-off. Aggregate and filter names match requirements/API docs. |

---

## 8. Sign-off

| Role | Name | Date | Notes |
|------|------|------|-------|
| Scout lead | | | |
| Engineering | Nate Nelson | 2026-09-30 | Handoff drafted from requirements, API, invalidation map, acceptance doc, and migrations |
| Ops (optional) | | | |