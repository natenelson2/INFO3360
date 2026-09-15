import { describe, it, expect } from 'vitest'
import {
  mapDirectoryRow,
  filterActivePeople,
  formatDisplayName,
  filterPeopleBySearch,
  type DirectoryDbRow,
} from './mappers'

// Fixtures mirror directory_entries columns the server hands the mappers—not full Supabase clients.
const activePlayer: DirectoryDbRow = {
  id: 'p-1',
  display_name: 'Avery Nguyen',
  role: 'player',
  team_name: 'Hockey Ops Practice Squad',
  position_or_title: 'C',
  is_active: true,
}

const inactiveStaff: DirectoryDbRow = {
  id: 's-9',
  display_name: 'Sam  J   Ortiz',
  role: 'staff',
  team_name: null,
  position_or_title: 'Athletic Trainer',
  is_active: false,
}

const messyNameRow: DirectoryDbRow = {
  id: 'p-2',
  display_name: '  Jordan   Lee  ',
  role: 'player',
  team_name: null,
  position_or_title: 'G',
  is_active: true,
}

const blankNameRow: DirectoryDbRow = {
  id: 'p-3',
  display_name: null,
  role: 'player',
  team_name: null,
  position_or_title: 'D',
  is_active: true,
}

describe('formatDisplayName', () => {
  // Hockey ops needs stable labels on cards and filters—no "null" text, no double spaces.
  it('returns a trimmed single-space label from display_name', () => {
    expect(formatDisplayName(messyNameRow)).toBe('Jordan Lee')
  })

  it('falls back to Unknown when display_name is missing', () => {
    expect(formatDisplayName(blankNameRow)).toBe('Unknown')
  })

  it('accepts a plain string the same way as a row', () => {
    expect(formatDisplayName('Avery Nguyen')).toBe('Avery Nguyen')
  })
})

describe('filterActivePeople', () => {
  // Inactive staff must not appear in the live directory coaches open each morning.
  it('keeps only people marked active', () => {
    const result = filterActivePeople([activePlayer, inactiveStaff])
    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe('p-1')
  })

  it('returns an empty list when every row is inactive', () => {
    expect(filterActivePeople([inactiveStaff])).toEqual([])
  })
})

describe('mapDirectoryRow', () => {
  // UI components should receive a calm, display-ready shape—not raw DB column names.
  it('maps a raw row into the directory person shape', () => {
    const person = mapDirectoryRow(activePlayer)
    expect(person).toMatchObject({
      id: 'p-1',
      displayName: 'Avery Nguyen',
      role: 'player',
      teamName: 'Hockey Ops Practice Squad',
      positionOrTitle: 'C',
      isActive: true,
    })
  })

  it('collapses messy display_name while mapping', () => {
    const person = mapDirectoryRow(inactiveStaff)
    expect(person).toMatchObject({
      id: 's-9',
      displayName: 'Sam J Ortiz',
      role: 'staff',
      isActive: false,
    })
  })

  it('returns null when role is not player or staff', () => {
    expect(
      mapDirectoryRow({
        ...activePlayer,
        role: 'referee',
      }),
    ).toBeNull()
  })
})

describe('filterPeopleBySearch', () => {
  // Arena wifi search should match names without caring about capitalization.
  it('filters mapped people by displayName case-insensitively', () => {
    const people = [
      mapDirectoryRow(activePlayer)!,
      mapDirectoryRow(messyNameRow)!,
    ]
    const result = filterPeopleBySearch(people, 'avery')
    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe('p-1')
  })

  it('returns the full list when search is empty', () => {
    const people = [mapDirectoryRow(activePlayer)!]
    expect(filterPeopleBySearch(people, '')).toEqual(people)
    expect(filterPeopleBySearch(people, null)).toEqual(people)
  })
})