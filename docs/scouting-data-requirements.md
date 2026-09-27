# Scouting data requirements — Hockey Ops board (reads)

**Status:** Data-access contract for typed Supabase reads  
**Type source:** `src/types/database.ts` (follow column names there exactly)  
**Env (public client only):** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`  
**Out of scope here:** inserts/updates/deletes, React components, TanStack Query hooks, service-role keys

## Board needs (concrete reads)

### Players
| Need | Function shape | Filters |
| --- | --- | --- |
| Roster list for scout filters | `listPlayers(filters?)` | `position?`, `teamName?` |
| Player detail / card | `getPlayerById(id)` | by `id` |

### Games
| Need | Function shape | Filters |
| --- | --- | --- |
| Schedule / season list | `listGames(filters?)` | `season?` |
| Game detail | `getGameById(id)` | by `id` |

### Events
| Need | Function shape | Filters |
| --- | --- | --- |
| Event list for a game or player | `listEvents(filters?)` | `gameId?`, `playerId?`, `eventType?` |
| Board rows with player identity | `listEventsWithPlayer(filters?)` | same filters; join `players(id, full_name, position)` |

## Join view
Scouts need event rows plus enough player identity to label the board without a second fetch:
- Event fields from `events`
- Nested `player`: `id`, `full_name`, `position` (nullable if join missing)

## Error behavior
On Supabase errors, **throw** (do not swallow and return empty arrays without a reason). Callers handle failure.

## Tables (must match `src/types/database.ts`)
- `players` — roster identity and position/team labels
- `games` — schedule / season context
- `events` — scouting events linked to `game_id` and `player_id`