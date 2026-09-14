// app/routes/directory.tsx
// Loads the Hockey Operations Directory through the server function only.
// Do NOT import app/lib/supabase.server.ts or read service-role / secret env here.

import { createFileRoute, Link } from '@tanstack/react-router'
import {
  getDirectoryEntries,
  type DirectoryEntry,
  type GetDirectoryEntriesResponse,
} from '../server/directory'

// PAUL deliverable path. Runtime route tree is generated from src/routes/directory.tsx.
export const Route = createFileRoute('/directory')({
  // Server path: invoke getDirectoryEntries (RPC stub on the client; body runs on server).
  loader: async (): Promise<{ result: GetDirectoryEntriesResponse }> => {
    const result = await getDirectoryEntries({ data: {} })
    return { result }
  },
  pendingComponent: DirectoryPending,
  component: DirectoryPage,
})

function DirectoryPending() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-900">
        Hockey Operations Directory
      </h1>
      <p className="mt-4 text-slate-600">Loading directory…</p>
    </div>
  )
}

function DirectoryPage() {
  const { result } = Route.useLoaderData()

  if (!result.ok) {
    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold text-slate-900">
          Hockey Operations Directory
        </h1>
        <p className="mt-4 text-slate-700" role="alert">
          {result.error.message}
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Error code: <span className="font-mono">{result.error.code}</span>
        </p>
        <p className="mt-4 text-sm">
          <Link to="/" className="text-sky-800 underline underline-offset-2">
            Back to home
          </Link>
        </p>
      </div>
    )
  }

  const { entries } = result

  if (entries.length === 0) {
    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold text-slate-900">
          Hockey Operations Directory
        </h1>
        <p className="mt-4 text-slate-600">No directory entries found.</p>
        <p className="mt-2 text-sm text-slate-500">
          Showing {result.meta.count} row
          {result.meta.count === 1 ? '' : 's'} from the server function.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-900">
        Hockey Operations Directory
      </h1>
      <p className="mt-2 text-slate-600">
        Staff directory loaded through the server function (no browser secrets).
      </p>
      <p className="mt-2 text-sm text-slate-500">
        {result.meta.count} entr{result.meta.count === 1 ? 'y' : 'ies'}
      </p>

      <ul className="mt-6 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
        {entries.map((entry: DirectoryEntry) => (
          <li
            key={entry.id}
            className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <span className="font-medium text-slate-900">
                {entry.displayName}
              </span>
              {entry.positionOrTitle ? (
                <span className="mt-0.5 block text-sm text-slate-500">
                  {entry.positionOrTitle}
                </span>
              ) : null}
            </div>
            <span className="text-sm text-slate-600">
              {entry.role}
              {entry.teamName ? ` · ${entry.teamName}` : ''}
              {!entry.isActive ? ' · inactive' : ''}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}