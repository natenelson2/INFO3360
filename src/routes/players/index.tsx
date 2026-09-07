import { createFileRoute, Link } from '@tanstack/react-router'
import {
  validatePlayersSearch,
  type PlayersSearch,
} from '../../lib/searchSchemas'
import { listPlayers } from '../../server/directoryLoader'

export const Route = createFileRoute('/players/')({
  validateSearch: (search: Record<string, unknown>): PlayersSearch =>
    validatePlayersSearch(search),
  loaderDeps: ({ search: { position, status } }) => ({ position, status }),
  loader: async ({ deps }) => {
    const players = listPlayers({
      position: deps.position,
      status: deps.status,
    })
    return { players }
  },
  component: PlayersIndexPage,
})

function PlayersIndexPage() {
  const { position, status } = Route.useSearch()
  const { players } = Route.useLoaderData()

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold text-slate-900">Players</h1>
      <p className="mt-2 text-slate-600">
        Staff directory for the active roster. Open a player for a bookmarkable
        detail sheet.
      </p>

      <p className="mt-4 text-sm text-slate-700">
        Active filters: position=<span className="font-mono">{position}</span>,
        status=<span className="font-mono">{status}</span>
      </p>

      <nav
        aria-label="Player filters"
        className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-sm"
      >
        <Link to="/players" search={{ position: 'F', status }}>
          Forwards
        </Link>
        <Link to="/players" search={{ position: 'D', status }}>
          Defense
        </Link>
        <Link to="/players" search={{ position: 'G', status }}>
          Goalies
        </Link>
        <Link to="/players" search={{ position: 'all', status }}>
          All positions
        </Link>
        <Link to="/players" search={{ position, status: 'active' }}>
          Active only
        </Link>
        <Link to="/players" search={{ position, status: 'ir' }}>
          IR
        </Link>
        <Link to="/players" search={{ position: 'all', status: 'active' }}>
          Reset filters
        </Link>
      </nav>

      <ul className="mt-6 list-disc space-y-2 pl-5 text-slate-700">
        {players.length === 0 ? (
          <li className="list-none text-slate-500">
            No players match these filters.
          </li>
        ) : (
          players.map((p) => (
            <li key={p.id}>
              <Link to="/players/$playerId" params={{ playerId: p.id }}>
                #{p.number} {p.name}
              </Link>
              <span className="text-slate-500">
                {' '}
                — {p.position}, {p.status}
              </span>
            </li>
          ))
        )}
      </ul>
    </main>
  )
}
