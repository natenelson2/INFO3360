# Scouting cache invalidation map

## Rules
- Invalidate **related** query keys only — never the entire cache (`scoutingKeys.all` is not used for blind wipe, and `invalidateQueries()` is never called with no filter).
- Event creates always refresh event list prefixes **and** aggregate keys.
- Player/game identity fields on an event drive which detail and filtered list keys refresh.
- Key factories come only from `src/lib/scouting/query-keys.ts` (`scoutingKeys`).
- Write helpers come only from `src/lib/scouting/mutations.ts`.

## Inventory (this repo)

| Writes (`mutations.ts`) | Key factories used for invalidation (`query-keys.ts`) |
|-------------------------|--------------------------------------------------------|
| `createScoutingEvent` | `events`, `eventList`, `eventsWithPlayerList`, `playerDetail`, `gameDetail`, `aggregates`, `playerEventCountsForGame` |
| `updatePlayerNotes` | `players`, `playerDetail` |

There are no `createPlayer` / `updatePlayer` / `createGame` / `updateGame` / `updateEvent` exports in this codebase yet. Hooks wrap only the public writes that exist.

## Mutation → keys

| Mutation hook | Calls (from `mutations.ts`) | Invalidates (`scoutingKeys` factories) | Scout reason |
|---------------|-----------------------------|----------------------------------------|--------------|
| `useCreateScoutingEvent` | `createScoutingEvent` | `events()`; `eventList({ playerId })` / `eventList({ gameId })` when present; `eventsWithPlayerList({ playerId })` / `eventsWithPlayerList({ gameId })` when present; `playerDetail(player_id)`; `gameDetail(game_id)`; `playerEventCountsForGame(game_id)`; `aggregates()` | Logging a goal (or any event) must refresh the board rows, related player/game views, and per-game totals |
| `useUpdatePlayerNotes` | `updatePlayerNotes` | `players()`; `playerDetail(playerId)` | Edited scout notes must not stay stale on the roster or player card |

## Out of scope this step
- UI buttons/forms (next step wires routes)
- Changing SQL or regenerating database types
- Adding player/game CRUD writes that are not in `mutations.ts` yet