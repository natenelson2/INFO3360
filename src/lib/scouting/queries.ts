// src/lib/scouting/queries.ts
// Read-only scouting queries for the Hockey Ops board.
// No inserts/updates/deletes, no React components, no TanStack Query hooks.

import { supabase } from '../supabase/client'
import type { Database } from '../../types/database'

type PlayerRow = Database['public']['Tables']['players']['Row']
type GameRow = Database['public']['Tables']['games']['Row']
type EventRow = Database['public']['Tables']['events']['Row']

export type PlayerListFilters = {
  position?: string | null
  teamName?: string | null
}

export type GameListFilters = {
  season?: string | null
}

export type EventListFilters = {
  gameId?: string | null
  playerId?: string | null
  eventType?: string | null
}

/** Events joined with player identity for scout board rows. */
export type EventWithPlayer = EventRow & {
  player: Pick<PlayerRow, 'id' | 'full_name' | 'position'> | null
}

export async function listPlayers(
  filters: PlayerListFilters = {},
): Promise<PlayerRow[]> {
  let query = supabase.from('players').select('*').order('full_name')

  if (filters.position) {
    query = query.eq('position', filters.position)
  }
  if (filters.teamName) {
    query = query.eq('team_name', filters.teamName)
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function getPlayerById(id: string): Promise<PlayerRow | null> {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function listGames(
  filters: GameListFilters = {},
): Promise<GameRow[]> {
  let query = supabase
    .from('games')
    .select('*')
    .order('played_at', { ascending: false })

  if (filters.season) {
    query = query.eq('season', filters.season)
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function getGameById(id: string): Promise<GameRow | null> {
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function listEvents(
  filters: EventListFilters = {},
): Promise<EventRow[]> {
  let query = supabase
    .from('events')
    .select('*')
    .order('occurred_at', { ascending: false })

  if (filters.gameId) {
    query = query.eq('game_id', filters.gameId)
  }
  if (filters.playerId) {
    query = query.eq('player_id', filters.playerId)
  }
  if (filters.eventType) {
    query = query.eq('event_type', filters.eventType)
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function listEventsWithPlayer(
  filters: EventListFilters = {},
): Promise<EventWithPlayer[]> {
  let query = supabase
    .from('events')
    .select('*, player:players(id, full_name, position)')
    .order('occurred_at', { ascending: false })

  if (filters.gameId) {
    query = query.eq('game_id', filters.gameId)
  }
  if (filters.playerId) {
    query = query.eq('player_id', filters.playerId)
  }
  if (filters.eventType) {
    query = query.eq('event_type', filters.eventType)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as EventWithPlayer[]
}