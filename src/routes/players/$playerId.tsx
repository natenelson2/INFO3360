import { createFileRoute, Link } from '@tanstack/react-router'
import { NotFoundPlayer } from '../../components/NotFoundPlayer'
import { parsePlayerIdParam } from '../../lib/playerParams'
import { getPlayerById } from '../../server/directoryLoader'

export const Route = createFileRoute('/players/$playerId')({
  params: {
    parse: (raw) => ({
      playerId: parsePlayerIdParam(raw.playerId),
    }),
    stringify: ({ playerId }) => ({
      playerId: String(playerId),
    }),
  },
  loader: async ({ params }) => {
    const player = getPlayerById(params.playerId)
    return { player, playerId: params.playerId }
  },
  component: PlayerDetailPage,
})

function PlayerDetailPage() {
  const { player, playerId } = Route.useLoaderData()

  return (
    <main className="mx-auto max-w-3xl p-6">
      <p className="mb-4 text-sm">
        <Link
          to="/players"
          className="font-medium text-slate-700 underline decoration-slate-300 underline-offset-4 hover:text-slate-900"
        >
          ← Back to players
        </Link>
      </p>

      {player ? (
        <>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            #{player.number} {player.name}
          </h1>
          <p className="mt-2 text-slate-700">
            Bookmarkable sheet for player{' '}
            <span className="font-mono font-medium text-slate-900">
              {player.id}
            </span>
          </p>
          <dl className="mt-4 space-y-1 text-sm text-slate-700">
            <div>
              <dt className="inline font-medium">Position: </dt>
              <dd className="inline">{player.position}</dd>
            </div>
            <div>
              <dt className="inline font-medium">Roster status: </dt>
              <dd className="inline">{player.status}</dd>
            </div>
            <div>
              <dt className="inline font-medium">Team: </dt>
              <dd className="inline">{player.team}</dd>
            </div>
          </dl>
          <p className="mt-6 text-sm">
            <Link
              to="/games"
              search={{ team: '', date: '', playerId: player.id }}
              className="font-medium text-sky-700 underline underline-offset-2"
            >
              View schedule (context: {player.name} / {player.id})
            </Link>
          </p>
        </>
      ) : (
        <NotFoundPlayer playerId={playerId} />
      )}
    </main>
  )
}
