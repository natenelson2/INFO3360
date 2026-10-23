# Migration review checklist

This file is the sign-off for the least-privilege migration. Fill every blank in your own words after you review the files. Do not paste secret keys, passwords, or connection strings. Do not mark pass until you can name the evidence.

## Sources reviewed

- Migration: `supabase/migrations/20260418120000_least_privilege_new_staff_roles.sql`
- Access matrix: `docs/access/access-matrix-v2.md`
- Service-role key rule: `docs/access/service-role-key-rule.md`
- Reviewer (your name): Nate Nelson
- Date: 2026-10-22 (America/Denver)

## How to mark a result

- pass — you compared this check to the matrix or the key rule, and the migration matches.
- fail — it does not match. Do not sign off while any item is still fail. Ask the agent to fix the same migration file, then change this mark.
- residual risk — you could not fix it inside this migration file. Write what is still open and why.

## Plain-language tour (prompt 1 — no edits)

Read from the migration only. No file was changed during this tour.

### Grants and revokes

- **REVOKE EXECUTE … FROM anon** on `player_event_counts_for_game`: anonymous callers cannot run the game aggregate function. RLS on underlying tables is unchanged (function is SECURITY INVOKER per older migration).
- **REVOKE EXECUTE … FROM service_role** on the same function: the master-key database role loses EXECUTE here. Matches key-rule allow list of none for staff-facing use.
- **GRANT EXECUTE … TO authenticated** on the same function: signed-in users may call it; row filters on `players` / `events` still apply when the function runs as invoker.
- **REVOKE ALL … FROM anon** on `games`, `events`, and `players_shared_identity`: anonymous users get no privileges on those objects.
- **GRANT SELECT … TO authenticated** on `games`, `events`, and `players_shared_identity`: signed-in users have table/view privilege, but policies or the view `WHERE` still decide which rows return. Missing allow means refuse.

### Policies (each: who, what data, RLS)

- **scouting_notes_select_assistant_scout_caseload**: assistant scout may See caseload `scouting_notes`. Table RLS stays on (enabled in earlier migration).
- **scouting_notes_insert_assistant_scout_caseload**: assistant scout may add caseload notes as themselves. RLS on.
- **scouting_notes_update_assistant_scout_caseload**: assistant scout may change caseload notes they author. RLS on.
- **scouting_notes_select_video_analyst_caseload**: video analyst may See caseload notes only (no write policies). RLS on.
- **players_select_staff_roles** (replaced): coaching, scouting, medical may See base `players` rows. assistant_scout and video_analyst are omitted on purpose. RLS on.
- **games_select_game_ops_roles**: coaching, scouting, assistant scout, video analyst may See `games`. Medical has no policy (deny). RLS turned on in this file.
- **events_select_game_ops_roles**: same four roles may See `events`. Medical deny. RLS turned on in this file.
- **plans_select_assistant_scout_schedule_context**: assistant scout may See schedule_context plan rows only. RLS on (earlier migration).
- **plans_select_video_analyst_schedule_context**: video analyst may See schedule_context plan rows only. RLS on.

### View

- **players_shared_identity**: lists only `id`, `full_name`, `position`, `team_name`, `jersey_number`, `is_active`, `created_at`. Omits `players.notes` and never selects sports-science columns. `WHERE` limits rows to assistant_scout or video_analyst. No `security_invoker` setting in this file, so the view uses default owner rights on the underlying table (not caller rights).

### Functions touched (not redefined here)

- **player_event_counts_for_game**: privileges tightened as above; body not rewritten in this file.
- **current_staff_role** / **staff_covers_athlete**: called inside policies; defined as SECURITY DEFINER in the earlier Sprint 4 migration. This file does not recreate them. They return a role label or a yes/no caseload check, not medical measure text.

### Flags called out

- **PUBLIC** (as a grantee): no hit. Uses of `public.` are schema names only.
- **anon**: revoked on the RPC, games, events, and the shared view. No new allow to anon.
- **authenticated**: policies and SELECT/EXECUTE grants target signed-in users, then narrow by `current_staff_role()`.
- **service_role**: EXECUTE revoked on the RPC; no key value stored.
- **SECURITY DEFINER**: none created in this file. Older helpers remain SECURITY DEFINER but do not return sealed medical row bodies.
- **DISABLE ROW LEVEL SECURITY**: no hit. This file enables RLS on `games` and `events`.

### Separate answer: medical flags on the shared view

The shared view `players_shared_identity` does **not** show a medical flag to the assistant scout or the video analyst. Its column list has no injury, `ir`, health, or medical-flag field, and it omits `players.notes`.

## Checks

### 1. Default deny

- Result: pass
- Plain-language evidence: Sensitive tables keep RLS on; new game/event tables get RLS enabled; medical and the two new jobs get no policy on `sports_science_records`; medical gets no policy on `games`/`events`; no `DISABLE ROW LEVEL SECURITY`.
- What happens if no allow-rule matches: Postgres RLS returns no rows (or blocks the write). That is a refusal, not an open table.

### 2. Every policy maps to a matrix cell

List each allow the migration adds or changes. One row per policy or grant you reviewed.

| Policy or grant (name or short description) | Hockey role | Action | Matrix v2 says (allow or deny) | Result |
| --- | --- | --- | --- | --- |
| scouting_notes_select_assistant_scout_caseload | Assistant scout | See | See on Scouting notes | pass |
| scouting_notes_insert_assistant_scout_caseload | Assistant scout | add | See, add, change on Scouting notes | pass |
| scouting_notes_update_assistant_scout_caseload | Assistant scout | change | See, add, change on Scouting notes | pass |
| scouting_notes_select_video_analyst_caseload | Video analyst | See | See on Scouting notes | pass |
| players_select_staff_roles (coaching/scouting/medical only) | Coaching, Scouting, Medical | See base players | Unchanged shared identity; new roles must not use base table for notes | pass |
| players_shared_identity SELECT (view + WHERE) | Assistant scout, Video analyst | See identity columns only | Deny on players.notes; See shared identity | pass |
| games_select_game_ops_roles | Coaching, Scouting, Assistant scout, Video analyst | See | See on Game data; Medical Deny | pass |
| events_select_game_ops_roles | Coaching, Scouting, Assistant scout, Video analyst | See | See on Game data; Medical Deny | pass |
| plans_select_assistant_scout_schedule_context | Assistant scout | See schedule_context | See on Game data (schedule context) | pass |
| plans_select_video_analyst_schedule_context | Video analyst | See schedule_context | See on Game data (schedule context) | pass |
| GRANT EXECUTE player_event_counts_for_game to authenticated | Signed-in staff | run aggregate | Anonymous Deny; staff game aggregates behind signed-in path | pass |
| REVOKE EXECUTE from anon / service_role on that RPC | Anonymous / master-key role | Deny / Never | Extra audit rows + service-role Never | pass |

- Any rule you could not tie to a cell: none

### 3. Nothing is open to everyone

Search the migration for PUBLIC, anon, and authenticated. A schema name such as public.players is not, by itself, a grant to everyone.

- Result: pass
- What you found (or "no hits"): No grant to PUBLIC. anon only appears in REVOKE (and comments). authenticated appears on policies/GRANTs that still filter by staff role or view WHERE. `public.` is schema only.
- Does any hit expose medical data, sports-science data, or a medical flag? No. No policy grants `sports_science_records` to the new jobs. The shared view omits notes and flag columns.

### 4. Assistant scout — medical data sealed

- Result: pass
- Plain-language evidence: No new allow on medical tables; assistant scout is not in any `sports_science_records` policy; matrix Deny on Medical records.

### 5. Assistant scout — sports-science data sealed

- Result: pass
- Plain-language evidence: Section 4 of the migration states deny by omitting policies for assistant_scout on `sports_science_records`; medical policies from the earlier migration stay as they were.

### 6. Assistant scout — medical flags hidden in shared views

- Result: pass
- Which shared view you checked: `public.players_shared_identity`
- Does that view run with the caller's rights (security_invoker) or with its owner's rights: owner's rights (default; no `security_invoker` in this file)
- Plain-language evidence: Column list is identity only; omits `players.notes` and has no injury/`ir`/medical-flag column. Assistant scout is not on base `players` SELECT.

### 7. Video analyst — medical data sealed

- Result: pass
- Plain-language evidence: Same as scout for medical tables: no policy opens medical rows to video_analyst; matrix Deny on Medical records.

### 8. Video analyst — sports-science data sealed

- Result: pass
- Plain-language evidence: No policy for video_analyst on `sports_science_records`; sealed by default deny. Separate from the assistant scout write paths (analyst has See-only on notes).

### 9. Video analyst — medical flags hidden in shared views

- Result: pass
- Which shared view you checked: `public.players_shared_identity`
- Does that view run with the caller's rights (security_invoker) or with its owner's rights: owner's rights (default; no `security_invoker` in this file)
- Plain-language evidence: Same view column list as for the assistant scout; video_analyst also omitted from base `players` SELECT so `players.notes` is not available there either.

### 10. Staff-facing requests do not use the service-role key to bypass seals

- Result: pass
- Compared to which sentence in the service-role key rule: "If a job is not named on the allowed list below, it must not use this key." and "### none" under Allowed server-only jobs; also "Staff screens use the signed-in person."
- Plain-language evidence (no secret values): This migration stores no key. It REVOKEs EXECUTE on `player_event_counts_for_game` from `service_role`. Comments tell staff paths to use the signed-in user, not the master key.
- SECURITY DEFINER function that returns sealed data, if any: None created in this file. Older `current_staff_role` / `staff_covers_athlete` are SECURITY DEFINER but return role text or a boolean, not sports-science measure bodies.

## Fixes sent back to the agent

If you asked for a fix, record it here. The agent must edit `supabase/migrations/20260418120000_least_privilege_new_staff_roles.sql`, not a new migration file.

| Failed check | What you saw | What you asked the agent to change | Re-checked result |
| --- | --- | --- | --- |
| (none) | Prompt 1 found no fail against matrix/key rule | No second-prompt SQL edit | n/a |

## Residual risks

| Check | What is still open | Why it was not fixed in this migration |
| --- | --- | --- |
| Shared `/players` seed status `ir` | App seed screens can still show injured-reserve style status | That flag lives in `src/data/hockeySeed.ts` / React routes, not in this SQL file |
| Directory server path | Older app code can still use a service-role client for `directory_entries` | Outside this migration; named in the key rule and audit as app residual risk |

If there is no residual risk, write "none".

(There is residual risk, listed above.)

## Sign-off

- Every required check is pass or residual risk: yes
- I did not create a second migration file: yes
- Sentence I could say to hockey operations about the two new roles and sealed medical data: The assistant scout may work with caseload scouting notes and game schedule context; the video analyst may read those notes and game context for video work; neither role can read medical rows, sports-science measures, or medical flags through this migration's shared identity view, and staff requests must not use the service-role master key to peek around those seals.