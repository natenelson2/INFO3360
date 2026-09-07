# Path params design notes — player detail

## Decision

- Route file: `src/routes/players/$playerId.tsx`
- URL pattern: `/players/$playerId`
- Param name: `playerId` (matches route map + helper)
- Shared helper: `src/lib/playerParams.ts`

## Validation (sprint 1)

- `parsePlayerIdParam`: non-empty trimmed string
- Rejects non-strings and empty/whitespace-only values (throws; do not render a fake success sheet)
- Real roster UUIDs or jersey-number rules can tighten later — keep the rule minimal this sprint

## Linking

- Players index uses `<Link to="/players/$playerId" params={{ playerId }}>`
- Do **not** rely only on `?playerId=` / `?id=` query strings for the detail page
- Optional helper `playerDetailPath(playerId)` builds `/players/{id}` with encoding for non-router uses

## Why

Hockey ops needs shareable, bookmarkable per-player URLs on arena wifi. A staffer can paste `/players/42` into a new tab and still land on the same sheet without depending on client-only list state. The shared helper keeps list links, the detail route, and future loaders consistent on one param name and one validation rule.
