import { createFileRoute, Link } from '@tanstack/react-router'
import {
  validateGamesSearch,
  type GamesSearch,
} from '../../lib/searchSchemas'
import { listGames } from '../../server/directoryLoader'

export const Route = createFileRoute('/games/')({
  validateSearch: (search: Record<string, unknown>): GamesSearch =>
    validateGamesSearch(search),
  loaderDeps: ({ search: { team, date } }) => ({ team, date }),
  loader: async ({ deps }) => {
    const games = listGames({
      team: deps.team,
      date: deps.date,
    })
    return { games }
  },
  component: GamesIndexPage,
})

function GamesIndexPage() {
  const { team, date } = Route.useSearch()
  const { games } = Route.useLoaderData()

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold text-slate-900">Games</h1>
      <p className="mt-2 text-slate-600">
        Schedule view shell for upcoming and recent games. Filters are
        bookmarkable search params for arena wifi staff.
      </p>

      <p className="mt-4 text-sm text-slate-700">
        Active filters: team=
        <span className="font-mono">{team === '' ? '(any)' : team}</span>, date=
        <span className="font-mono">{date === '' ? '(any)' : date}</span>
      </p>

      <nav
        aria-label="Game filters"
        className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-sm"
      >
        <Link to="/games" search={{ team: 'TOR', date }}>
          Team TOR
        </Link>
        <Link to="/games" search={{ team, date: '2026-03-20' }}>
          Date 2026-03-20
        </Link>
        <Link to="/games" search={{ team: 'TOR', date: '2026-03-20' }}>
          TOR on 2026-03-20
        </Link>
        <Link to="/games" search={{ team: '', date: '' }}>
          Clear filters
        </Link>
      </nav>

      <ul className="mt-6 list-disc space-y-2 pl-5 text-slate-700">
        {games.length === 0 ? (
          <li className="list-none text-slate-500">
            No games match these filters.
          </li>
        ) : (
          games.map((g) => (
            <li key={g.id}>
              <span className="font-medium">
                {g.date} — {g.venue === 'home' ? 'vs' : '@'} {g.opponent}
              </span>
              <span className="text-slate-500">
                {' '}
                ({g.team}, {g.status})
              </span>
            </li>
          ))
        )}
      </ul>
    </main>
  )
}
