import {
  seedGames,
  seedPlayers,
  type SeedGame,
  type SeedPlayer,
} from '../data/hockeySeed'
import type {
  PlayerPosition,
  RosterStatus,
} from '../lib/searchSchemas'

export type ListPlayersFilters = {
  position?: PlayerPosition
  status?: RosterStatus
  q?: string
}

export type ListGamesFilters = {
  team?: string
  date?: string
  venue?: 'home' | 'away'
}

export type DirectorySummary = {
  playerCount: number
  gameCount: number
  upcomingGames: SeedGame[]
  featuredPlayers: SeedPlayer[]
}

/** Server-side roster listing; maps validated search filters when present. */
export function listPlayers(filters?: ListPlayersFilters): SeedPlayer[] {
  let rows = [...seedPlayers]

  if (filters?.q) {
    const q = filters.q.toLowerCase()
    rows = rows.filter((p) => p.name.toLowerCase().includes(q))
  }

  if (filters?.position && filters.position !== 'all') {
    rows = rows.filter((p) => p.position === filters.position)
  }

  if (filters?.status && filters.status !== 'all') {
    rows = rows.filter((p) => p.status === filters.status)
  }

  return rows
}

export function getPlayerById(playerId: string): SeedPlayer | undefined {
  return seedPlayers.find((p) => p.id === playerId)
}

/** Server-side schedule listing; maps validated search filters when present. */
export function listGames(filters?: ListGamesFilters): SeedGame[] {
  let rows = [...seedGames]

  if (filters?.team) {
    const team = filters.team.trim().toUpperCase()
    if (team) {
      rows = rows.filter((g) => g.team === team)
    }
  }

  if (filters?.date) {
    rows = rows.filter((g) => g.date === filters.date)
  }

  if (filters?.venue) {
    rows = rows.filter((g) => g.venue === filters.venue)
  }

  return rows
}

export function getDirectorySummary(): DirectorySummary {
  const upcomingGames = seedGames
    .filter((g) => g.status === 'scheduled')
    .slice(0, 3)
  const featuredPlayers = seedPlayers.filter((p) => p.status === 'active').slice(0, 4)

  return {
    playerCount: seedPlayers.length,
    gameCount: seedGames.length,
    upcomingGames,
    featuredPlayers,
  }
}
