import { createFileRoute, Link } from '@tanstack/react-router'
import {
  validateGamesSearch,
  type GamesSearch,
} from '../../lib/searchSchemas'

export const Route = createFileRoute('/games/')({
  validateSearch: (search: Record<string, unknown>): GamesSearch =>
    validateGamesSearch(search),
  component: GamesIndexPage,
})

function GamesIndexPage() {
  const { team, date } = Route.useSearch()

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

      <nav aria-label="Game filters" className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-sm">
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

      <p className="mt-6 rounded-md bg-slate-100 p-3 text-sm text-slate-700">
        Placeholder: no game rows loaded yet. Seed schedule data arrives in a
        later step.
      </p>
    </main>
  )
}
