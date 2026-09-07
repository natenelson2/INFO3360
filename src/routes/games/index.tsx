import { createFileRoute, Link } from '@tanstack/react-router'
import {
  validateGamesSearch,
  type GamesSearch,
} from '../../lib/searchSchemas'
import { getPlayerById, listGames } from '../../server/directoryLoader'

export const Route = createFileRoute('/games/')({
  validateSearch: (search: Record<string, unknown>): GamesSearch =>
    validateGamesSearch(search),
  loaderDeps: ({ search: { team, date, playerId } }) => ({
    team,
    date,
    playerId,
  }),
  loader: async ({ deps }) => {
    const games = listGames({
      team: deps.team,
      date: deps.date,
    })
    const contextPlayer = deps.playerId
      ? getPlayerById(deps.playerId)
      : undefined
    return {
      games,
      contextPlayer,
      contextPlayerId: deps.playerId,
    }
  },
  component: GamesIndexPage,
})

function GamesIndexPage() {
  const { team, date, playerId } = Route.useSearch()
  const { games, contextPlayer, contextPlayerId } = Route.useLoaderData()

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold text-slate-900">Games</h1>
      <p className="mt-2 text-slate-600">
        Schedule view shell for upcoming and recent games. Filters are
        bookmarkable search params for arena wifi staff.
      </p>

      {contextPlayerId ? (
        <div className="mt-4 rounded-md border border-sky-200 bg-sky-50 p-3 text-sm text-slate-800">
          <p>
            Showing games context for player{' '}
            <span className="font-mono font-medium">{contextPlayerId}</span>
            {contextPlayer ? (
              <>
                {' '}
                ({contextPlayer.name}, #{contextPlayer.number})
              </>
            ) : null}
            .
          </p>
          {contextPlayer ? (
            <p className="mt-2">
              <Link
                to="/players/$playerId"
                params={{ playerId: contextPlayer.id }}
                className="font-medium text-sky-700 underline underline-offset-2"
              >
                Back to {contextPlayer.name} detail
              </Link>
            </p>
          ) : (
            <p className="mt-2 text-slate-600">
              That player id is not on the seed roster; schedule filters below
              still apply.
            </p>
          )}
        </div>
      ) : null}

      <p className="mt-4 text-sm text-slate-700">
        Active filters: team=
        <span className="font-mono">{team === '' ? '(any)' : team}</span>, date=
        <span className="font-mono">{date === '' ? '(any)' : date}</span>
      </p>

      <nav
        aria-label="Game filters"
        className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-sm"
      >
        <Link to="/games" search={{ team: 'TOR', date, playerId }}>
          Team TOR
        </Link>
        <Link to="/games" search={{ team, date: '2026-03-20', playerId }}>
          Date 2026-03-20
        </Link>
        <Link
          to="/games"
          search={{ team: 'TOR', date: '2026-03-20', playerId }}
        >
          TOR on 2026-03-20
        </Link>
        <Link to="/games" search={{ team: '', date: '', playerId: '' }}>
          Clear filters
        </Link>
      </nav>

      {games.length === 0 ? (
        <div className="mt-6 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-medium text-slate-900">No games match</p>
          <p className="mt-1">
            Nothing on the seed schedule fits these team/date filters. Clear
            filters or try another club code / date.
          </p>
          <p className="mt-3">
            <Link
              to="/games"
              search={{ team: '', date: '', playerId }}
              className="font-medium text-sky-700 underline underline-offset-2"
            >
              Show all games
            </Link>
          </p>
        </div>
      ) : (
        <ul className="mt-6 list-disc space-y-2 pl-5 text-slate-700">
          {games.map((g) => (
            <li key={g.id}>
              <span className="font-medium">
                {g.date} — {g.venue === 'home' ? 'vs' : '@'} {g.opponent}
              </span>
              <span className="text-slate-500">
                {' '}
                ({g.team}, {g.status})
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
