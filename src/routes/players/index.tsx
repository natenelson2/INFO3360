import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/players/')({
  component: PlayersIndexPage,
})

const demoPlayers = [
  { id: '42', name: 'Avery Skater' },
  { id: '7', name: 'Riley Goalie' },
  { id: '19', name: 'Jordan Winger' },
]

function PlayersIndexPage() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold text-slate-900">Players</h1>
      <p className="mt-2 text-slate-600">
        Staff directory for the active roster. Open a player for a bookmarkable
        detail sheet.
      </p>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-700">
        {demoPlayers.map((p) => (
          <li key={p.id}>
            <Link to="/players/$playerId" params={{ playerId: p.id }}>
              {p.name}
            </Link>
            <span className="text-slate-500"> — #{p.id}</span>
          </li>
        ))}
      </ul>
    </main>
  )
}
