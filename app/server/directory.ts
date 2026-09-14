// app/server/directory.ts
// SERVER-ONLY module. Do NOT import this from client routes or browser components.
// Secrets stay behind getSupabaseServerClient() / getServerEnv(); this file never
// reads service-role keys from import.meta.env or returns env values to callers.

import { createServerFn } from '@tanstack/react-start'
import { getSupabaseServerClient } from '../lib/supabase.server'

/** UI-facing directory row (see docs/server-function-contract.md). */
export type DirectoryEntry = {
  id: string
  displayName: string
  role: 'player' | 'staff'
  teamName: string | null
  positionOrTitle: string | null
  isActive: boolean
}

export type GetDirectoryEntriesInput = {
  search?: string
  role?: string
  limit?: number
}

export type GetDirectoryEntriesResult = {
  ok: true
  entries: DirectoryEntry[]
  meta: {
    count: number
    appliedFilters: { search: string | null; role: string | null }
  }
}

export type GetDirectoryEntriesError = {
  ok: false
  error: {
    code: 'VALIDATION' | 'UNAUTHORIZED' | 'NOT_FOUND' | 'UPSTREAM' | 'UNKNOWN'
    message: string
  }
}

export type GetDirectoryEntriesResponse =
  | GetDirectoryEntriesResult
  | GetDirectoryEntriesError

type NormalizedDirectoryInputs = {
  search: string | null
  role: 'player' | 'staff' | null
  limit: number
}

/**
 * Raw row shape expected from the `directory_entries` table/view.
 * Column names are the server mapping target; adjust if your Supabase schema differs.
 */
type DirectoryDbRow = {
  id: string
  display_name: string | null
  role: string | null
  team_name: string | null
  position_or_title: string | null
  is_active: boolean | null
}

// ---------------------------------------------------------------------------
// Pure helpers (no network, no env) — identifiable for later Vitest extraction
// ---------------------------------------------------------------------------

/** Normalize/validate caller inputs per the contract. */
export function normalizeDirectoryInputs(
  raw: GetDirectoryEntriesInput | undefined,
):
  | { ok: true; value: NormalizedDirectoryInputs }
  | { ok: false; error: GetDirectoryEntriesError['error'] } {
  const searchTrimmed =
    typeof raw?.search === 'string' ? raw.search.trim() : ''
  const search = searchTrimmed.length > 0 ? searchTrimmed : null

  const roleRaw =
    typeof raw?.role === 'string' ? raw.role.trim().toLowerCase() : ''
  let role: 'player' | 'staff' | null = null
  if (roleRaw === 'player' || roleRaw === 'staff') {
    role = roleRaw
  } else if (roleRaw !== '') {
    return {
      ok: false,
      error: {
        code: 'VALIDATION',
        message:
          'Invalid role: expected "player", "staff", or empty.',
      },
    }
  }

  let limit = 100
  if (raw?.limit !== undefined && raw?.limit !== null) {
    if (typeof raw.limit !== 'number' || Number.isNaN(raw.limit)) {
      return {
        ok: false,
        error: {
          code: 'VALIDATION',
          message: 'Invalid limit: expected a number between 1 and 200.',
        },
      }
    }
    limit = Math.min(200, Math.max(1, Math.floor(raw.limit)))
  }

  return { ok: true, value: { search, role, limit } }
}

/** Map one DB row → DirectoryEntry (pure). */
export function mapDirectoryRow(row: DirectoryDbRow): DirectoryEntry | null {
  if (!row?.id) return null
  const role = row.role === 'player' || row.role === 'staff' ? row.role : null
  if (!role) return null

  return {
    id: String(row.id),
    displayName: (row.display_name ?? '').trim() || 'Unknown',
    role,
    teamName: row.team_name ?? null,
    positionOrTitle: row.position_or_title ?? null,
    isActive: Boolean(row.is_active),
  }
}

/** Case-insensitive displayName filter (pure; used if not fully pushed to SQL). */
export function filterEntriesBySearch(
  entries: DirectoryEntry[],
  search: string | null,
): DirectoryEntry[] {
  if (!search) return entries
  const needle = search.toLowerCase()
  return entries.filter((e) => e.displayName.toLowerCase().includes(needle))
}

function fail(
  code: GetDirectoryEntriesError['error']['code'],
  message: string,
): GetDirectoryEntriesError {
  return { ok: false, error: { code, message } }
}

/**
 * Loads Hockey Operations Directory rows on the server.
 * Call from route loaders / UI later; never ship secrets to the browser.
 *
 * Table: `directory_entries` (id, display_name, role, team_name,
 * position_or_title, is_active). Empty list is still `{ ok: true }`.
 */
export const getDirectoryEntries = createServerFn({ method: 'GET' })
  .validator((data: GetDirectoryEntriesInput | undefined) => data ?? {})
  .handler(async ({ data }): Promise<GetDirectoryEntriesResponse> => {
    const normalized = normalizeDirectoryInputs(data)
    if (!normalized.ok) {
      return { ok: false, error: normalized.error }
    }

    const { search, role, limit } = normalized.value
    const appliedFilters = { search, role }

    try {
      const supabase = getSupabaseServerClient()

      // Trusted read via server-only client (service role stays in getServerEnv).
      let query = supabase
        .from('directory_entries')
        .select(
          'id, display_name, role, team_name, position_or_title, is_active',
        )
        .order('display_name', { ascending: true })
        .limit(limit)

      if (role) {
        query = query.eq('role', role)
      }
      if (search) {
        // PostgREST ilike; still re-filter in pure helper as a safety net.
        query = query.ilike('display_name', `%${search}%`)
      }

      const { data: rows, error } = await query

      if (error) {
        // Log details server-side only — never return the raw Supabase error.
        console.error('[getDirectoryEntries] Supabase error:', error.message)
        return fail(
          'UPSTREAM',
          'Directory temporarily unavailable.',
        )
      }

      const mapped = (rows ?? [])
        .map((row) => mapDirectoryRow(row as DirectoryDbRow))
        .filter((row): row is DirectoryEntry => row !== null)

      const entries = filterEntriesBySearch(mapped, search)

      return {
        ok: true,
        entries,
        meta: {
          count: entries.length,
          appliedFilters,
        },
      }
    } catch (err) {
      // Missing env, network blow-ups, etc. — safe message only.
      console.error(
        '[getDirectoryEntries] Unexpected failure:',
        err instanceof Error ? err.message : 'unknown',
      )
      return fail('UNKNOWN', 'Directory temporarily unavailable.')
    }
  })
