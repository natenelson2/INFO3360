// src/routes/scouting/aggregates.tsx
// Read-only per-game summary from usePlayerEventCountsForGame (RPC-backed).
// No Supabase client in this route.

import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useGames, usePlayerEventCountsForGame } from '../../lib/scouting/hooks'

export const Route = createFileRoute('/scouting/aggregates')({
  component: AggregatesPage,
})

function AggregatesPage() {
  const gamesQuery = useGames()
  const [gameId, setGameId] = useState('')
  const { data, isLoading, isError, error, isFetching } =
    usePlayerEventCountsForGame(gameId || undefined)

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-900">Player aggregates</h1>
      <p className="mt-2 text-slate-600">
        Set-based per-player event totals for one game (RPC).
      </p>
      <p className="mt-2 text-sm">
        <Link
          to="/scouting/players"
          className="text-sky-800 underline underline-offset-2"
        >
          Players
        </Link>
        {' · '}
        <Link to="/scouting/events" className="text-sky-800 underline underline-offset-2">
          Events
        </Link>
      </p>

      <label className="mt-4 flex max-w-md flex-col gap-1 text-sm">
        Game
        <select
          className="rounded border border-slate-300 bg-white px-2 py-1"
          value={gameId}
          onChange={(e) => setGameId(e.target.value)}
        >
          <option value="">Select a game</option>
          {(gamesQuery.data ?? []).map((game) => (
            <option key={game.id} value={game.id}>
              {game.opponent ?? 'Game'}
              {game.season ? ` · ${game.season}` : ''}
            </option>
          ))}
        </select>
      </label>

      {!gameId && (
        <p className="mt-4 text-slate-600">
          Choose a game to load aggregate rows.
        </p>
      )}

      {gameId && isLoading && (
        <p className="mt-4 text-slate-600">Loading aggregates…</p>
      )}

      {gameId && isError && (
        <p className="mt-4 text-slate-700" role="alert">
          Could not load aggregates: {error.message}
        </p>
      )}

      {gameId && !isLoading && !isError && !data?.length && (
        <p className="mt-4 text-slate-600">
          No aggregate rows yet for this game.
          {isFetching ? ' Refreshing…' : ''}
        </p>
      )}

      {!!data?.length && (
        <table className="mt-4 w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-300">
              <th className="py-2 pr-3 font-semibold">Player</th>
              <th className="py-2 pr-3 font-semibold">Goals</th>
              <th className="py-2 font-semibold">Events</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.player_id} className="border-b border-slate-200">
                <td className="py-2 pr-3">
                  {row.player_name ?? row.player_id}
                </td>
                <td className="py-2 pr-3">{row.goal_count}</td>
                <td className="py-2">{row.event_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}