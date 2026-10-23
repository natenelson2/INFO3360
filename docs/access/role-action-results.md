# Role action results

Break-test proof for assistant scout and video analyst least privilege on the course Supabase project.

## How to read this table

- A blocked forbidden action is a **Pass** for the gate.
- A forbidden action that succeeds is a **Fail**, even if the vitest command exited cleanly (exit code 0).
- An allowed scouting or game read that works is a **Pass**.
- An allowed scouting or game read that is blocked is a **Fail**.
- Expected comes from docs/access/access-matrix-v2.md. Observed is what the signed-in role got back on the judged read or change.

## Run details

- Command: npx vitest run tests/access/least-privilege-roles.test.ts
- Project: course Supabase project for this Hockey Ops app (same project that received the least-privilege migration)
- Test file: tests/access/least-privilege-roles.test.ts
- Migration under test: supabase/migrations/20260418120000_least_privilege_new_staff_roles.sql
- Client used for judged reads: public anon key plus each staff session (not the service-role key)
- Accounts used (role names only; no emails or passwords in this file):
  - Assistant scout test account
  - Video analyst test account
  - Medical test account (control)

## Assistant scout

### Medical deny

- Expected: deny
- Observed: blocked (no medical or sports-science care rows returned for this role)
- Result: Pass
- What happened: The assistant scout tried to read sealed medical care data in sports_science_records. The gate refused useful rows, which is what the matrix requires for that job.

### Sports-science deny

- Expected: deny
- Observed: blocked (no sports-science measure rows returned; write attempt rejected)
- Result: Pass
- What happened: The assistant scout tried to read and change sports-science measures. The gate kept those rows sealed, so the job cannot use training or body-measure data.

### Shared-view medical flags hidden

- Expected: deny (flag absent, hidden, or rejected on players_shared_identity)
- Observed: blocked leak (shared view identity columns only; no notes, ir, or medical-flag fields)
- Result: Pass
- What happened: The assistant scout opened the shared identity view players_shared_identity. The gate did not show a medical flag or players.notes on that allowed screen.

### Scouting allow

- Expected: allow
- Observed: allowed (scouting_notes read succeeded for the signed-in assistant scout session)
- Result: Pass
- What happened: The assistant scout read scouting notes for their work. The gate allowed that path so the job can still review evaluation text.

### Game-data allow

- Expected: allow
- Observed: allowed (games read succeeded for the signed-in assistant scout session)
- Result: Pass
- What happened: The assistant scout read game schedule data. The gate allowed game context without opening medical or sports-science rows.

## Video analyst

### Medical deny

- Expected: deny
- Observed: blocked (no medical care rows returned for this role)
- Result: Pass
- What happened: The video analyst tried to read sealed medical care data in sports_science_records. The gate refused useful rows, matching the matrix Deny cell.

### Sports-science deny

- Expected: deny
- Observed: blocked (no sports-science measure rows returned; write attempt rejected)
- Result: Pass
- What happened: The video analyst tried to read and change sports-science measures. The gate kept those rows sealed; video performance work is not a reason to open that data.

### Shared-view medical flags hidden

- Expected: deny (flag absent, hidden, or rejected on players_shared_identity)
- Observed: blocked leak (shared view identity columns only; no notes, ir, or medical-flag fields)
- Result: Pass
- What happened: The video analyst opened players_shared_identity. The gate did not show a medical flag or players.notes on that shared view.

### Scouting allow

- Expected: allow
- Observed: allowed (scouting_notes read succeeded for the signed-in video analyst session)
- Result: Pass
- What happened: The video analyst read scouting notes for game analysis. The gate allowed that read-only path so the job can still match video to written evaluations.

### Game-data allow

- Expected: allow
- Observed: allowed (games read succeeded for the signed-in video analyst session)
- Result: Pass
- What happened: The video analyst read game schedule data. The gate allowed game context without opening medical or sports-science rows.

## Medical control (for contrast)

- Expected: allow read of medical / sports-science care data
- Observed: allowed for the medical test account on sports_science_records
- Result: Pass
- What happened: The medical account still reads care data, so the denies above are role seals, not a total outage of the table.

## Tightening log

- Test file: tests/access/least-privilege-roles.test.ts
- Migration file: supabase/migrations/20260418120000_least_privilege_new_staff_roles.sql
- Did any forbidden medical, sports-science, or shared-view flag access succeed? No.
- Change made in this step: none required. No migration tighten and no test-expectation flip.
- Re-run: same command, npx vitest run tests/access/least-privilege-roles.test.ts, still shows forbidden actions blocked and allowed scouting/game reads working for the two new roles.
- Service-role key: not used for judged staff reads (creating Auth users in the dashboard is separate from the reads under test).