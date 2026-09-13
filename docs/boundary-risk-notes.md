# Boundary risk notes — Hockey Operations Directory (Sprint 2, Topic 1)

## Client story (one paragraph)

Hockey ops staff open a player/staff directory on arena wifi and need **real
roster rows from Supabase** (not forever-seed HTML). Some reads will use
privileged credentials so the app can load directory data the public anon key
alone may not be allowed to see. Those secrets must **never** ship in the Vite
browser bundle, appear in Network payloads, or sit in `VITE_`-prefixed env
vars. Sprint 2 Topic 1 moves privileged loading behind **TanStack Start server
functions**, splits **public vs secret** env config, and extracts **pure
mappers** that **Vitest** can unit-test—without implementing full Auth UX or
E2E yet.

## Activating the problem (plain language)

- **(a) What the directory must load:** Real player (and later staff) rows from
  Supabase—names, ids, positions/status fields the ops UI already shows—via a
  server-owned read path, not a client-side secret fetch.
- **(b) Why credentials are involved:** Supabase access needs a project URL plus
  a key. Privileged “service role” (or other non-public) keys can bypass row
  rules; they are required for some server-side directory reads as we migrate
  off seed data.
- **(c) What must never reach the browser:** The service role key (and any other
  secret env value), full secret env dumps, and any module that constructs a
  Supabase client with those secrets and is imported into client/UI code.

## What might naively run in the client (risks)

- Creating a Supabase client inside a React component or route file
  (`src/routes/players/index.tsx`, `$playerId.tsx`, etc.) using a **service
  role** key from env Vite would embed in the client bundle.
- Calling Supabase from `useEffect` / click handlers with a secret key string
  present in shipped JS (visible in DevTools → Sources / Network).
- Putting the service role in `.env` as `VITE_SUPABASE_SERVICE_ROLE_KEY` (or any
  `VITE_…` secret) “so the browser can read it.”
- Logging `import.meta.env`, full error objects, or response wrappers that
  include secret keys to the browser console.
- One shared `src/lib/supabase.ts` imported by both server and UI, so the
  client dependency graph pulls in server-only secret reads.
- Replacing today’s **seed SSR loaders** (`src/server/directoryLoader.ts` +
  `src/data/hockeySeed.ts`) by pasting privileged Supabase calls into the same
  client-visible modules without a server-function boundary.

## What must move server-side

- Any use of the Supabase **service role** (or other non-public) credential.
- Directory **read orchestration** that needs those credentials (query rows,
  map to DTOs, normalize errors)—invoked from TanStack Start **server
  functions**, not from browser-only UI.
- A **server-only** Supabase client module that reads secret env vars and is
  never imported by browser-only components/routes for secret use.
- Env loading that distinguishes **public** values (intentionally exposable,
  e.g. project URL + anon key if product policy allows) from **secret** values
  (service role and similar)—secrets without `VITE_` prefixes.
- Keeping privileged I/O out of pure mapper modules so Vitest can run mappers
  without real keys.

## What may stay in the client

- Presentational directory UI (lists, filters chrome, loading/empty/not-found
  states such as `NotFoundPlayer`, `AppNav`).
- Calling a TanStack Start **server function** and rendering the returned DTO
  (typed player/game shapes)—without ever receiving raw secrets.
- Public, intentionally non-secret config only (e.g. public Supabase URL / anon
  key **if** the team standardizes those as public), clearly named and never
  mixed with service-role names.
- Client-side filter UX that only sends **non-secret** search params
  (`position`, `status`, `team`, `date`, `playerId` per `src/lib/searchSchemas.ts`)
  to the server function.

## Success criteria for this tutorial (checklist)

- [ ] `.env.example` documents a **public vs secret** split; secret names are
      **not** `VITE_`-prefixed; real `.env` / `.env.local` stay gitignored
      (see `docs/repo-setup.md` / root `.gitignore`).
- [ ] A typed env/config module (or equivalent) loads secrets only on the
      server path; a reviewer can open the file and see secret keys are not
      read via `import.meta.env.VITE_*`.
- [ ] A **server-only** Supabase client module exists; search shows it is not
      imported from browser-only UI modules for privileged reads.
- [ ] A TanStack Start **server function** loads directory data; players/games
      UI calls that function (or a loader that calls it) rather than embedding
      service credentials in route components.
- [ ] Pure directory **mappers**/filters live in a module separate from I/O
      (no Supabase client import inside the mapper file).
- [ ] Vitest is configured; at least one mapper unit test **fails** on wrong
      mapping/filter behavior and **passes** on correct behavior.
- [ ] This file (or a short follow-on handoff note) still records the boundary
      decisions for the next Sprint 2 topic.

## Out of scope for this topic (do not solve here)

- Full Supabase Auth UX, RLS policy design beyond “secrets stay server-side,”
  Playwright E2E, or production hardening beyond establishing the server
  boundary and first Vitest mapper tests.
- Writing exploits or demonstrating real key theft—only defensive separation.
- Replacing every seed path in one step if later topics phase the cutover;
  Topic 1 is the **boundary + testable mappers** plan, not the whole data
  migration.

## Open questions to resolve in later steps

- Exact server-function input/output contract for directory reads (filters,
  pagination, error DTO shape).
- Which env var names the team standardizes on for public vs secret keys
  (e.g. `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
- Whether first production reads use service role only, anon + RLS, or a mix.
- How seed SSR (`directoryLoader` / `hockeySeed`) is retired vs kept as a
  local fallback when Supabase env is missing.
- Stack context for implementers: **TanStack Start**, **Vite**, **Supabase**,
  **Vitest** (and existing Vercel Hobby Production URL for later deploy checks).