# Role Access Matrix — Hockey Staff (Sprint 4)

Source brief: `docs/security/hockey-staff-access-brief.md`  
Purpose: Contract for app session checks and later Postgres RLS.  
Roles (columns): **coaching** | **scouting** | **medical**  
Product: Hockey Ops  

**This file is matrix and notes only.** No application code. No SQL. No RLS policy syntax.

---

## How to read this matrix

- **R** = may read matching rows  
- **W** = may create/update matching rows  
- **R+W** = may read and create/update matching rows  
- **—** = **Deny** (no read, no write)  
- **Row scope** explains *which* rows, not only the logical data kind.

Cell legend in the table uses `R`, `W`, `R+W`, or `—` plus a short scope phrase in the Notes column (and under each role cell when scope differs).

---

## Matrix

| Data kind (logical) | Coaching | Scouting | Medical | Notes / row scope |
| --- | --- | --- | --- | --- |
| `player_roster_shared_fields` | **R** (team-wide shared identity) | **R** (team-wide shared identity) | **R** (team-wide shared identity) | Shared directory facts only (for example display name, position, jersey number used for navigation). **No** scouting note body text. **No** sports-science / medical measures. Brief §2–§3. |
| `scouting_notes` | **—** | **R+W** (assignment / own caseload) | **—** | Brief §4: coaching **must not** read scouting-note rows or note bodies; medical **must not** read scouting notes. Scouting may read/write notes for players they cover (assignments). Team-wide scouting read is **not** decided — see Open questions. |
| `medical_or_sports_science_data` | **—** | **—** | **R+W** (care caseload) | Brief §4: coaching and scouting **must not** read sports-science / medical rows. Medical may read/write rows for athletes in their care scope. Broader than caseload is **not** allowed unless stakeholders say so. |
| `practice_or_game_plans` | **R+W** (team-wide coaching plans) | **R** (limited: schedule / opponent context only) | **—** | Coaching owns practice/game plans (brief §3 primary goal). Scouting may read schedule/opponent context the product marks coaching-safe — **not** private coaching strategy prose. Medical: deny full plans; a separate shared `availability_flag` (if stakeholders want one) is **not** decided here — see Open questions. |

---

## Role summaries

### Coaching
- **Primary need:** Plan practices and games; see shared roster fields and coaching-owned plans.
- **Must not see / change:** Full scouting notes (bodies or scouting-only rows); sports-science / medical rows; write paths into those sensitive kinds.
- **Brief anchors:** §3 coaching row; §4 coaching must-not bullets.

### Scouting
- **Primary need:** Create and review scouting notes for their assignments; shared roster fields for labels.
- **Must not see / change:** Medical / sports-science raw data; write paths into medical data; medical’s private notes.
- **Brief anchors:** §3 scouting row; §4 scouting must-not bullets.

### Medical
- **Primary need:** Sports-science and medical rows for care and return-to-play within caseload; shared roster fields for labels.
- **Must not see / change:** Scouting notes and competitive evaluation prose; unrelated coaching-only private material (full practice/game plans).
- **Brief anchors:** §3 medical row; §4 medical must-not bullets.

---

## Deny-by-default

If a role / data pair is **not** explicitly allowed above, treat it as **Deny**.

- UI hiding a menu or column is **not** enough (brief §5).
- These rules must hold later for direct API and database access paths the app uses.
- Soft phrases like “should probably not see” are rejected; use **must not** / **Deny**.

---

## Open questions (resolve before RLS migration)

Anything the brief does not clearly decide stays here — not as a silent **Allow**.

1. **Role assignment:** How is a login mapped to coaching / scouting / medical (staff profile column, auth claim, invite table)?
2. **Row ownership keys:** What column ties a scouting note or medical row to a staff member or athlete caseload (`author_id`, `athlete_id`, `caseload_staff_id`, assignment table)?
3. **Scouting note width:** Are scouting notes limited to “players they cover” only (brief §3), or team-wide for all scouting accounts?
4. **Coaching read of scouting:** Brief §4 says coaching **must not** read scouting-note rows or note bodies. Confirm there is **no** allowed “headline only” exception for v1 (matrix currently **Deny**).
5. **Cross-role / dual-role:** Can one person hold two roles? If yes, is access the union of both matrices, or an explicit dual-role rule? (Brief §9.)
6. **Admin / GM break-glass:** Who approves emergency access to medical data outside normal role paths? Is that a fourth privileged role out of scope for Sprint 4?
7. **Shared field list:** Exact player/game columns that count as `player_roster_shared_fields` vs role-bound columns (brief §9).
8. **Availability flags:** May medical see a tiny shared availability / status flag without seeing full `practice_or_game_plans`? If yes, add a separate matrix row later — do not fold it into full plans.
9. **Denied-write UX:** Clear error vs empty result when a role tries a denied write (brief §9).

---

## Acceptance for implementers

- [x] Three roles match the brief’s staff groups (coaching, scouting, medical).
- [x] Every sensitive data kind from the brief appears as a matrix row (`scouting_notes`, `medical_or_sports_science_data`), plus practice/game plans and shared roster fields.
- [x] Medical raw data is not readable by coaching or scouting (**—**).
- [x] Scouting notes are not readable by medical (**—**); coaching also **—** per brief §4.
- [x] Each allow cell has a row-scope phrase (not only “yes”).
- [x] Open questions list anything the brief did not decide (role assignment, ownership keys, dual-role, break-glass, field list).
- [x] Deny-by-default is stated; no SQL or application code in this file.