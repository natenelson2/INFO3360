# Hockey Ops Player Directory — Route Map

Source of truth: `docs/requirements-brief.md`  
Scaffold context: `docs/scaffold-notes.md`  
Framework: TanStack Start + TanStack Router (file-based routes under `src/routes/`)

## Why this map exists

Staff on arena wifi must open **bookmarkable URLs** and see a consistent shell.  
This document locks path names and file homes **before** page UI is built.

## Route table

| URL path | Kind | Purpose (hockey ops) | Route file (planned) | Bookmarkable? |
|----------|------|----------------------|----------------------|---------------|
| `/` | static | Home / directory landing | `src/routes/index.tsx` | yes |
| `/players` | static | Full players list | `src/routes/players/index.tsx` | yes |
| `/players/$playerId` | dynamic | One player’s detail page | `src/routes/players/$playerId.tsx` | yes (each id is its own URL) |
| `/games` | static | Games index / schedule views | `src/routes/games/index.tsx` | yes |

## Path segments (plain language)

- **Static segment:** a fixed word in the URL (`players`, `games`). Same for every staff member.
- **Dynamic segment:** a placeholder that changes per resource. Here `$playerId` stands for a real player id in the path (example: `/players/42`). The `$` in the filename means “this URL piece is a value, not a fixed word.”
- **Index route:** the default page for a folder path (e.g. `/players` → `players/index.tsx`).

## Bookmarkable player links (checklist)

- [ ] Every player has a shareable URL shaped like `/players/<id>` (path param — **not** `/players?id=42`).
- [ ] Pasting `/players/<id>` into a new tab (or refreshing) opens that same player page.
- [ ] Home, players list, and games each have their own path staff can type or bookmark.
- [ ] No extra mystery routes required for sprint 1 beyond the table above.

## Root layout

- File: `src/routes/__root.tsx`
- Role: shared shell for all pages (document/html structure as required by Start, header branding, main area, outlet for child routes).
- Out of scope for root: player tables, filters, or fetch logic (later steps).

## Generated route tree

- File: `src/routeTree.gen.ts`
- Role: framework-generated wiring from files in `src/routes/` into the router.
- Refresh command (from `package.json`): `npm run generate-routes`
- Rule: prefer regenerating via that script; do not rely on permanent hand-edits the generator will wipe.

## Layout + child relationship (target)

```text
__root (shell: header + outlet)
├── index                    → /
├── players/index            → /players
├── players/$playerId        → /players/:playerId
└── games/index              → /games