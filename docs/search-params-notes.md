# Search params notes

Shared rules live in `src/lib/searchSchemas.ts`. Path params identify one
player; search params only filter list pages.

## Players `/players`

| Key | Allowed values | Default |
|-----|----------------|---------|
| `position` | `F` \| `D` \| `G` \| `all` | `all` |
| `status` | `active` \| `ir` \| `all` | `active` |

- Wired via `validateSearch` → `validatePlayersSearch`
- Unknown keys ignored; invalid values fall back to defaults (**never throw**)
- Example bookmark: `/players?position=F&status=active`

## Games `/games`

| Key | Allowed values | Default |
|-----|----------------|---------|
| `team` | any string (trimmed, uppercased), or empty | `''` (any team) |
| `date` | `YYYY-MM-DD` or empty | `''` (any date) |

- Wired via `validateSearch` → `validateGamesSearch`
- Bad / non-ISO dates fall back to `''`; unknown keys ignored (**never throw**)
- Example bookmark: `/games?team=TOR&date=2026-03-20`

## Assessment

- Refresh keeps the same filters (bookmarkable query string)
- Garbage query values do not crash the app — they coerce to defaults
- Types flow from `validateSearch` into `Route.useSearch()`
