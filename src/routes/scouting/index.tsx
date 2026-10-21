// src/routes/scouting/index.tsx
// Scouting notes board — loads ONLY via listScoutingNotes server function.
// No browser Supabase client. No client-sent role. RLS filters rows in Postgres.

import { createFileRoute, Link } from '@tanstack/react-router'
import { listScoutingNotes } from '../../server/scouting-notes'

export const Route = createFileRoute('/scouting/')({
  loader: async () => {
    const result = await listScoutingNotes()
    return { result }
  },
  component: ScoutingNotesPage,
})

function ScoutingNotesPage() {
  const { result } = Route.useLoaderData()

  if (!result.ok) {
    return (
      <main className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold text-slate-900">Scouting notes</h1>
        <p className="mt-4 text-slate-700" role="alert">
          {result.error.code === 'UNAUTHORIZED'
            ? 'Sign in required to view scouting notes.'
            : result.error.message}
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Error: <span className="font-mono">{result.error.code}</span>
        </p>
        <p className="mt-4 text-sm">
          <Link to="/login" className="text-sky-800 underline underline-offset-2">
            Go to staff sign-in
          </Link>
        </p>
      </main>
    )
  }

  const { notes, staff } = result

  return (
    <main className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Scouting notes</h1>
      <p className="text-sm text-slate-600">
        Rows are filtered by your staff role in the database (RLS), not by
        hiding UI. Coaching and medical accounts must see no scouting note
        bodies.
      </p>
      <p className="text-sm text-slate-700">
        Signed in as{' '}
        <span className="font-mono">{staff.email ?? staff.id}</span>
      </p>

      <p className="text-sm">
        <Link
          to="/scouting/players"
          className="text-sky-800 underline underline-offset-2"
        >
          Scout players
        </Link>
        {' · '}
        <Link to="/login" className="text-sky-800 underline underline-offset-2">
          Login / sign out
        </Link>
      </p>

      {notes.length === 0 ? (
        <p className="text-slate-600">
          No scouting notes visible for your account.
        </p>
      ) : (
        <ul className="space-y-3">
          {notes.map((note) => (
            <li
              key={note.id}
              className="rounded border border-slate-200 bg-white p-3"
            >
              <div className="font-medium text-slate-900">{note.player_name}</div>
              <p className="mt-1 text-sm text-slate-800">{note.body}</p>
              <p className="mt-2 font-mono text-xs text-slate-500">
                {note.created_at}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}