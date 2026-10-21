Vec# RLS + session verification checklist (Hockey staff)

Use this after `require-session` unit tests pass. Goal: prove each role only sees
allowed scouting rows, and signed-out callers get nothing useful.

**UI hiding alone is not enough.** Denials must hold on the server/API path
(`listScoutingNotes` → `requireSession` → cookie-wired server Supabase client →
Postgres RLS). If a role can still get note bodies by calling the server
function or PostgREST with their JWT, that is a fail even when a menu is hidden.

Source of truth:
- `docs/security/rls-policy-spec.md`
- `supabase/migrations/20250321000000_hockey_staff_rls.sql`
- `src/server/scouting-notes.ts`
- `src/lib/auth/require-session.ts`

## Policy reminder (from the spec)

| Role | Scouting notes (`scouting_notes`) |
| --- | --- |
| Signed-out | No access (fail closed) |
| **scouting** | SELECT/INSERT/UPDATE only for athletes on that user’s scouting assignment/caseload |
| **coaching** | **Deny** all ops (no note bodies, no “headline only” in v1) |
| **medical** | **Deny** all ops |

Sports-science rows are medical-caseload only; coaching/scouting must not read them. This checklist focuses on the scouting notes path you shipped.

## Before you start

- [ ] Migration `20250321000000_hockey_staff_rls.sql` applied to the Supabase project you are testing
- [ ] `staff_profiles` rows exist with `role` in (`coaching`, `scouting`, `medical`) linked to Auth users
- [ ] Scouting test user has `staff_athlete_assignments` rows (`assignment_kind = 'scouting'`) for at least one athlete that has a `scouting_notes` row
- [ ] You can sign in via `/login` and open `/scouting/`
- [ ] You know how to sign out fully between role checks
- [ ] Vitest: `npm test -- src/lib/auth/require-session.test.ts` (or `pnpm test -- …`) passes

Environment blockers (if any): _________

## A. Signed-out visitor

| Step | Action | Pass looks like | Fail looks like |
|------|--------|-----------------|-----------------|
| A1 | With no session, open `/scouting/` (or call `listScoutingNotes`) | Clear unauthorized / sign-in required — **no note bodies** | Any scouting note text or 200 with rows |
| A2 | Sign out, retry the same request | Still denied | Data appears after logout (stale session bug) |

Result: ☐ Pass  ☐ Fail  ☐ Blocked (env)  
Notes: _________

## B. Scouting staff

| Step | Action | Pass looks like | Fail looks like |
|------|--------|-----------------|-----------------|
| B1 | Sign in as **scouting**; open `/scouting/` | Sees notes for athletes on their scouting caseload; page shows signed-in email/id | Hard unauthorized when profile/assignments exist; or empty when seed notes should be visible |
| B2 | Confirm row set matches assignment scope in the policy spec | Only caseload athletes; no sports-science / medical fields on this page | Notes for athletes they are not assigned; medical measure text |

Result: ☐ Pass  ☐ Fail  ☐ Blocked (env)  
Notes: _________

## C. Coaching staff

| Step | Action | Pass looks like | Fail looks like |
|------|--------|-----------------|-----------------|
| C1 | Sign in as **coaching**; open the same `/scouting/` server path | Signed in succeeds, but **zero** scouting note bodies (empty list is correct) | Any scouting note body or competitive prose |
| C2 | Compare to scouting user | Scouting sees assigned notes; coaching sees none | Identical full dump for every role |

Result: ☐ Pass  ☐ Fail  ☐ Blocked (env)  
Notes: _________

## D. Medical staff

| Step | Action | Pass looks like | Fail looks like |
|------|--------|-----------------|-----------------|
| D1 | Sign in as **medical**; open `/scouting/` | **Denied empty list** for scouting notes (spec: medical must not read scouting notes) | Entire scouting table readable |
| D2 | Confirm no cross-role leak | No scouting note bodies via this server path | Coaching/scouting private content visible |

Result: ☐ Pass  ☐ Fail  ☐ Blocked (env)  
Notes: _________

## E. Server path still uses require-session

| Step | Action | Pass looks like | Fail looks like |
|------|--------|-----------------|-----------------|
| E1 | Skim `src/server/scouting-notes.ts` | Calls `requireSession` before querying; uses `createSupabaseServerClient`; does not take a browser role argument | Query runs with no session check, or uses browser client |
| E2 | Unit tests: `src/lib/auth/require-session.test.ts` | Authenticated case returns `{ id, email }`; unauthenticated / auth-error cases **throw** (fail closed) | Only happy-path test exists, or mocks the wrong client/API |

Result: ☐ Pass  ☐ Fail  ☐ Blocked (env)  
Notes: _________

## Failures → which layer to fix

| Symptom | Likely layer | Where to look |
| --- | --- | --- |
| Signed-out still gets rows | Session helper or server path skipped the gate | `require-session.ts`, `scouting-notes.ts` |
| Signed-out gets empty 200 that looks like “no notes” without auth error | Fail-closed / error shape | `scouting-notes.ts` UNAUTHORIZED branch; route UI |
| Scouting sees nothing but seed data exists | Assignments / RLS helper / profile role | `staff_profiles`, `staff_athlete_assignments`, migration policies |
| Coaching or medical sees note bodies | RLS too loose or wrong client (service role) | `20250321000000_hockey_staff_rls.sql`; confirm user-scoped server client |
| Unit test mocks `getUser` / wrong export name | Test drift | Align test with real `createSupabaseServerClient` + `getSession` |

### Fix loop

1. Identify layer: session helper, scouting server path, or SQL RLS policy.
2. Re-read the matching section of `rls-policy-spec.md`.
3. Prompt the coding-agent with the failing checklist row + expected pass behavior.
4. Re-run Vitest and the failed checklist rows only.
5. Do not mark Sprint 4 verification done until A–E are Pass or explicitly blocked with environment notes.

## Sign-off

- Tester name: _________
- Date: _________
- Vitest `require-session`: ☐ Pass  ☐ Fail
- Checklist overall: ☐ Pass  ☐ Fail  ☐ Partial (list blockers below)

Blockers: _________