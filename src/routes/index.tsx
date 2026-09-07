import { createFileRoute, Link } from '@tanstack/react-router'
import { getDirectorySummary } from '../server/directoryLoader'

export const Route = createFileRoute('/')({
  loader: async () => {
    const summary = getDirectorySummary()
    return { summary }
  },
  component: HomePage,
})

function HomePage() {
  const { summary } = Route.useLoaderData()

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold text-slate-900">
        Hockey Ops Player Directory
      </h1>
      <p className="mt-2 text-slate-600">
        Staff landing page for roster and schedule entry points. Open Players
        for the directory list or Games for upcoming matchups.
      </p>

      <p className="mt-4 text-sm text-slate-700">
        Directory seed: {summary.playerCount} players, {summary.gameCount}{' '}
        games on file.
      </p>

      <section className="mt-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Featured players
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700">
          {summary.featuredPlayers.map((p) => (
            <li key={p.id}>
              <Link
                to="/players/$playerId"
                params={{ playerId: p.id }}
                className="font-medium underline decoration-slate-300 underline-offset-4"
              >
                #{p.number} {p.name}
              </Link>
              <span className="text-slate-500"> ({p.position})</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Upcoming games
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700">
          {summary.upcomingGames.map((g) => (
            <li key={g.id}>
              {g.date} — {g.venue === 'home' ? 'vs' : '@'} {g.opponent} (
              {g.team})
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm">
          <Link
            to="/players"
            className="font-medium underline decoration-slate-300 underline-offset-4"
          >
            Full players list
          </Link>
          {' · '}
          <Link
            to="/games"
            className="font-medium underline decoration-slate-300 underline-offset-4"
          >
            Full schedule
          </Link>
        </p>
      </section>
    </main>
  )
}
