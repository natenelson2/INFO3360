// Shared, type-safe search (query) param rules for list pages.
// Path params identify ONE player; search params only FILTER lists.
// See docs/requirements-brief.md and docs/params-design-notes.md.

export type PlayerPosition = 'F' | 'D' | 'G' | 'all'
export type RosterStatus = 'active' | 'ir' | 'all'

export type PlayersSearch = {
  position: PlayerPosition
  status: RosterStatus
}

export type GamesSearch = {
  /** Empty string or club code, e.g. "TOR" */
  team: string
  /** Empty string or YYYY-MM-DD */
  date: string
}

const PLAYER_POSITIONS = new Set(['F', 'D', 'G', 'all'])
const ROSTER_STATUSES = new Set(['active', 'ir', 'all'])

/** Defaults when the URL has no query string. */
export const defaultPlayersSearch = (): PlayersSearch => ({
  position: 'all',
  status: 'active',
})

export const defaultGamesSearch = (): GamesSearch => ({
  team: '',
  date: '',
})

/**
 * Coerce unknown URL search into a safe PlayersSearch.
 * Unknown keys are ignored; bad values fall back to defaults (never throws).
 */
export function validatePlayersSearch(
  raw: Record<string, unknown>,
): PlayersSearch {
  const defaults = defaultPlayersSearch()
  const position =
    typeof raw.position === 'string' && PLAYER_POSITIONS.has(raw.position)
      ? (raw.position as PlayerPosition)
      : defaults.position
  const status =
    typeof raw.status === 'string' && ROSTER_STATUSES.has(raw.status)
      ? (raw.status as RosterStatus)
      : defaults.status
  return { position, status }
}

/**
 * Coerce unknown URL search into a safe GamesSearch.
 * Unknown keys are ignored; bad values fall back to defaults (never throws).
 */
export function validateGamesSearch(raw: Record<string, unknown>): GamesSearch {
  const defaults = defaultGamesSearch()
  const team =
    typeof raw.team === 'string' ? raw.team.trim().toUpperCase() : defaults.team
  const dateRaw = typeof raw.date === 'string' ? raw.date.trim() : ''
  const date = /^\d{4}-\d{2}-\d{2}$/.test(dateRaw) ? dateRaw : defaults.date
  return { team, date }
}
