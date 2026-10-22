# Sprint 4 Handoff: Auth Sessions and Row-Level Security

**Project:** Hockey operations app (scouting notes & sports-science data)  
**Sprint:** Sprint 4 - Identity: Who You Are and What You May Do  
**Audience:** Hockey ops leads, product owners, and the next engineer/agent  
**Related sources:** `docs/security/hockey-staff-access-brief.md`, `docs/security/role-access-matrix.md`, `docs/security/auth-session-plan.md`, `docs/security/rls-policy-spec.md`, `docs/security/rls-verification-checklist.md`, `supabase/migrations/20250321000000_hockey_staff_rls.sql`

This is a **stakeholder handoff** for non-engineers and engineers together - not a second technical design doc. It says what shipped, how ops assign roles today, how to prove the rules, and what is still open.

---

## 1. Sprint outcome (client story)

Scouting notes and sports-science rows must not be visible to every staff member. This sprint delivered staff **sign-in with Supabase Auth**, **sign-in session checks on the server** (so the browser alone is never trusted), and **PostgreSQL row-level security (RLS)** so coaching, scouting, and medical staff get different rows from shared tables - even if someone calls the API directly.

The app demonstrates the protected path for **scouting notes**. Sports-science rules are in the migration and policy docs; a dedicated medical UI/server loader was **not** built in this sprint.

| Original privacy goal (from access brief) | How this sprint addresses it | Status |
| --- | --- | --- |
| Only signed-in staff reach sensitive data | Login/logout + `requireSession` on server paths | **Delivered** |
| Role decides which rows are visible | RLS policies from the role access matrix (`staff_profiles.role`) | **Delivered** (in Postgres); app demo path is scouting notes |
| UI hiding is not enough | Policies in Postgres; checklist requires server/API path checks | **Delivered** as controls + checklist (manual walk may still be env-blocked) |
| Ops can explain who sees what | Role matrix + this handoff in plain language | **Delivered** |

---

## 2. What was delivered

### Authentication sessions
- Staff sign-in and sign-out via Supabase Auth: `src/routes/login.tsx`, `src/lib/auth/sign-in.ts`, `src/lib/auth/sign-out.ts`.
- Separate browser and server Supabase clients: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`.
- Public env vars documented in `.env.example` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`). Service-role keys must never go in the browser.

### Server-side session verification
- `src/lib/auth/require-session.ts` re-reads the Auth session from cookies and **throws** if there is no signed-in user (fail closed).
- `src/server/get-current-staff.ts` returns `{ id, email }` for the current session. It does **not** return role; role for row filtering comes from `staff_profiles` inside Postgres RLS.
- Protected scouting notes load through `src/server/scouting-notes.ts` → `src/routes/scouting/index.tsx` (session check first, then user-scoped query).

### Authorization with RLS (by role)
- Written policy intent: `docs/security/rls-policy-spec.md` (from `docs/security/role-access-matrix.md`).
- Migration: `supabase/migrations/20250321000000_hockey_staff_rls.sql` - enables RLS and role-scoped policies for:
  - `staff_profiles`, `staff_athlete_assignments`
  - `scouting_notes` (scouting caseload R+W; coaching/medical deny)
  - `sports_science_records` (medical caseload R+W; coaching/scouting deny)
  - `practice_or_game_plans` (coaching R+W; scouting limited schedule context; medical deny)
  - `players` shared identity (signed-in coaching/scouting/medical)

### Verification artifacts
- Unit tests for the session helper: `src/lib/auth/require-session.test.ts` (mock server client; no live database).
- Manual checklist for humans: `docs/security/rls-verification-checklist.md`.

### Not delivered in this sprint (do not promise yet)
- Admin / self-serve UI to assign roles
- Medical sports-science UI or dedicated medical server loader
- Playwright end-to-end role journeys
- CI / Vercel security gates beyond what the repo already has for normal builds
- Dual-role users, break-glass / admin override, HR sync

---

## 3. How stakeholders assign coaching, scouting, and medical roles

**Today (this sprint):** role assignment is an ops/engineering action in Supabase, not an in-app admin screen.

1. Create or invite the staff user in **Supabase Auth** (email/password as configured).
2. Insert or update a row in **`staff_profiles`** with:
   - `user_id` = that Auth user's id
   - `role` = exactly one of: `coaching` | `scouting` | `medical`
3. For scouting access to notes, also add **`staff_athlete_assignments`** rows (`assignment_kind = 'scouting'`) linking that staff user to the athletes they cover. Medical caseload uses the same assignment table with `assignment_kind = 'medical'` (see migration).
4. Have the user sign in through `/login` so a real session cookie is established.
5. Confirm with `docs/security/rls-verification-checklist.md` that they only see rows allowed for that role.

**Safe operating rule:** Treat role changes as privileged. After any role or assignment change, re-run the relevant checklist rows. Do not change roles by editing the browser or passing a role string from the client.

---

## 4. How to run the verification checklist

1. Open `docs/security/rls-verification-checklist.md`.
2. Confirm migration `20250321000000_hockey_staff_rls.sql` is applied in the Supabase project you are testing.
3. Run session helper tests, for example:

   ```bash
   npm test -- src/lib/auth/require-session.test.ts
   ```

4. Walk checklist sections A-E:
   - **Signed-out** - no note bodies
   - **Scouting** - caseload notes only
   - **Coaching** - signed in, but **zero** scouting note bodies
   - **Medical** - **zero** scouting note bodies
   - **Server path** - `scouting-notes.ts` still calls `requireSession` before querying
5. Mark Pass / Fail / Blocked (env) and record notes. If three role users do not exist yet, mark those rows **Blocked** honestly rather than guessing Pass.

If a check fails, do **not** "fix" it by only hiding UI controls. Trace session verification and RLS first (see the checklist's "which layer to fix" table).

---

## 5. Residual risks

| Risk | Why it matters | Mitigation now / next |
| --- | --- | --- |
| Wrong role or missing assignment on a staff profile | User sees too much or too little data | Dual-check role + assignments; re-run checklist |
| Service-role or bypass keys misused | RLS can be skipped by privileged clients | Keep service keys server-only; never ship them to the browser |
| Migration not applied in the environment under test | App looks fine; database is still open | Checklist "Before you start"; treat unapplied migration as Blocked |
| New tables without RLS | Fresh sensitive data may be wide open | Add RLS to the definition of done for new sensitive tables |
| UI-only "protection" regressions | Buttons can hide data that APIs still return | Prefer server paths + RLS; keep checklist items for direct access |
| Sports-science path not exercised in the UI | Medical rules exist in SQL but lack an app demo like scouting notes | Next topic: medical loader + checklist rows against `sports_science_records` |
| Incomplete browser role journeys in CI | Regressions can slip to production | Next topic: Playwright role journeys + pipeline gates |
| Dual-role / break-glass undecided | Ops may need emergency access later | Still out of scope; resolve with stakeholders before coding |

---

## 6. What should roll into the next topic

1. **Admin role assignment** - controlled way for trusted ops/engineering to set `coaching` / `scouting` / `medical` without raw SQL every time.
2. **Playwright role journeys** - end-to-end scripts that sign in as each role and assert allowed vs denied scouting (and later medical) views.
3. **CI / Vercel safeguards** - run `require-session` unit tests (and later e2e role checks) in the pipeline; ensure preview/production never expose service-role secrets to the browser.
4. **Medical sports-science server path** - same pattern as `src/server/scouting-notes.ts`, so the medical half of the brief is proven in the app, not only in SQL.
5. **Expand checklist coverage** - exercise `sports_science_records` and practice/game plan policies with real fixtures.

---

## 7. Decision log (plain language)

1. **Identity is checked on the server**, not only in the browser, so a modified webpage cannot pretend to be signed in (`require-session.ts`).
2. **Who may see which rows lives in Postgres RLS**, so coaching, scouting, and medical filters still apply if someone calls the API with a normal user session.
3. **Roles follow the written matrix** (`role-access-matrix.md`); policies were specified (`rls-policy-spec.md`) before SQL (`20250321000000_hockey_staff_rls.sql`).
4. **Role comes from `staff_profiles`**, not from a client-passed role string. `getCurrentStaff` only exposes id/email.
5. **Scouting notes are assignment-scoped** for scouting; coaching and medical get **Deny** (no "headline only" exception in v1).
6. **Proof beats hope:** unit tests for `require-session` plus `rls-verification-checklist.md` are part of delivery.
7. **Handoff is mandatory** so hockey ops and the next sprint share the same story of who may see what.

---

## 8. Privacy goals vs evidence (integration check)

Re-read against `docs/security/hockey-staff-access-brief.md`. Each goal is **Delivered**, **Partially delivered**, or **Deferred**, with evidence paths.

| Brief goal / hard rule | Status | Evidence |
| --- | --- | --- |
| Staff sign-in and sign-out with verified sessions (§6) | **Delivered** | `src/routes/login.tsx`, `src/lib/auth/sign-in.ts`, `src/lib/auth/sign-out.ts`, Supabase clients |
| Server functions refuse work with no valid session (§5-§6) | **Delivered** | `src/lib/auth/require-session.ts`, used by `src/server/scouting-notes.ts` and `src/server/get-current-staff.ts`; tests in `src/lib/auth/require-session.test.ts` |
| Written role-to-data matrix for coaching / scouting / medical (§6) | **Delivered** | `docs/security/role-access-matrix.md` |
| RLS policies for the three roles (§5-§6) | **Delivered** (SQL + docs) | `docs/security/rls-policy-spec.md`, `supabase/migrations/20250321000000_hockey_staff_rls.sql` |
| Protected scouting data path demonstrating filtered reads (§6) | **Delivered** | `src/server/scouting-notes.ts`, `src/routes/scouting/index.tsx` |
| Coaching **must not** read scouting notes (§4) | **Delivered** in RLS; **Partially** proven in app | Deny policies in migration; checklist §C. Needs real coaching user walk (or Blocked) |
| Medical **must not** read scouting notes (§4) | **Delivered** in RLS; **Partially** proven in app | Deny policies; checklist §D |
| Scouting **must not** read sports-science / medical rows (§4) | **Delivered** in RLS; **Deferred** in app UI | Deny for non-medical on `sports_science_records`; no medical loader UI in this sprint |
| Coaching **must not** read sports-science / medical rows (§4) | **Delivered** in RLS; **Deferred** in app UI | Same migration policies; no coaching path that queries those rows |
| Medical **must not** write scouting notes; scouting **must not** write medical measures (§4) | **Delivered** in RLS | INSERT/UPDATE policies scoped by role + caseload; no write UI claimed beyond policy |
| Rules apply to API/DB paths, not only screens (§4-§5) | **Delivered** as architecture | User-scoped server client + RLS; checklist insists UI hide alone is fail |
| Ops can name three groups and two sensitive data types (§8) | **Delivered** (docs) | Access brief + this handoff |
| Production security sign-off | **Deferred** | Brief §7: do not claim production sign-off until checklist (and env) are walked |
| Full HR onboarding, dual-role, break-glass, admin UI (§7 / open Qs) | **Deferred** | Listed in §6 next topic and residual risks |

---

## 9. Sign-off

- [ ] Privacy goals from the access brief are mapped above (delivered, partial, or deferred with evidence)
- [ ] Role assignment steps match `staff_profiles` + assignments (no invented admin UI)
- [ ] Verification checklist path is correct: `docs/security/rls-verification-checklist.md`
- [ ] Residual risks and next-topic items reviewed with stakeholder
- [ ] Checklist A-E walked, or blockers listed honestly

**Prepared for:** Hockey operations and product  
**Sprint status:** Identity and per-role data access slice complete for the scouting demo path; medical UI proof and admin/CI automation roll to the next topic