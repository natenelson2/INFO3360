# Acceptance checklist — Hockey ops player directory (Sprint 1)

**App under test:** TanStack Start player directory (local dev)
**Date:** 2026-09-07
**Tester:** Nate Nelson
**Overall status:** ready

## Summary for hockey ops

- Passes: 10
- Fails: 0
- Blockers for demo: none

Seed ids used in checks: `p-17` (Alex Mercer), goalie filter shows Sam Ortiz (`p-30`). Invalid id: `does-not-exist-999`.

## How to re-run

1. From the project folder, start the dev server (`npm run dev` or the script in package.json).
2. Open the local URL shown in the terminal (this run used `http://127.0.0.1:43123`).
3. Walk each row below; update Result and Evidence if anything changes.

Cross-check sources: `docs/requirements-brief.md`, `docs/route-map.md`, `docs/ssr-verification-notes.md`.

## Criteria (from docs/requirements-brief.md)

| ID | Criterion | How tested | Result | Evidence | Notes / next action |
|----|-----------|------------|--------|----------|---------------------|
| A1 | Home route loads and shows directory-oriented content (not only a blank shell) | Open `/` after fresh load; search initial HTML for product name + seed content | pass | Heading **Hockey Ops Player Directory**; featured seed name **Alex Mercer** in first HTML; links to Players/Games | Matches brief item 1 |
| A2 | Players index is reachable from nav and lists seed players | Open `/players`; View Source / curl for seed names | pass | Initial HTML includes **Alex Mercer**, **Jordan Lee**, **Sam Ortiz**, and other seed roster rows | Matches brief item 2 |
| A3 | Player detail is bookmarkable: direct load of `/players/:playerId` works in a fresh session | Direct GET `/players/p-17` (no prior Home navigation) | pass | URL `/players/p-17` returns **#17 Alex Mercer** with position/status in first HTML | Path param (not `?id=`); matches brief items 3 & 8 |
| A4 | Player path param is validated / invalid id shows not-found or empty state | Open `/players/does-not-exist-999` | pass | **Player not found** via `NotFoundPlayer`; copy mentions id; Link **Back to players directory** — no crash stack | Matches brief item 6 |
| A5 | Games index loads and is linkable | Open `/games` | pass | Seed rows in first HTML include **North Bay**, **Toronto**, dates | Matches brief item 4 |
| A6 | Search/filter params restore on reload (players and/or games) | Open filtered URLs directly: `/players?position=G&status=active` and `/games?team=TOR&date=2026-03-20` | pass | Players filter HTML still shows active filters and **Sam Ortiz**; games filter shows **Toronto** on 2026-03-20 | Same as bookmarkable query restore |
| A7 | Invalid search params do not crash the page | Open `/players?position=NOPE&status=bogus` | pass | Page 200; UI shows defaults `position=all`, `status=active`; roster still renders | Coercion in `validatePlayersSearch` — never throws |
| A8 | Server-rendered first content: known seed name appears in initial HTML (View Source) or under slow network without long empty spinner | View Source equivalent (curl initial document) on `/` and `/players` | pass | Names **Alex Mercer** / **Jordan Lee** present in first HTML; aligns with `docs/ssr-verification-notes.md` | No client-only `useEffect` fetch for directory body |
| A9 | Cross-links between players and games (if present) do not 404 | From `/players/p-17` follow schedule link; open `/games?playerId=p-17` | pass | Detail HTML includes **View schedule**; games page shows **Showing games context** for `p-17` / Alex Mercer with Link back to detail | Type-safe `Link` + `playerId` search |
| A10 | Main nav reaches Home, Players, Games from each major page | Inspect nav markup on `/`, `/players`, `/players/p-17`, `/games` | pass | `AppNav` exposes `href="/"`, `href="/players"`, `href="/games"` on detail and list pages | Brief item 5 |

## Gaps log (fails only)

| ID | What failed | Suspected area (route file / loader / nav) | Minimal fix idea |
|----|-------------|---------------------------------------------|------------------|
| — | none | — | — |

## Sign-off

- [x] Checklist matches criteria in docs/requirements-brief.md
- [x] Bookmark test done via direct load of `/players/p-17` (fresh request, no Home prerequisite)
- [x] At least one SSR/first-document check recorded
- [x] Fails (if any) have next actions for handoff — N/A (0 fails)

**Ready for stakeholder handoff step?** yes — all A1–A10 passed with evidence against seed SSR loaders; Supabase still stubbed as noted in SSR notes.
