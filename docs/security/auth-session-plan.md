# Auth Session Plan — Hockey Staff (Sprint 4)

**Product:** Hockey Ops  
**Audience:** Beginner stakeholders and implementers  
**This file is a plan only.** No application code. No SQL. No login UI.

## Purpose

Describe how staff prove who they are with **Supabase Auth**, where the session lives, and how **TanStack Start server functions** must re-check identity before any sensitive query.

- **Who may see which rows** → `docs/security/role-access-matrix.md`
- **How we know who is asking** → this plan

UI menus alone are not enough. The browser must not be the only gate.

---

## Roles in scope (from the matrix)

Exactly three roles. Do not invent extras here.

| Role | Sensitive data reminder (from the matrix) |
| --- | --- |
| **coaching** | Shared roster fields; practice/game plans. **Deny** scouting notes and medical / sports-science data. |
| **scouting** | Scouting notes (R+W for assignments). Shared roster fields. **Deny** medical / sports-science data. |
| **medical** | Medical / sports-science data (R+W for caseload). Shared roster fields. **Deny** scouting notes. |

Point readers to the matrix for full row-scope rules.

---

## End-to-end sequence (four steps)

1. **Login** — Staff open a login route and sign in with Supabase Auth (email/password or the method the project standardizes). On success, Supabase establishes a real Auth session.
2. **Session storage** — The session (access proof) is kept so later requests can prove identity—typically via cookies managed with Supabase SSR/auth helpers. Do **not** paste long-lived secrets into frontend code. Do **not** treat React state alone as identity.
3. **Server verify** — Before reading private data, TanStack Start **server functions** use a **server Supabase client**, read the current session from the request/cookies, and run a **require-session** style helper. If there is no valid session, the function **stops (fail closed)** and does **not** query scouting notes, medical rows, or other private tables.
4. **Data access** — Only after a valid session may the server function query data. Per-role row filtering will be enforced later with Postgres **RLS** using the signed-in user’s identity and role. The UI must not be the only gate.

```text
Staff browser          TanStack Start            Supabase Auth / DB
     |                      |                            |
     |-- sign in ---------->|--- auth API -------------->|
     |<-- session cookie ---|<-- session established ----|
     |                      |                            |
     |-- load scouting ---->| server function            |
     |                      |-- require-session -------->|
     |                      |-- query (if OK) ---------->|
     |<-- filtered rows ----|<-- rows (RLS later) -------|
```

---

## Browser Supabase client vs server Supabase client

| Client | Where it runs | Used for | Trust level |
| --- | --- | --- | --- |
| **Browser client** | User’s browser (login UI, sign-out control) | Starting sign-in and sign-out | **Must not** be trusted alone for authorization |
| **Server client** | TanStack Start server functions | Reading the session from the request/cookies; running sensitive queries only after require-session | Trusted path for identity checks before data access |

**Plain language:** The browser client helps someone sign in. Anyone can open a network tool or call an API. So every sensitive load must happen in a **server function** that looks up the session again. If the session is missing or expired, refuse the work. Do not return partial private rows.

---

## Session rules (non-negotiable)

- Never treat “the login page set some React state” as proof of identity on the server.
- Every sensitive server function checks the session again with require-session.
- Missing or expired session → **fail closed** (deny access). Do not return partial private rows.
- Role names used later (**coaching** / **scouting** / **medical**) must match the matrix.
- Shared roster fields may still need a signed-in staff session when the product requires staff-only access; they are not an excuse to skip require-session on private note or medical loaders.

---

## Server functions that must call require-session (planned)

| Server entry (planned name) | Why |
| --- | --- |
| `getCurrentStaff` (or `get-current-staff`) | Resolves who is signed in and their staff role (**coaching** / **scouting** / **medical**) before the UI shows role-specific chrome |
| Scouting notes loader (server path) | Returns scouting note rows only after identity is verified; RLS will further filter by role/assignment later |
| Sports-science / medical loader (future server path) | Same pattern—session first, then query; matrix says only **medical** may read/write those rows |
| Practice / game plans loader (future server path) | Session first; matrix says **coaching** owns plans, **scouting** limited schedule context, **medical** deny |

Sign-in and sign-out helpers establish or clear the session. They are not data loaders, but they must use the correct Supabase client for their environment (browser for UI sign-in/out; server helpers when clearing/reading session on the server).

---

## Fail-closed behavior (missing session)

When require-session finds no valid session:

1. Do **not** run the sensitive query.
2. Return a clear unauthorized / unauthenticated error shape the UI can show.
3. Do **not** return empty arrays that look like “no notes exist” if the real reason is “not signed in.” Prefer an explicit auth failure so staff know to sign in again.
4. Do **not** fall back to the service-role key in a browser-exposed path to “just make it work.”

---

## What this plan deliberately defers

- Typed client file layout (`src/lib/supabase/...`) — next implementation step
- Login route UI and sign-in / sign-out modules
- The actual `require-session` helper code
- Postgres **RLS** policy SQL (later authorization step) — RLS will enforce per-role rows in Postgres using the signed-in identity; this plan only requires that session verification happens first
- Filling open questions from the matrix (exact role-assignment column, dual-role rules)

---

## Acceptance checks for later agent work

- [ ] Browser and server clients are separate and used in the right place
- [ ] Login creates a real Supabase Auth session (not fake local-only auth)
- [ ] Sensitive server functions call require-session before queries (at least `getCurrentStaff` and scouting data)
- [ ] Unauthenticated calls fail closed (no partial private rows)
- [ ] Role matrix remains the source of truth for who may see which rows (**coaching** / **scouting** / **medical**)
- [ ] Plan readers can state the four-step sequence: login → session storage → server verify → data access

---

## Source links

- Role matrix: `docs/security/role-access-matrix.md`
- Staff access brief: `docs/security/hockey-staff-access-brief.md`
- Client story reminder: scouting notes and sports-science / medical data must not be world-readable; UI-only hiding is not enough