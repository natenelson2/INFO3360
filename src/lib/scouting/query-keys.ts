// src/lib/scouting/query-keys.ts
// Hierarchical factory — stable addresses for cache + later invalidation.
// Filter shapes match src/lib/scouting/queries.ts and rpc.ts.

import type {
  EventListFilters,
  GameListFilters,
  PlayerListFilters,
} from './queries'

export const scoutingKeys = {
  all: ['scouting'] as const,

  players: () => [...scoutingKeys.all, 'players'] as const,
  playerLists: () => [...scoutingKeys.players(), 'list'] as const,
  playerList: (filters: PlayerListFilters = {}) =>
    [...scoutingKeys.playerLists(), filters] as const,
  playerDetail: (playerId: string) =>
    [...scoutingKeys.players(), 'detail', playerId] as const,

  games: () => [...scoutingKeys.all, 'games'] as const,
  gameLists: () => [...scoutingKeys.games(), 'list'] as const,
  gameList: (filters: GameListFilters = {}) =>
    [...scoutingKeys.gameLists(), filters] as const,
  gameDetail: (gameId: string) =>
    [...scoutingKeys.games(), 'detail', gameId] as const,

  events: () => [...scoutingKeys.all, 'events'] as const,
  eventLists: () => [...scoutingKeys.events(), 'list'] as const,
  eventList: (filters: EventListFilters = {}) =>
    [...scoutingKeys.eventLists(), filters] as const,
  eventsWithPlayerList: (filters: EventListFilters = {}) =>
    [...scoutingKeys.events(), 'with-player', filters] as const,

  aggregates: () => [...scoutingKeys.all, 'aggregates'] as const,
  playerEventCountsForGame: (gameId: string) =>
    [...scoutingKeys.aggregates(), 'player-event-counts', gameId] as const,
}