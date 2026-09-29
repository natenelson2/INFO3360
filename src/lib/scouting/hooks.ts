// src/lib/scouting/hooks.ts
// Thin TanStack Query wrappers — scouting helpers stay the single fetch source.
// Components must not import the Supabase client for these lists.

import { useQuery } from '@tanstack/react-query'
import {
  getGameById,
  getPlayerById,
  listEvents,
  listEventsWithPlayer,
  listGames,
  listPlayers,
  type EventListFilters,
  type GameListFilters,
  type PlayerListFilters,
} from './queries'
import { getPlayerEventCountsForGame } from './rpc'
import { scoutingKeys } from './query-keys'

export function usePlayers(filters: PlayerListFilters = {}) {
  return useQuery({
    queryKey: scoutingKeys.playerList(filters),
    queryFn: () => listPlayers(filters),
  })
}

export function usePlayer(playerId: string | undefined) {
  return useQuery({
    queryKey: scoutingKeys.playerDetail(playerId ?? ''),
    queryFn: () => getPlayerById(playerId as string),
    enabled: Boolean(playerId),
  })
}

export function useGames(filters: GameListFilters = {}) {
  return useQuery({
    queryKey: scoutingKeys.gameList(filters),
    queryFn: () => listGames(filters),
  })
}

export function useGame(gameId: string | undefined) {
  return useQuery({
    queryKey: scoutingKeys.gameDetail(gameId ?? ''),
    queryFn: () => getGameById(gameId as string),
    enabled: Boolean(gameId),
  })
}

export function useEvents(filters: EventListFilters = {}) {
  return useQuery({
    queryKey: scoutingKeys.eventList(filters),
    queryFn: () => listEvents(filters),
  })
}

export function useEventsWithPlayer(filters: EventListFilters = {}) {
  return useQuery({
    queryKey: scoutingKeys.eventsWithPlayerList(filters),
    queryFn: () => listEventsWithPlayer(filters),
  })
}

/** RPC aggregate — disabled until a game id is provided. */
export function usePlayerEventCountsForGame(gameId: string | undefined) {
  return useQuery({
    queryKey: scoutingKeys.playerEventCountsForGame(gameId ?? ''),
    queryFn: () => getPlayerEventCountsForGame(gameId as string),
    enabled: Boolean(gameId),
  })
}