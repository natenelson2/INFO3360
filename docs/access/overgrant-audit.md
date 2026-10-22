# Over-grant audit

This file lists access that already exists. It does not rebuild staff sign-in, server session checks, or row-level security policies. It does not decide when the service-role key may be used, it is not access matrix v2, and it contains no new database commands that create or change policies.

Source brief: `docs/access/new-roles-brief.md`

## Roles judged

- **Assistant scout:** May see scouting note bodies for the caseload they support, shared player identity used only to label those notes, and game schedule / opponent / score context.
- **Video analyst:** May read scouting note text for games they analyze, shared player identity used only to label clips, and game schedule / opponent / period-score / game-event facts for video labeling.
- **Existing roles from the brief:** coaching, scouting, medical (already built; not rebuilt here).

**Sealed rule, in my words:** Medical data and sports-science data stay sealed from jobs that do not need them. Shared scouting or game screens must not show medical flags to the assistant scout or the video analyst.

## Where I looked

- **Paths searched:**
  - `supabase/migrations/` (`001_scouting_schema.sql`, `002_scouting_aggregates_rpc.sql`, `20250321000000_hockey_staff_rls.sql`)
  - `src/types/database.ts`
  - `src/server/` (`scouting-notes.ts`, `get-current-staff.ts`, `directoryLoader.ts`)
  - `src/lib/scouting/` (`queries.ts`, `mutations.ts`, `rpc.ts`, hooks)
  - `src/lib/supabase/` (`client.ts`, `server.ts`)
  - `src/routes/` (home, login, directory, players, games, scouting routes)
  - `src/components/AppNav.tsx`
  - `src/data/hockeySeed.ts`, `src/lib/searchSchemas.ts`
  - `app/server/directory.ts`, `app/lib/supabase.server.ts`, `app/config/env.ts`
  - `docs/access/new-roles-brief.md` (role names and sealed rule only)
- **Search words:** medical, sports-science, sports science, injury, health, medical flag, availability, `ir`, sports_science_records, measure_label, measure_value

## Inventory

Who can reach it must be a role name, signed-in staff, service role, or "unknown — not stated in the files".

### Tables

| Name | File path | Who can reach it | What it holds, in plain words |
| --- | --- | --- | --- |
| `players` | `supabase/migrations/001_scouting_schema.sql`; RLS in `supabase/migrations/20250321000000_hockey_staff_rls.sql` | SELECT for authenticated staff when `current_staff_role()` is coaching, scouting, or medical (RLS policy `players_select_staff_roles`) | Shared roster identity: name, position, team, jersey, active flag, free-text `notes` |
| `games` | `supabase/migrations/001_scouting_schema.sql` | unknown — not stated in the files (no RLS policies for `games` in this repo) | Season, opponent, play date, venue, status |
| `events` | `supabase/migrations/001_scouting_schema.sql` | unknown — not stated in the files (no RLS policies for `events` in this repo) | Game events tied to players: type, period, time, notes |
| `staff_profiles` | `supabase/migrations/20250321000000_hockey_staff_rls.sql` | Authenticated user may SELECT own row only (`user_id = auth.uid()`) | Staff role (`coaching` / `scouting` / `medical`) linked to Auth user |
| `staff_athlete_assignments` | `supabase/migrations/20250321000000_hockey_staff_rls.sql` | Authenticated user may SELECT own assignment rows | Which athletes a staff user covers for `scouting` or `medical` caseload |
| `scouting_notes` | `supabase/migrations/20250321000000_hockey_staff_rls.sql` | Scouting role on assignment caseload (SELECT/INSERT/UPDATE). Coaching and medical: no policy (deny) | Competitive scouting note bodies per athlete |
| `sports_science_records` | `supabase/migrations/20250321000000_hockey_staff_rls.sql` | Medical role on medical caseload (SELECT/INSERT/UPDATE). Coaching and scouting: no policy (deny) | Sports-science / medical-adjacent measures and notes per athlete |
| `practice_or_game_plans` | `supabase/migrations/20250321000000_hockey_staff_rls.sql` | Coaching: team-wide SELECT/INSERT/UPDATE. Scouting: SELECT only when `visibility = 'schedule_context'`. Medical: deny | Practice/game plan text; full strategy vs schedule-context slice |
| `directory_entries` | Referenced in `app/server/directory.ts` (no `CREATE TABLE` for this name in `supabase/migrations/`) | unknown — not stated in the files for Postgres roles; app path loads it through the server client in `app/lib/supabase.server.ts` | Directory display names, role, team, title, active flag (columns named in the select list) |

### Columns

Always include columns that could hold medical, sports-science, injury, or health information, even on a scouting or game table.

| Table | Column | File path | Who can reach it | Could this be medical or sports-science? |
| --- | --- | --- | --- | --- |
| `sports_science_records` | `measure_label` | `supabase/migrations/20250321000000_hockey_staff_rls.sql` | Medical on caseload (RLS) | yes |
| `sports_science_records` | `measure_value` | `supabase/migrations/20250321000000_hockey_staff_rls.sql` | Medical on caseload (RLS) | yes |
| `sports_science_records` | `notes` | `supabase/migrations/20250321000000_hockey_staff_rls.sql` | Medical on caseload (RLS) | yes |
| `sports_science_records` | `athlete_id` | `supabase/migrations/20250321000000_hockey_staff_rls.sql` | Medical on caseload (RLS) | yes (ties measure to athlete) |
| `sports_science_records` | `author_id` | `supabase/migrations/20250321000000_hockey_staff_rls.sql` | Medical on caseload (RLS) | unknown (staff id, not a measure) |
| `scouting_notes` | `body` | `supabase/migrations/20250321000000_hockey_staff_rls.sql` | Scouting on caseload (RLS) | no (scouting evaluation text) |
| `players` | `notes` | `supabase/migrations/001_scouting_schema.sql`; typed in `src/types/database.ts` as free-text scout notes | Coaching / scouting / medical via players SELECT policy | unknown (name says scout notes; could leak health if misused) |
| `players` | `is_active` | `supabase/migrations/001_scouting_schema.sql` | Coaching / scouting / medical via players SELECT policy | unknown (roster flag, not labeled medical) |
| `events` | `notes` | `supabase/migrations/001_scouting_schema.sql` | unknown — not stated in the files | unknown |
| `practice_or_game_plans` | `body` | `supabase/migrations/20250321000000_hockey_staff_rls.sql` | Coaching (all); scouting when schedule_context | no |
| Seed player field `status` | `'active' \| 'ir'` | `src/data/hockeySeed.ts`; shown on `src/routes/players/index.tsx` and `src/routes/players/$playerId.tsx` | unknown — not stated in the files (seed UI; not a Postgres column in migrations) | yes (`ir` is treated as injured-reserve style roster status on shared player screens) |

No columns named `injury`, `health`, `medical`, or `medical_flag` appear in `supabase/migrations/` or `src/types/database.ts`.

### Database views

A database view is a saved query that looks like a table.

| Name | File path | Who can reach it | Includes medical or sports-science fields? |
| --- | --- | --- | --- |
| None found | Searched `supabase/migrations/*.sql` and `src/types/database.ts` (`Views: Record<string, never>`) | n/a | n/a |

### Server functions

Server functions are code that runs on the server, including database functions screens can call and app server code that reads data.

| Name | File path | Who can call it | What data it can return |
| --- | --- | --- | --- |
| `public.current_staff_role()` | `supabase/migrations/20250321000000_hockey_staff_rls.sql` | `authenticated` (EXECUTE granted) | Current staff role text from `staff_profiles` |
| `public.staff_covers_athlete(uuid, text)` | `supabase/migrations/20250321000000_hockey_staff_rls.sql` | `authenticated` (EXECUTE granted) | Whether the signed-in user covers an athlete for a caseload kind |
| `public.player_event_counts_for_game(uuid)` | `supabase/migrations/002_scouting_aggregates_rpc.sql`; called from `src/lib/scouting/rpc.ts` | `anon`, `authenticated`, and `service_role` (EXECUTE granted to all three) | Per-player event and goal counts for one game |
| `listScoutingNotes` | `src/server/scouting-notes.ts` | Signed-in staff session required (`requireSession`); then RLS filters rows | Scouting note bodies and player names, or unauthorized / upstream error |
| `getCurrentStaff` | `src/server/get-current-staff.ts` | Signed-in staff session required (`requireSession`) | `{ id, email }` only (not role) |
| `getDirectoryEntries` | `app/server/directory.ts` | unknown — not stated in the files (handler does not call `requireSession`) | Directory entry fields listed in its select |
| `listPlayers` / `getPlayerById` / `listGames` (seed loaders) | `src/server/directoryLoader.ts` | unknown — not stated in the files (no session check in this module) | Seed roster and schedule data from `src/data/hockeySeed.ts` |

Browser-side query helpers (not TanStack server functions, but they reach tables): `listPlayers`, `getPlayerById`, `listGames`, `listEvents`, `listEventsWithPlayer` in `src/lib/scouting/queries.ts` use the browser Supabase client (`src/lib/supabase/client.ts`). Who can succeed depends on Postgres grants/RLS; for `players` the migration states coaching/scouting/medical; for `games`/`events` who can succeed is unknown — not stated in the files.

### Shared screens

Pages more than one role can open. Check them for medical flags even if a medical table looks locked.

| Screen or route | File path | Who can open it | Medical or sports-science fields shown? |
| --- | --- | --- | --- |
| Home `/` | `src/routes/index.tsx`; linked in `src/components/AppNav.tsx` | unknown — not stated in the files (nav has no role gate) | no (no medical/sports-science fields found in route) |
| Login `/login` | `src/routes/login.tsx` | Anyone who can load the app | no |
| Directory `/directory` | `src/routes/directory.tsx` (and twin `app/routes/directory.tsx`) | unknown — not stated in the files | no medical/sports-science fields in the directory select list |
| Players list `/players` | `src/routes/players/index.tsx` | unknown — not stated in the files (shared nav) | yes — shows seed roster `status`, including filter link for `ir` |
| Player detail `/players/$playerId` | `src/routes/players/$playerId.tsx` | unknown — not stated in the files | yes — shows "Roster status" from seed (`active` / `ir`) |
| Games `/games` | `src/routes/games/index.tsx` | unknown — not stated in the files | no medical fields; shows game `status` (scheduled/final), not injury |
| Scouting notes `/scouting/` | `src/routes/scouting/index.tsx` | Route open from shared nav; data requires signed-in session + RLS | no medical fields in UI; returns scouting note bodies when allowed |
| Scout players `/scouting/players` | `src/routes/scouting/players.tsx` | unknown — not stated in the files (shared nav) | no medical field labels in this route file; loads players via scouting hooks |
| Scout events `/scouting/events` | `src/routes/scouting/events.tsx` | unknown — not stated in the files | no medical field labels found in route |
| Scout aggregates `/scouting/aggregates` | `src/routes/scouting/aggregates.tsx` | unknown — not stated in the files | no medical field labels found in route |

No dedicated medical or sports-science screen file exists under `src/routes/`.

## Medical and sports-science paths

Every hit needs both who-can and who-must-not. If there are no hits, say so and repeat the search words and paths.

| Item | Kind | File path | Who can reach it | Who must not reach it |
| --- | --- | --- | --- | --- |
| `sports_science_records` table | table | `supabase/migrations/20250321000000_hockey_staff_rls.sql` | Medical staff on medical caseload may SELECT/INSERT/UPDATE these rows. | Coaching, scouting, and (per brief) assistant scout and video analyst must not reach these rows. |
| `sports_science_records.measure_label` | column | `supabase/migrations/20250321000000_hockey_staff_rls.sql` | Medical on caseload. | Assistant scout, video analyst, coaching, and scouting must not. |
| `sports_science_records.measure_value` | column | `supabase/migrations/20250321000000_hockey_staff_rls.sql` | Medical on caseload. | Assistant scout, video analyst, coaching, and scouting must not. |
| `sports_science_records.notes` | column | `supabase/migrations/20250321000000_hockey_staff_rls.sql` | Medical on caseload. | Assistant scout, video analyst, coaching, and scouting must not. |
| Seed roster status `ir` on players screens | screen + seed field | `src/data/hockeySeed.ts`, `src/routes/players/index.tsx`, `src/routes/players/$playerId.tsx`, `src/lib/searchSchemas.ts` | Anyone who can open the shared `/players` screens can see roster status including `ir`. | Per brief sealed rule: assistant scout and video analyst must not see medical flags on shared screens; `ir` is the only injury-style flag found. |
| Comments mentioning medical on scouting notes page | screen copy | `src/routes/scouting/index.tsx`, `src/server/scouting-notes.ts` | Explains that coaching/medical get zero note bodies; does not load sports-science rows. | n/a for data leak (documentation only). |

**Search with no column/table name hits:** words `injury`, `health`, `medical flag`, and `availability` returned no schema columns in `supabase/migrations/` or `src/types/database.ts`. Searched those paths plus `src/routes/`, `src/lib/scouting/`, `src/data/`, and `src/server/`.

## Learner marks: broader than the job

I wrote these marks. The agent did not decide them.

| Item | Role that has too much | Why that job does not need it | Evidence file path |
| --- | --- | --- | --- |
| Shared players screens show roster status `ir` | Assistant scout | The brief gives this job scouting notes and game schedule/score context. It must not see medical flags on shared screens. `ir` is an injured-reserve style flag on `/players`. | `src/routes/players/index.tsx`, `src/routes/players/$playerId.tsx`, `src/data/hockeySeed.ts` |
| Shared players screens show roster status `ir` | Video analyst | The brief gives this job scouting note reads for video work and game/event context. It must not see medical flags on shared screens. The same `ir` status appears on player list and detail. | `src/routes/players/index.tsx`, `src/routes/players/$playerId.tsx`, `src/data/hockeySeed.ts` |
| `player_event_counts_for_game` EXECUTE granted to `anon` | Anonymous caller (wider than either new staff job) | Assistant scout and video analyst need game/event facts as staff work. Granting the RPC to `anon` is broader than a signed-in staff job needs. | `supabase/migrations/002_scouting_aggregates_rpc.sql` |
| `listPlayers` / `getPlayerById` use `select('*')` including `players.notes` | Video analyst (if this path is used for that job later) | The brief limits this job to shared player identity for labels, not free-text player-card notes. | `src/lib/scouting/queries.ts`, `src/types/database.ts` |

## Disagreements and unknowns

- **Brief versus existing files:** The brief names assistant scout and video analyst. `staff_profiles.role` in `supabase/migrations/20250321000000_hockey_staff_rls.sql` only allows `coaching`, `scouting`, and `medical`. Those two new jobs are not in the database role check yet. This audit does not rewrite that matrix.
- **Service-role uses noticed, with no rule written here:** `app/lib/supabase.server.ts` builds a client with `SUPABASE_SERVICE_ROLE_KEY`; `app/server/directory.ts` uses it to read `directory_entries`. `src/lib/supabase/server.ts` states it does not use the service-role key. No policy or rule is decided in this file.
- **Other unknowns:** Who may SELECT `games` and `events` under PostgREST is not stated in migration RLS. Whether `directory_entries` has a table DDL in another project not checked into this repo. Whether `players.notes` ever stores health text is unknown from schema names alone.

## Review notes

- I compared names to files: yes (opened migrations, `database.ts`, scouting server path, players routes, seed, directory server path, AppNav).
- I did not ask for app-code or SQL edits in this step: yes
- Refine pass: first inventory pass only; medical search covered migrations, types, routes, seed, and scouting shared screens (not only tables named medical). Gap closed by including seed `ir` on `/players` as a shared-screen medical-flag hit.