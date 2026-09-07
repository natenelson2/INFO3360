Stakeholder handoff — Hockey Ops Player Directory (Sprint 1)

Audience: Hockey operations leads and anyone triaging the next sprint
App: Local developer copy of the Hockey Ops player directory
Repository: https://github.com/natenelson2/INFO3360 (see also docs/repo-setup.md)
Date: 2026-09-07
Acceptance status: Ready (10/10 checks in docs/acceptance-checklist.md)

Glossary (one line): Server-rendered first paint means player/game names are already in the page when it arrives—important on slow arena wifi. Seed data means sample roster/schedule text baked into the app for this sprint, not the live club database.

Delivered now (what staff can do)

Checked personally against the acceptance checklist:





Open Home and see Hockey Ops directory content right away (sample featured players such as Alex Mercer)—not a blank page or endless spinner.



Use the top nav to reach Players and Games from the main pages.



Open the players list and see real-looking roster names and sweater numbers from the sample data.



Open a specific player page with a stable link (example that works: /players/p-17 for Alex Mercer), bookmark or paste that link in a new tab, and land on the same player.



Jump from a found player page toward the schedule (games list), and get back to that player when the schedule shows player context.



Change filters in the address bar (for example goalies only, or a team/date on games); refresh or reopen that link and keep the same filtered view.



Bad filter text in the URL does not crash the app—it falls back to safe defaults.



Type a fake player link (example: /players/does-not-exist-999) and see a clear player not found message with a way back to the roster list—not a broken white screen.



Known limitations (do not assume these work yet)





Seed data only: Names, numbers, and games are sample hockey data in the app files—not the live club roster or schedule database (Supabase is not connected yet).



No staff login yet: There is no Supabase Auth; anyone who can open the local app URL can view the pages.



No shared production URL yet: This sprint was verified on a developer machine (npm run dev). A hosted Vercel (or similar) URL is next-sprint work.



No automated test suite yet: Vitest, Playwright, and GitHub Actions checks are recommended next—not delivered here.



Games are a simple list: There is no per-game detail page this sprint (by design in the route map).



How to try it (high level)





Clone or open https://github.com/natenelson2/INFO3360, install dependencies, and start the dev server (npm run dev—see docs/scaffold-notes.md).



In the browser, open Home, Players, a player detail URL such as /players/p-17, and Games.



Bookmark that player URL, open it in a new tab, and confirm the same player content appears immediately (first paint)—not only after a long wait.

Pass/fail notes: docs/acceptance-checklist.md and docs/ssr-verification-notes.md.

Recommended next sprint





Live data: Replace seed loaders with Supabase (and RPC where list/filter logic belongs in the database), using TanStack Query on the client where it helps.



Auth: Protect staff-only views with Supabase Auth and clear logged-out behavior.



Quality gates: Add Vitest for param/schema helpers and Playwright for bookmark + first-paint smoke paths; run them in GitHub Actions.



Deploy: Ship a preview/production URL on Vercel and re-run the acceptance checklist against that URL.



One-line summary for leadership

Staff can already open bookmarkable player and games pages that show directory content immediately on a local build; the next sprint should connect the live roster, login, automated tests, and a shared hosted URL.