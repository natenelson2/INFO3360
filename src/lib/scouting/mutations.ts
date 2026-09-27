// src/lib/scouting/mutations.ts
// Typed write helpers for the Hockey Ops scouting board.
// No TanStack Query hooks, no RPC — inserts/updates only.

import { supabase } from '../supabase/client'
import type { Database } from '../../types/database'

type EventRow = Database['public']['Tables']['events']['Row']
type EventInsert = Database['public']['Tables']['events']['Insert']
type PlayerRow = Database['public']['Tables']['players']['Row']
type PlayerUpdate = Database['public']['Tables']['players']['Update']

export type MutationResult<T> =
  | { data: T; error: null }
  | { data: null; error: { message: string } }

/**
 * Log a scouting event (goal, hit, note-linked observation, etc.).
 * Required fields are enforced by a small runtime check (player_id + game_id).
 */
export async function createScoutingEvent(
  input: EventInsert,
): Promise<MutationResult<EventRow>> {
  if (input.player_id == null || input.game_id == null) {
    return {
      data: null,
      error: {
        message: 'player_id and game_id are required to log an event.',
      },
    }
  }

  const { data, error } = await supabase
    .from('events')
    .insert(input)
    .select()
    .single()

  if (error) {
    return { data: null, error: { message: error.message } }
  }

  return { data, error: null }
}

/**
 * Update free-text notes on a player row (partial update).
 */
export async function updatePlayerNotes(
  playerId: string,
  notes: string,
): Promise<MutationResult<PlayerRow>> {
  if (!playerId.trim()) {
    return {
      data: null,
      error: { message: 'playerId is required to update notes.' },
    }
  }

  const patch: PlayerUpdate = { notes }

  const { data, error } = await supabase
    .from('players')
    .update(patch)
    .eq('id', playerId)
    .select()
    .single()

  if (error) {
    return { data: null, error: { message: error.message } }
  }

  return { data, error: null }
}