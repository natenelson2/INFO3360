export type SeedPlayer = {
  id: string
  name: string
  position: 'F' | 'D' | 'G'
  number: number
  team: string
  status: 'active' | 'ir'
}

export type SeedGame = {
  id: string
  opponent: string
  /** Club code used by games search filters (e.g. TOR). */
  team: string
  date: string // ISO date YYYY-MM-DD
  venue: 'home' | 'away'
  status: 'scheduled' | 'final'
}

export const seedPlayers: SeedPlayer[] = [
  {
    id: 'p-17',
    name: 'Alex Mercer',
    position: 'F',
    number: 17,
    team: 'Home Club',
    status: 'active',
  },
  {
    id: 'p-4',
    name: 'Jordan Lee',
    position: 'D',
    number: 4,
    team: 'Home Club',
    status: 'active',
  },
  {
    id: 'p-30',
    name: 'Sam Ortiz',
    position: 'G',
    number: 30,
    team: 'Home Club',
    status: 'active',
  },
  {
    id: 'p-9',
    name: 'Riley Chen',
    position: 'F',
    number: 9,
    team: 'Home Club',
    status: 'active',
  },
  {
    id: 'p-22',
    name: 'Casey Brooks',
    position: 'D',
    number: 22,
    team: 'Home Club',
    status: 'ir',
  },
  {
    id: 'p-11',
    name: 'Morgan Hale',
    position: 'F',
    number: 11,
    team: 'Home Club',
    status: 'active',
  },
]

export const seedGames: SeedGame[] = [
  {
    id: 'g-1',
    opponent: 'North Bay',
    team: 'NBY',
    date: '2026-03-14',
    venue: 'home',
    status: 'scheduled',
  },
  {
    id: 'g-2',
    opponent: 'Toronto',
    team: 'TOR',
    date: '2026-03-20',
    venue: 'away',
    status: 'scheduled',
  },
  {
    id: 'g-3',
    opponent: 'Lakeside',
    team: 'LKS',
    date: '2026-03-02',
    venue: 'home',
    status: 'final',
  },
  {
    id: 'g-4',
    opponent: 'River City',
    team: 'RVC',
    date: '2026-03-18',
    venue: 'away',
    status: 'scheduled',
  },
]
