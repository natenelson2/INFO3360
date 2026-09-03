# INFO3360 — Hockey Ops Player Directory

Course project (NateNelson2): a TanStack Start player directory for hockey ops. Staff open it on arena wifi and see real roster and game content on first paint—bookmarkable player URLs, no login required in Sprint 1.

## Requirements (Sprint 1)

`docs/requirements-brief.md` is the source of truth. It covers overview, actors/goals, the four-route map, first-paint (SSR) data, type-safe links/params, out of scope, browser-checkable acceptance criteria, and the sprint boundary.

## Routes

| Route | URL | Kind |
|-------|-----|------|
| Home | / | Static |
| Players | /players | Static |
| Player detail | /players/$playerId | Dynamic (path param) |
| Games | /games | Static |

## Run locally

The TanStack Start app is not scaffolded in this repo yet. After Sprint 1 implementation, this README will list the dev command and port.
