import { createFileRoute, Link } from '@tanstack/react-router'
import { parsePlayerIdParam } from '../../lib/playerParams'

export const Route = createFileRoute('/players/$playerId')({
  params: {
    parse: (raw) => ({
      playerId: parsePlayerIdParam(raw.playerId),
    }),
    stringify: ({ playerId }) => ({
      playerId: String(playerId),
    }),
  },
  component: PlayerDetailPage,
})

function PlayerDetailPage() {
  const { playerId } = Route.useParams()

  return (
    <main>
      <p className="mb-4 text-sm">
        <Link
          to="/players"
          className="font-medium text-slate-700 underline decoration-slate-300 underline-offset-4 hover:text-slate-900"
        >
          ← Back to players
        </Link>
      </p>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        Player detail
      </h1>
      <p className="mt-2 text-slate-700">
        Bookmarkable sheet for player{' '}
        <span className="font-mono font-medium text-slate-900">{playerId}</span>
      </p>
      <p className="mt-4 text-sm text-slate-500">
        Roster fields and server-loaded stats land in a later step. This shell
        proves the path param works for hockey ops links.
      </p>
    </main>
  )
}
