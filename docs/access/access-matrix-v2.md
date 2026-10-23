# Access matrix v2

## Purpose

This file is the contract for a later database change. It is not that change. It contains no SQL and it does not create a migration.

## Sources

- `docs/access/new-roles-brief.md`
- `docs/access/overgrant-audit.md`
- `docs/access/service-role-key-rule.md`

Earlier Sprint 4 matrix kept for existing-role baseline: `docs/security/role-access-matrix.md` (coaching / scouting / medical cells stay unchanged except where the audit forces a narrower cell).

## How to read a cell

- **Deny** means the role cannot see or change that data.
- **See** means look only. It does not include add, change, or delete.
- **See, add, change** means look plus create and update. It does not include delete unless a cell says delete.
- **Never** means this role must not use the service-role key.
- A cell that is not a needed allow is **Deny**.
- Default deny: if this matrix does not allow it, refuse it.

## Roles

- **Assistant scout:** A junior scouting staff member who helps full scouts prepare and tidy player evaluations during the season.
- **Video analyst:** A staff member who breaks down game video and clips for hockey operations so coaches and scouts can review play.
- **Coaching:** unchanged job from the earlier matrix (plan practices and games; no scouting-note bodies; no medical / sports-science rows).
- **Scouting:** unchanged job from the earlier matrix (record and review scouting notes for assignments; no medical / sports-science rows).
- **Medical:** unchanged job from the earlier matrix (sports-science / medical staff data for care caseload; no scouting-note bodies).

## Data areas

- **Scouting notes:** written opinions and reports about players as hockey prospects, not health records.
- **Game data:** scores, schedules, and game or video notes that are not medical.
- **Medical records:** injury and health records.
- **Sports-science data:** body measurements, training load, and injury-risk numbers.
- **Medical flags in shared scouting views:** short markers, such as injured or not cleared, that can show on a scouting screen even when the medical record is hidden.
- **Player free-text `notes` column:** free-text on the player card (`players.notes`), separate from `scouting_notes` bodies. Not shared identity.
- **Service-role key:** the master key that skips row-level security.

## Matrix

| Role | Data area | Action | Because |
| --- | --- | --- | --- |
| Assistant scout | Scouting notes | See, add, change | Brief: prepare and tidy evaluations and write and review note bodies for the scouting caseload they support. No delete. |
| Assistant scout | Game data | See | Brief: schedule, opponent, and score or result context to tie notes to real games. |
| Assistant scout | Medical records | Deny | This job must not see medical data. |
| Assistant scout | Sports-science data | Deny | This job must not see sports-science data. |
| Assistant scout | Medical flags in shared scouting views | Deny | A flag on a scouting screen is still medical information. |
| Assistant scout | Player free-text `notes` column | Deny | Brief allows shared identity for labels and `scouting_notes` bodies, not the separate player-card notes column. |
| Assistant scout | Service-role key | Never | Staff screens use the signed-in person. Allowed server jobs stay in `docs/access/service-role-key-rule.md` (none). |
| Video analyst | Scouting notes | See | Brief: read note text about tendencies and opponent strengths or weaknesses for games under analysis. No write actions. |
| Video analyst | Game data | See | Brief: schedule, opponent, period and score context, and game-event facts used to find and label video. |
| Video analyst | Medical records | Deny | This job must not see medical data. |
| Video analyst | Sports-science data | Deny | Performance on video is not sports-science data. |
| Video analyst | Medical flags in shared scouting views | Deny | A flag on a scouting screen is still medical information. |
| Video analyst | Player free-text `notes` column | Deny | Brief limits this job to shared player identity for labels, not free-text player-card notes (audit over-grant). |
| Video analyst | Service-role key | Never | Staff screens use the signed-in person. Allowed server jobs stay in `docs/access/service-role-key-rule.md` (none). |
| Coaching | Scouting notes | Deny | Unchanged from the earlier matrix (coaching must not read scouting-note bodies). Not widened while adding new roles. |
| Coaching | Game data | See | Unchanged intent: schedule and game context for coaching work. Not widened while adding new roles. |
| Coaching | Medical records | Deny | Unchanged from the earlier matrix. No new medical allow. |
| Coaching | Sports-science data | Deny | Unchanged from the earlier matrix. No new sports-science allow. |
| Coaching | Medical flags in shared scouting views | Deny | No new flag allow. Shared views must not show medical flags to non-medical roles. |
| Coaching | Service-role key | Never | Staff screens use the signed-in person. |
| Scouting | Scouting notes | See, add, change | Unchanged from the earlier matrix (R+W on assignment caseload). No delete. Not widened while adding new roles. |
| Scouting | Game data | See | Unchanged from the earlier matrix (schedule / opponent context only). Not widened while adding new roles. |
| Scouting | Medical records | Deny | Unchanged from the earlier matrix. No new medical allow. |
| Scouting | Sports-science data | Deny | Unchanged from the earlier matrix. No new sports-science allow. |
| Scouting | Medical flags in shared scouting views | Deny | Narrowed: shared scouting views must hide medical flags from scouts, even if an older screen showed a flag such as `ir`. |
| Scouting | Service-role key | Never | Staff screens use the signed-in person. |
| Medical | Scouting notes | Deny | Unchanged from the earlier matrix. Medical must not read scouting notes. |
| Medical | Game data | Deny | Unchanged: medical job is care data, not game or video ops. Not widened while adding new roles. |
| Medical | Medical records | See, add, change | Unchanged from the earlier matrix (care caseload). Do not invent a wider medical grant in this file. No delete. |
| Medical | Sports-science data | See, add, change | Unchanged from the earlier matrix (care caseload). Do not invent a wider sports-science grant in this file. No delete. |
| Medical | Medical flags in shared scouting views | See | Unchanged: medical staff may keep flag access they already had for care. Other roles do not gain it. |
| Medical | Service-role key | Never | Even medical screens use the signed-in person, not the master key. |

### Extra rows forced by the audit

| Role | Data area | Action | Because |
| --- | --- | --- | --- |
| Anonymous caller | `player_event_counts_for_game` RPC | Deny | Audit: EXECUTE was granted to `anon`. Game aggregates for staff work must not be open to anonymous callers. |
| Assistant scout | Seed roster status `ir` on `/players` | Deny | Audit: shared players screens show injured-reserve style status. That is a medical flag on a shared screen. |
| Video analyst | Seed roster status `ir` on `/players` | Deny | Same audit finding. Brief seals medical flags for this job. |
| Scouting | Seed roster status `ir` on `/players` | Deny | Same shared-screen flag rule as medical flags in shared scouting views. |
| Coaching | Seed roster status `ir` on `/players` | Deny | No new flag allow for coaching. |
| Any staff role | Service-role key for directory or "make the page work" | Never | Service-role key rule allow list is none. Directory must not set the pattern for scout or analyst paths. |

## Shared scouting views

A shared scouting view is a screen or saved query that mixes scouting or game information for people who are not in the medical role.

Medical flags must be left out of every shared scouting view that the assistant scout, the video analyst, or the scouting role can open.

Hiding the medical table is not enough if the flag still shows on that screen. The seed roster status `ir` on `/players` is an example of a flag that must stay out for those roles.

## Service-role key

No staff role may use the service-role key.

The only jobs that may use it are the ones already written in `docs/access/service-role-key-rule.md`. That file's allowed list is **none**. This file does not add new jobs to that list.

## Narrowed from the audit

- **Shared `/players` roster status `ir`:** Old wide grant: anyone who opens players list or detail can see injured-reserve style status. Narrower cells: Deny medical flags (and Deny `ir`) for assistant scout, video analyst, scouting, and coaching. Medical keeps See on medical flags only.
- **`player_event_counts_for_game` EXECUTE for `anon`:** Old wide grant: anonymous callers may run the RPC. Narrower cell: Deny for anonymous callers; staff game aggregates stay behind signed-in staff paths, never the service-role key.
- **`listPlayers` / `getPlayerById` `select('*')` including `players.notes`:** Old wide grant: video analyst path could pull free-text player-card notes with identity. Narrower cell: Video analyst Deny on player free-text `notes` column; See only shared identity plus allowed scouting-note reads from the brief.
- **Service-role use in directory server path:** Old wide pattern: service-role client reads `directory_entries`. Narrower cell: Never for every staff role; key-rule allow list remains none so scout and analyst paths cannot copy that pattern.

## Existing roles

Coaching, scouting, and medical stay as they were, except where the audit required a narrower cell (medical flags / `ir` on shared views for non-medical roles, and no service-role key for any staff role).

This file does not give coaching or scouting a new allow on medical records, sports-science data, or medical flags.

## Not in this file

No SQL. No file under `supabase/migrations/`. No staff email. No test list. No real service-role key, token, or connection string.
