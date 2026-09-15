Sprint 2 · Topic 1 Handoff — Server Functions, Secret Hygiene, First Vitest Suite

1. Summary (what shipped)





Directory reads for the Hockey Operations Directory go through a TanStack Start server function (getDirectoryEntries in app/server/directory.ts), not a browser-direct Supabase service client.



Public vs secret environment variables are separated in .env.example and app/config/env.ts; the service-role credential is server-only (SUPABASE_SERVICE_ROLE_KEY, no VITE_ prefix).



A server-only Supabase client lives in app/lib/supabase.server.ts and is used only from the server function path.



Pure directory mappers live in app/lib/directory/mappers.ts and are covered by app/lib/directory/mappers.test.ts (Vitest).



UI entry for the directory: app/routes/directory.tsx calls the server function and renders mapped results (empty / error / success states). The live router also registers src/routes/directory.tsx with the same wiring.



2. Boundary decisions (keep these stable)







Concern



Decision



Where it lives





Who talks to Supabase with privileged credentials



Server only



app/lib/supabase.server.ts, app/server/directory.ts





What the browser is allowed to know



Public env names only (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY); never service role



.env.example, app/config/env.ts, client route





What is unit-tested in isolation



Pure map/filter helpers (no network)



app/lib/directory/mappers.ts + app/lib/directory/mappers.test.ts





Contract for the load path



Inputs/outputs and ok: true | false error shape agreed before coding



docs/server-function-contract.md





Planning sources



Why secrets fail in the browser; what runs where



docs/boundary-risk-notes.md, docs/client-vs-server-inventory.md



3. Secret hygiene proof (checklist — verified)





.env.example lists required vars by name with empty placeholders only (no real secrets committed). Public: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY. Secret: SUPABASE_SERVICE_ROLE_KEY.



Secret/service keys are read only in server modules: getServerEnv() in app/config/env.ts reads process.env.SUPABASE_SERVICE_ROLE_KEY; getSupabaseServerClient() in app/lib/supabase.server.ts uses that helper; app/server/directory.ts calls the server client only.



app/routes/directory.tsx does not import app/lib/supabase.server.ts and does not read service-role env vars. It imports getDirectoryEntries only.



Code-path review: server function returns only DirectoryEntry fields or safe { ok: false, error: { code, message } } — no env bags, no raw Supabase error objects, no service-role strings in the contract return type.



Real .env / .env.local remain gitignored (.env, .env.local, .env.*.local); no filled env files are tracked in git. No secret values appear in this handoff.

Proof notes (observations, not secret values):





Command(s) run for tests: pnpm test (Vitest run) — 10 passed in app/lib/directory/mappers.test.ts.



Directory route checked: app/routes/directory.tsx (and twin src/routes/directory.tsx) — loader calls getDirectoryEntries({ data: {} }); imports audited for absence of supabase.server / SUPABASE_SERVICE_ROLE_KEY / secret process.env or import.meta.env reads.



Network/bundle observation: Static review confirms the browser-facing route never touches the service-role path. Live browser Network panel should be re-confirmed locally when .env.local is filled and /directory loads against a real Supabase project — look for absence of SUPABASE_SERVICE_ROLE_KEY (or any long service-role JWT) in request URLs, client-controlled headers, and JSON payloads returned to the UI. Until that local pass is done, treat live Network proof as operator-verified on Mac, not assumed from CI.



4. Test status





Vitest config present: vitest.config.ts



Suite path: app/lib/directory/mappers.test.ts



Result at handoff time: PASS (10/10)



Behaviors protected:





formatDisplayName — trims/collapses messy names; missing name → Unknown



filterActivePeople — excludes is_active: false rows



mapDirectoryRow — snake_case DB row → UI person shape; invalid role → null



filterPeopleBySearch — case-insensitive displayName match; empty search returns full list



Red check performed earlier: intentional wrong expectation failed with clear expected vs received, then restored to green.



5. Leftover risks / known gaps





Auth-aware directory loads not in scope yet (who is allowed to see which rows).



Supabase RPC / richer server workflows not wired yet.



No full end-to-end (Playwright) coverage claimed in this topic.



Seed SSR paths (src/server/directoryLoader.ts / src/data/hockeySeed.ts) may still power /players and home; /directory is the new server-function path — full cutover is later.



Live Network panel proof depends on a filled local .env.local and a reachable Supabase directory_entries table; without that, the UI may show the safe UPSTREAM / UNKNOWN error shape (still no secrets returned).



Other: table/view name directory_entries and column names must exist in Supabase for a green data load; schema drift would surface as empty lists or upstream errors, not as leaked keys.



6. What rolls into the next Sprint 2 topic

Recommend the next slice pick up one primary thread:





Auth-aware loads — tie server functions to Supabase Auth session/roles before returning directory data.



Supabase RPC — move multi-step or privileged queries into database functions called only from the server.



Richer workflows — mutations, approvals, or multi-step ops that still keep secrets server-side and extend the test net.

Recommendation: Auth-aware loads  

Why: Topic 1 established the server boundary and a safe directory read contract, but any staffer (or stranger) who can hit the route still gets whatever the service-role query returns. Binding getDirectoryEntries to an authenticated staff identity/role is the highest-leverage next step before expanding RPC or mutations, and it keeps secrets on the server while matching the arena-wifi client story.

7. File map for the next reader







Path



Role





docs/boundary-risk-notes.md



Why browser-held secrets fail the client story





docs/client-vs-server-inventory.md



What runs where





docs/server-function-contract.md



Agreed server-function inputs/outputs





.env.example



Public vs secret env names for the team





app/config/env.ts



Typed/env access helpers (getPublicEnv / getServerEnv)





app/lib/supabase.server.ts



Server-only Supabase client





app/server/directory.ts



Directory server function (getDirectoryEntries)





app/routes/directory.tsx



UI wired to server function (PAUL path)





src/routes/directory.tsx



Live TanStack route twin for /directory





app/lib/directory/mappers.ts



Pure mappers





app/lib/directory/mappers.test.ts



First Vitest suite





vitest.config.ts



Vitest discovery config



8. Stakeholder one-liner

The Hockey Operations Directory now loads through a server-side path with separated secrets and a first automated unit-test safety net; next we add auth-aware loads without moving credentials into the browser.