// Small shared helpers so routes don't re-invent param rules.

export type PlayerIdParam = string

/** Accept a non-empty trimmed string as a player id for this sprint. */
export function parsePlayerIdParam(value: unknown): PlayerIdParam {
  if (typeof value !== 'string') {
    throw new Error('playerId must be a string')
  }
  const trimmed = value.trim()
  if (!trimmed) {
    throw new Error('playerId must not be empty')
  }
  return trimmed
}

export function playerDetailPath(playerId: PlayerIdParam): string {
  return `/players/${encodeURIComponent(playerId)}`
}
