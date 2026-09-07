Decisions log — Sprint 1 (engineering)

Short record for a developer joining next week. Detail lives in the named docs/files—no large code pasted here.

D1 — Route tree matches ops jobs





Decision: Which pages exist for Sprint 1.



Choice: Home, players index, dynamic player detail (/players/$playerId), games index—exactly the four routes in docs/route-map.md.



Why: Ops need shareable per-player links; list hubs match “browse directory / schedule” jobs. No admin, login, or game-detail routes this sprint.

D2 — Type-safe path params





Decision: How player ids enter the app.



Choice: Path param playerId with shared validation in src/lib/playerParams.ts (wired from src/routes/players/$playerId.tsx)—not query-only ?id=.



Why: Bookmarks must be honest URLs; empty/bad ids must not silently show the wrong player. Notes: docs/params-design-notes.md.



D3 — Search params for filters/views





Decision: Where directory filters live.



Choice: Schema-validated search params in src/lib/searchSchemas.ts on players and games indexes (docs/search-params-notes.md).



Why: Refresh and share keep the same view; invalid query junk gets safe defaults instead of a crash.



D4 — Server-rendered first paint with seed data





Decision: What staff see before client JS finishes.



Choice: Route loaders + src/data/hockeySeed.ts via src/server/directoryLoader.ts so first HTML includes names/opponents.



Why: Arena wifi makes spinner-only first loads painful; seed data proves SSR before Supabase. Evidence: docs/ssr-verification-notes.md, docs/acceptance-checklist.md (A8).



D5 — Navigation, cross-links, and empty states





Decision: How staff move between pages and handle missing players.



Choice: Shared src/components/AppNav.tsx; player→games context link; src/components/NotFoundPlayer.tsx for unknown ids; calm empty games filter state.



Why: A directory that dies silently between periods is not usable. Verified in acceptance A4, A9, A10.



D6 — Stack baseline





Decision: App foundation for this sprint.



Choice: TanStack Start (Vite + React + TypeScript + Tailwind) per docs/scaffold-notes.md.



Why: Fits type-safe routing and SSR goals; leaves a clear path to TanStack Query, Supabase, Vitest/Playwright, and Vercel next.



D7 — Version control hygiene





Decision: How the project is stored for grading and Sprint 2.



Choice: GitHub repo https://github.com/natenelson2/INFO3360 on main, with root .gitignore excluding node_modules/, build output, and real .env* files (docs/repo-setup.md).



Why: Ignore rules before commits keep secrets and install trees out of history; remote origin + upstream -u keep pushes simple.



Explicit non-goals this sprint





Live Supabase reads/writes, Auth, Vitest/Playwright CI, production deploy on Vercel.



