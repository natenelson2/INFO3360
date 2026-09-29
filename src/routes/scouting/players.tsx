// src/routes/scouting/players.tsx
// Thin route: roster list + position/teamName filters from the requirements brief.
// Data only via usePlayers — no Supabase client here.

import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { usePlayers } from '../../lib/scouting/hooks'

export const Route = createFileRoute('/scouting/players')({
  component: PlayersPage,
})

function PlayersPage() {
  const [position, setPosition] = useState('')
  const [teamName, setTeamName] = useState('')

  const filters = {
    ...(position ? { position } : {}),
    ...(teamName.trim() ? { teamName: teamName.trim() } : {}),
  }

  const { data, isLoading, isError, error } = usePlayers(filters)

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-900">Scouting players</h1>
      <p className="mt-2 text-slate-600">
        Roster list for scout filters (position, team name).
      </p>
      <p className="mt-2 text-sm">
        <Link to="/scouting/events" className="text-sky-800 underline underline-offset-2">
          Events
        </Link>
        {' · '}
        <Link
          to="/scouting/aggregates"
          className="text-sky-800 underline underline-offset-2"
        >
          Aggregates
        </Link>
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-4 text-sm">
        <label className="flex flex-col gap-1">
          Position
          <select
            className="rounded border border-slate-300 bg-white px-2 py-1"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
          >
            <option value="">All</option>
            <option value="F">Forward</option>
            <option value="D">Defense</option>
            <option value="G">Goalie</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          Team name
          <input
            className="rounded border border-slate-300 bg-white px-2 py-1"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="Optional"
          />
        </label>
      </div>

      {isLoading && <p className="mt-4 text-slate-600">Loading players…</p>}

      {isError && (
        <p className="mt-4 text-slate-700" role="alert">
          Could not load players: {error.message}
        </p>
      )}

      {!isLoading && !isError && !data?.length && (
        <p className="mt-4 text-slate-600">No players match this filter.</p>
      )}

      {!!data?.length && (
        <ul className="mt-4 list-disc space-y-1 pl-5 text-slate-800">
          {data.map((player) => (
            <li key={player.id}>
              {player.full_name}
              {player.position ? ` - ${player.position}` : ''}
              {player.team_name ? ` (${player.team_name})` : ''}
              <span className="ml-2 font-mono text-xs text-slate-500">
                {player.id}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}