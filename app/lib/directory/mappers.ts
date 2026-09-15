// app/lib/directory/mappers.ts
// Pure directory helpers only — no Supabase, no fetch, no env reads.
// Safe to unit-test with Vitest using plain fixture objects.

/** Raw row shape from `directory_entries` (snake_case DB columns). */
export type DirectoryDbRow = {
  id: string
  display_name: string | null
  role: string | null
  team_name: string | null
  position_or_title: string | null
  is_active: boolean | null
}

/** UI-facing directory person (camelCase, display-ready). */
export type DirectoryPerson = {
  id: string
  displayName: string
  role: 'player' | 'staff'
  teamName: string | null
  positionOrTitle: string | null
  isActive: boolean
}

/**
 * Build a stable card/filter label from a DB display_name.
 * Hockey ops boards must never show the literal words "null"/"undefined"
 * or awkward double spaces when the roster sheet is messy.
 */
export function formatDisplayName(
  row: Pick<DirectoryDbRow, 'display_name'> | string | null | undefined,
): string {
  const raw =
    typeof row === 'string'
      ? row
      : row && typeof row === 'object'
        ? row.display_name
        : null

  const cleaned = String(raw ?? '')
    .replace(/\s+/g, ' ')
    .trim()

  return cleaned.length > 0 ? cleaned : 'Unknown'
}

/**
 * Keep only people marked active in the source row.
 * Morning directory views for coaches should hide inactive staff/players.
 */
export function filterActivePeople<T extends { is_active: boolean | null }>(
  people: T[],
): T[] {
  return people.filter((person) => person.is_active === true)
}

/**
 * Map one raw DB row into the calm UI person shape.
 * Returns null when id/role are missing or role is not player|staff
 * so bad rows never reach the directory list.
 */
export function mapDirectoryRow(row: DirectoryDbRow): DirectoryPerson | null {
  if (!row?.id) return null

  const role = row.role === 'player' || row.role === 'staff' ? row.role : null
  if (!role) return null

  return {
    id: String(row.id),
    displayName: formatDisplayName(row),
    role,
    teamName: row.team_name ?? null,
    positionOrTitle: row.position_or_title ?? null,
    isActive: Boolean(row.is_active),
  }
}

/**
 * Case-insensitive displayName filter for in-memory lists.
 * Used when search is not fully pushed down to SQL yet.
 */
export function filterPeopleBySearch(
  people: DirectoryPerson[],
  search: string | null | undefined,
): DirectoryPerson[] {
  const needle = typeof search === 'string' ? search.trim().toLowerCase() : ''
  if (!needle) return people
  return people.filter((person) =>
    person.displayName.toLowerCase().includes(needle),
  )
}