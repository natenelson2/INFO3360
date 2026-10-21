# RLS Policy Specification — Hockey Staff Data

**Product:** Hockey Ops  
**Sprint:** Sprint 4  
**Sources:** `docs/security/role-access-matrix.md`, `docs/security/auth-session-plan.md`  
**Audience:** Developers writing the next Postgres RLS migration  

## Purpose

Turn the role access matrix into implementable Postgres row-level security intents.  
Coaching, scouting, and medical staff share tables but must see **different rows**.  
This document is the source of truth for the SQL migration in the next step.  
**Do not put finished SQL here**—only plain-language policy intent suitable for `USING` and `WITH CHECK`.

**Core promise:** Same tables, different rows. UI hiding is not enough. Policies enforce filters in Postgres even on direct API paths the app uses.

---

## Identity linkage (must match auth-session-plan)

The auth-session plan proves **who** is signed in (`requireSession` → `auth` user id/email). RLS needs a **role** for that user. The matrix left role assignment as an open question; this spec locks one approach so session helpers and policies agree:

| Piece | Decision for v1 |
| --- | --- |
| Auth source | Supabase Auth session → Postgres `auth.uid()` |
| Staff mapping table | `staff_profiles` |
| Link column | `staff_profiles.user_id = auth.uid()` |
| Role claim field | `staff_profiles.role` with values exactly: `coaching` \| `scouting` \| `medical` |
| Helper idea | Policies resolve the current role by looking up the `staff_profiles` row for `auth.uid()` (for example a small SQL helper function used inside policies) |
| Unauthenticated | No row access (RLS enabled; no public/anon read policies on sensitive tables) |
| Dual-role | **Out of scope for v1** — one role per profile row. Do not invent a second role system. |
| App client | Protected server paths must use the **user-scoped** (anon + session cookie) server client so RLS applies. Do not use the service-role key to load scouting notes or sports-science rows for staff browsers. |

`getCurrentStaff` today returns `{ id, email }` only. Role for RLS comes from `staff_profiles`, not from a client-passed role string.

---

## Tables in scope

Logical matrix kinds mapped to table names used by this spec:

| Matrix data kind | Table (spec name) | Sensitivity | Shared across roles? | Notes |
| --- | --- | --- | --- | --- |
| `scouting_notes` | `scouting_notes` | High — competitive intel | Yes — filtered by role + assignment | Same table; coaching/medical see **no** rows |
| `medical_or_sports_science_data` | `sports_science_records` | High — medical/performance | Yes — filtered by role + caseload | Medical primary; coaching/scouting **deny** |
| `practice_or_game_plans` | `practice_or_game_plans` | Medium — coaching strategy | Yes — filtered by role + visibility | Coaching owns; scouting limited schedule context; medical deny |
| `player_roster_shared_fields` | `players` (shared columns only) | Low — navigation identity | Yes — same shared columns for all signed-in staff | No note bodies; no science measures |

---

## Policy intents by table

### Table: `scouting_notes`

RLS: **ENABLED** (required)

**Row-scope (v1):** Scouting staff may access notes for athletes on their **assignment / caseload** (matrix: R+W assignment / own caseload). Team-wide “all scouts see all notes” is **not** allowed until stakeholders close that open question.

Assumed columns for intent wording (names may be adjusted in migration, not access width):  
`athlete_id`, `author_id` (or `created_by`), assignment linkage such that “current scout covers this athlete,” note body text.

#### SELECT

| Role | Allow? | USING intent (plain language) |
| --- | --- | --- |
| scouting | **Yes** | Row is visible when the current user’s `staff_profiles.role` is `scouting` **and** the note’s athlete is on that user’s scouting assignment/caseload. |
| coaching | **Deny** | **No rows.** Matrix and brief: coaching must not read scouting-note rows or note bodies. No “headline only” exception in v1. |
| medical | **Deny** | **No rows.** Medical must not read scouting notes. |

#### INSERT

| Role | Allow? | WITH CHECK intent |
| --- | --- | --- |
| scouting | **Yes** | New row is authored by the current user (`author_id` / `created_by` = `auth.uid()`), role is scouting, and the athlete is on that user’s assignment/caseload. |
| coaching | **Deny** | Deny all inserts. |
| medical | **Deny** | Deny all inserts. |

#### UPDATE

| Role | Allow? | USING + WITH CHECK intent |
| --- | --- | --- |
| scouting | **Yes** | May update only rows already visible under the SELECT rule. WITH CHECK must keep the row inside scouting + same assignment scope (cannot reassign athlete or author to bypass RLS). |
| coaching | **Deny** | Deny. |
| medical | **Deny** | Deny. |

#### DELETE

| Role | Allow? | USING intent |
| --- | --- | --- |
| scouting | **Deny** (v1) | Matrix R+W covers create/update; delete is not explicitly allowed → **deny-by-default**. |
| coaching | **Deny** | Deny. |
| medical | **Deny** | Deny. |

---

### Table: `sports_science_records`

RLS: **ENABLED** (required)

**Row-scope (v1):** Medical staff may access records for athletes on their **care caseload** only (matrix: R+W care caseload). Broader “all medical see all athletes” is **not** allowed unless stakeholders say so.

#### SELECT

| Role | Allow? | USING intent |
| --- | --- | --- |
| medical | **Yes** | Row is visible when current role is `medical` **and** the athlete is on that user’s care caseload. |
| coaching | **Deny** | **No rows.** Matrix: coaching must not read sports-science / medical rows. No “limited aggregate” exception in v1 (would need a separate matrix row). |
| scouting | **Deny** | **No rows.** Scouting must not read sports-science / medical rows. |

#### INSERT

| Role | Allow? | WITH CHECK intent |
| --- | --- | --- |
| medical | **Yes** | New row owned/authored consistently with medical role; athlete on current user’s care caseload; cannot invent another staff’s caseload. |
| coaching | **Deny** | Deny all inserts. |
| scouting | **Deny** | Deny all inserts. |

#### UPDATE

| Role | Allow? | USING + WITH CHECK intent |
| --- | --- | --- |
| medical | **Yes** | May update only caseload-visible rows; WITH CHECK keeps athlete/caseload/owner inside medical rules. |
| coaching | **Deny** | Deny. |
| scouting | **Deny** | Deny. |

#### DELETE

| Role | Allow? | USING intent |
| --- | --- | --- |
| medical | **Deny** (v1) | Not explicitly allowed in the matrix → deny-by-default. Soft-delete later if stakeholders ask. |
| coaching | **Deny** | Deny. |
| scouting | **Deny** | Deny. |

---

### Table: `practice_or_game_plans`

RLS: **ENABLED** (required)

**Visibility idea (plain language):** Rows (or columns) marked as **schedule/opponent context** vs **full coaching strategy**. Scouting may read only the schedule/opponent context slice. Medical sees neither full plans nor strategy.

#### SELECT

| Role | Allow? | USING intent |
| --- | --- | --- |
| coaching | **Yes** | All practice/game plan rows for the team (team-wide coaching plans). |
| scouting | **Limited Yes** | Only rows (or row versions) marked as schedule/opponent context the product marks coaching-safe — **not** private strategy prose. |
| medical | **Deny** | **No** full practice/game plan rows. A separate `availability_flag` is **not** in this table’s allow list until the matrix adds it. |

#### INSERT / UPDATE / DELETE

| Role | INSERT | UPDATE | DELETE | Intent summary |
| --- | --- | --- | --- | --- |
| coaching | **Yes** | **Yes** | **Deny** (v1) | Coaching owns creates/updates; delete not in matrix → deny-by-default. WITH CHECK keeps plan under coaching ownership. |
| scouting | **Deny** | **Deny** | **Deny** | Read-limited only; no writes. |
| medical | **Deny** | **Deny** | **Deny** | Deny all. |

---

### Table: `players` (shared roster fields only)

RLS: **ENABLED** for staff access paths (required for staff-only directory facts)

This is the matrix kind `player_roster_shared_fields`. Policies must expose **shared identity columns only** (for example display name, position, jersey number). They must **not** expose scouting note bodies or sports-science measures (those live on other tables).

#### SELECT

| Role | Allow? | USING intent |
| --- | --- | --- |
| coaching | **Yes** | Signed-in staff with role `coaching` may read team-wide shared identity fields. |
| scouting | **Yes** | Signed-in staff with role `scouting` may read team-wide shared identity fields. |
| medical | **Yes** | Signed-in staff with role `medical` may read team-wide shared identity fields. |

#### INSERT / UPDATE / DELETE

| Role | INSERT | UPDATE | DELETE | Intent summary |
| --- | --- | --- | --- | --- |
| coaching | **Deny** | **Deny** | **Deny** | Matrix allows **R** only on shared fields for v1. |
| scouting | **Deny** | **Deny** | **Deny** | Read only. |
| medical | **Deny** | **Deny** | **Deny** | Read only. |

Exact shared column list remains an open stakeholder question; migration must not widen into note or science columns.

---

## Cross-cutting rules

1. **Same tables, different rows:** Never rely on hiding UI buttons; policies enforce filters in Postgres for scouting notes and sports-science records especially.
2. **Default deny:** If a role/operation is not listed as allow above, the migration must **not** add a permissive policy.
3. **Session agreement:** Role values (`coaching` / `scouting` / `medical`) and `staff_profiles.user_id` linkage must match `docs/security/auth-session-plan.md` + this identity section.
4. **Service role / bypass:** App staff data paths must use the user-scoped server client so RLS applies. Service-role bypass is not an allowed staff browser path in this sprint.
5. **No client-trusted role:** A request body or query param saying `role=medical` is not authorization. Role comes from `staff_profiles` for `auth.uid()`.
6. **Open questions carried forward** (do not invent broader access):
   - Exact assignment/caseload table or columns (`author_id`, `athlete_id`, `caseload_staff_id`, …).
   - Whether scouting notes ever become team-wide for all scouts.
   - Exact shared `players` column list.
   - Optional medical `availability_flag` (separate matrix row later — not folded into full plans).
   - Admin/GM break-glass (out of scope; no fourth role policies here).
   - Dual-role accounts (out of scope for v1).

---

## Traceability

| Matrix row / data area | Table | Policies covered |
| --- | --- | --- |
| `scouting_notes` — scouting R+W (assignment) | `scouting_notes` | SELECT/INSERT/UPDATE allow for scouting; DELETE deny |
| `scouting_notes` — coaching — | `scouting_notes` | SELECT/INSERT/UPDATE/DELETE **deny** |
| `scouting_notes` — medical — | `scouting_notes` | SELECT/INSERT/UPDATE/DELETE **deny** |
| `medical_or_sports_science_data` — medical R+W (caseload) | `sports_science_records` | SELECT/INSERT/UPDATE allow for medical; DELETE deny |
| `medical_or_sports_science_data` — coaching/scouting — | `sports_science_records` | All ops **deny** |
| `practice_or_game_plans` — coaching R+W | `practice_or_game_plans` | SELECT/INSERT/UPDATE allow; DELETE deny |
| `practice_or_game_plans` — scouting R limited | `practice_or_game_plans` | SELECT schedule/opponent context only; writes deny |
| `practice_or_game_plans` — medical — | `practice_or_game_plans` | All ops **deny** |
| `player_roster_shared_fields` — all three R | `players` | SELECT shared identity for signed-in staff; writes deny |

---

## Ready for migration when

- [x] Every sensitive matrix data area maps to a table section above
- [x] Every role has explicit allow or **deny** for SELECT/INSERT/UPDATE/DELETE on sensitive tables
- [x] Identity linkage matches the auth session plan (`auth.uid()` → `staff_profiles.role`)
- [x] “Same tables, different rows” is stated for scouting and sports-science data
- [x] No unfinished SQL required to understand the rules
- [x] Spec is not softer than the matrix (coaching/medical deny on scouting notes; coaching/scouting deny on sports-science)