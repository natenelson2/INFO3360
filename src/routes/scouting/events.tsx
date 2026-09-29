// src/routes/scouting/events.tsx
// List board events + minimal create form via useCreateScoutingEvent.
// No Supabase client in this route.

import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
import { useEventsWithPlayer, useGames, usePlayers } from '../../lib/scouting/hooks'
import { useCreateScoutingEvent } from '../../lib/scouting/mutation-hooks'

export const Route = createFileRoute('/scouting/events')({
  component: EventsPage,
})

function EventsPage() {
  const { data, isLoading, isError, error } = useEventsWithPlayer()
  const playersQuery = usePlayers()
  const gamesQuery = useGames()
  const createEvent = useCreateScoutingEvent()

  const [playerId, setPlayerId] = useState('')
  const [gameId, setGameId] = useState('')
  const [eventType, setEventType] = useState('goal')
  const [formMessage, setFormMessage] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setFormMessage(null)
    setFormError(null)

    const result = await createEvent.mutateAsync({
      player_id: playerId,
      game_id: gameId,
      event_type: eventType,
    })

    if (result.error || !result.data) {
      setFormError(result.error?.message ?? 'Save failed.')
      return
    }

    setFormMessage('Event saved. Lists and aggregates should refresh.')
    setPlayerId('')
    setGameId('')
    setEventType('goal')
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-900">Scouting events</h1>
      <p className="mt-2 text-slate-600">
        Log a board event, then confirm lists refresh via cache invalidation.
      </p>
      <p className="mt-2 text-sm">
        <Link
          to="/scouting/players"
          className="text-sky-800 underline underline-offset-2"
        >
          Players
        </Link>
        {' · '}
        <Link
          to="/scouting/aggregates"
          className="text-sky-800 underline underline-offset-2"
        >
          Aggregates
        </Link>
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-4 flex flex-col gap-3 rounded border border-slate-200 bg-white p-4 text-sm"
      >
        <label className="flex flex-col gap-1">
          Player
          <select
            className="rounded border border-slate-300 bg-white px-2 py-1"
            value={playerId}
            onChange={(e) => setPlayerId(e.target.value)}
            required
          >
            <option value="">Select player</option>
            {(playersQuery.data ?? []).map((player) => (
              <option key={player.id} value={player.id}>
                {player.full_name}
                {player.position ? ` (${player.position})` : ''}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          Game
          <select
            className="rounded border border-slate-300 bg-white px-2 py-1"
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
            required
          >
            <option value="">Select game</option>
            {(gamesQuery.data ?? []).map((game) => (
              <option key={game.id} value={game.id}>
                {game.opponent ?? 'Game'}
                {game.season ? ` · ${game.season}` : ''}
                {game.played_at ? ` · ${game.played_at}` : ''}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          Type
          <select
            className="rounded border border-slate-300 bg-white px-2 py-1"
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
          >
            <option value="goal">goal</option>
            <option value="shot">shot</option>
            <option value="hit">hit</option>
          </select>
        </label>

        <button
          type="submit"
          disabled={createEvent.isPending}
          className="w-fit rounded bg-sky-800 px-3 py-1.5 text-white disabled:opacity-60"
        >
          {createEvent.isPending ? 'Saving…' : 'Log event'}
        </button>

        {formError && (
          <p role="alert" className="text-slate-700">
            Save failed: {formError}
          </p>
        )}
        {formMessage && <p className="text-slate-700">{formMessage}</p>}
      </form>

      {isLoading && <p className="mt-4 text-slate-600">Loading events…</p>}

      {isError && (
        <p className="mt-4 text-slate-700" role="alert">
          Could not load events: {error.message}
        </p>
      )}

      {!isLoading && !isError && !data?.length && (
        <p className="mt-4 text-slate-600">No events yet.</p>
      )}

      {!!data?.length && (
        <ul className="mt-4 list-disc space-y-1 pl-5 text-slate-800">
          {data.map((event) => (
            <li key={event.id}>
              {event.event_type ?? 'event'}
              {' - '}
              {event.player?.full_name ?? `player ${event.player_id}`}
              {' (game '}
              {event.game_id}
              {')'}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}