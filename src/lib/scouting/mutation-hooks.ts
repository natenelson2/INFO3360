// src/lib/scouting/mutation-hooks.ts
// TanStack Query write wrappers — invalidate only related scoutingKeys prefixes.
// Does not invent parallel key arrays; does not call invalidateQueries() bare.

import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Database } from '../../types/database'
import { createScoutingEvent, updatePlayerNotes } from './mutations'
import { scoutingKeys } from './query-keys'

type EventInsert = Database['public']['Tables']['events']['Insert']

export type UpdatePlayerNotesVariables = {
  playerId: string
  notes: string
}

/**
 * Invalidation map (draft → code):
 * - createScoutingEvent → events() (+ filtered eventList / eventsWithPlayerList),
 *   playerDetail(player_id), gameDetail(game_id), aggregates() /
 *   playerEventCountsForGame(game_id)
 * - updatePlayerNotes → players(), playerDetail(playerId)
 */
function invalidateAfterScoutingEvent(
  queryClient: ReturnType<typeof useQueryClient>,
  input: EventInsert,
) {
  const playerId = input.player_id
  const gameId = input.game_id

  void queryClient.invalidateQueries({ queryKey: scoutingKeys.events() })

  if (playerId) {
    void queryClient.invalidateQueries({
      queryKey: scoutingKeys.eventList({ playerId }),
    })
    void queryClient.invalidateQueries({
      queryKey: scoutingKeys.eventsWithPlayerList({ playerId }),
    })
    void queryClient.invalidateQueries({
      queryKey: scoutingKeys.playerDetail(playerId),
    })
  }

  if (gameId) {
    void queryClient.invalidateQueries({
      queryKey: scoutingKeys.eventList({ gameId }),
    })
    void queryClient.invalidateQueries({
      queryKey: scoutingKeys.eventsWithPlayerList({ gameId }),
    })
    void queryClient.invalidateQueries({
      queryKey: scoutingKeys.gameDetail(gameId),
    })
    void queryClient.invalidateQueries({
      queryKey: scoutingKeys.playerEventCountsForGame(gameId),
    })
  }

  void queryClient.invalidateQueries({ queryKey: scoutingKeys.aggregates() })
}

export function useCreateScoutingEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: EventInsert) => createScoutingEvent(input),
    onSuccess: (result, variables) => {
      if (result.error || !result.data) return
      invalidateAfterScoutingEvent(queryClient, variables)
    },
  })
}

export function useUpdatePlayerNotes() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ playerId, notes }: UpdatePlayerNotesVariables) =>
      updatePlayerNotes(playerId, notes),
    onSuccess: (result, variables) => {
      if (result.error || !result.data) return
      void queryClient.invalidateQueries({ queryKey: scoutingKeys.players() })
      void queryClient.invalidateQueries({
        queryKey: scoutingKeys.playerDetail(variables.playerId),
      })
    },
  })
}