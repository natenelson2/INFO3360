// In-app store for provider game events.
// Follows docs/ingestion/storage-rule.md — one providerEventId → one stored event.
// Exact replay: no second insert. Late correction: update facts on the same row.
// New keys are kept even if they arrive out of order. Failed writes never claim success.

import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import type { EventPayload } from '../validation/event-payload'

export type StoredGameEvent = EventPayload & {
  eventId: string
}

export type SaveGameEventResult =
  | { ok: true; kind: 'created' | 'replay' | 'corrected'; event: StoredGameEvent }
  | { ok: false; reason: 'write_failed'; message: string }

const STORE_PATH = resolve(process.cwd(), '.data/ingested-game-events.json')

type StoreFile = {
  byProviderEventId: Record<string, StoredGameEvent>
}

let memory: Map<string, StoredGameEvent> | null = null

/** Test/demo hook: force the next save attempt to fail (cleared after use). */
let failNextWrite = false

function loadMemory(): Map<string, StoredGameEvent> {
  if (memory) return memory
  memory = new Map()
  try {
    if (existsSync(STORE_PATH)) {
      const raw = readFileSync(STORE_PATH, 'utf8')
      const parsed = JSON.parse(raw) as StoreFile
      for (const [key, event] of Object.entries(parsed.byProviderEventId ?? {})) {
        memory.set(key, event)
      }
    }
  } catch {
    // Start empty if the file is missing or unreadable — do not invent events.
  }
  return memory
}

function persist(map: Map<string, StoredGameEvent>): void {
  const payload: StoreFile = { byProviderEventId: {} }
  for (const [key, event] of map.entries()) {
    payload.byProviderEventId[key] = event
  }
  mkdirSync(dirname(STORE_PATH), { recursive: true })
  writeFileSync(STORE_PATH, JSON.stringify(payload, null, 2), 'utf8')
}

function sameFacts(a: EventPayload, b: EventPayload): boolean {
  return (
    a.period === b.period &&
    a.who === b.who &&
    a.what === b.what &&
    a.when === b.when
  )
}

export function getStoredGameEvent(
  providerEventId: string,
): StoredGameEvent | undefined {
  return loadMemory().get(providerEventId)
}

export function listStoredGameEvents(): StoredGameEvent[] {
  return Array.from(loadMemory().values())
}

export function countStoredGameEvents(): number {
  return loadMemory().size
}

/** How many stored rows look like a goal for this player (who). */
export function countGoalsForPlayer(who: string): number {
  return listStoredGameEvents().filter(
    (e) => e.who === who && e.what.toLowerCase() === 'goal',
  ).length
}

export function armWriteFailureForNextSave(): void {
  failNextWrite = true
}

export function clearGameEventStore(): void {
  memory = new Map()
  failNextWrite = false
  try {
    if (existsSync(STORE_PATH)) {
      writeFileSync(
        STORE_PATH,
        JSON.stringify({ byProviderEventId: {} }, null, 2),
        'utf8',
      )
    }
  } catch {
    // Ignore cleanup failures in ephemeral environments.
  }
}

/**
 * Save one validated game event using providerEventId as the idempotency key.
 */
export function saveGameEvent(payload: EventPayload): SaveGameEventResult {
  const map = loadMemory()

  if (failNextWrite) {
    failNextWrite = false
    return {
      ok: false,
      reason: 'write_failed',
      message: 'Event was not stored. Do not treat this as saved.',
    }
  }

  const existing = map.get(payload.providerEventId)

  try {
    if (existing) {
      if (sameFacts(existing, payload)) {
        // Exact replay — stats unchanged, no second insert.
        return { ok: true, kind: 'replay', event: existing }
      }
      // Late correction — still one event; facts match the new version.
      const corrected: StoredGameEvent = {
        ...existing,
        period: payload.period,
        who: payload.who,
        what: payload.what,
        when: payload.when,
      }
      map.set(payload.providerEventId, corrected)
      persist(map)
      return { ok: true, kind: 'corrected', event: corrected }
    }

    // New key — keep it even if it arrives after a later moment was already saved.
    const created: StoredGameEvent = {
      eventId: `evt-${payload.providerEventId}`,
      providerEventId: payload.providerEventId,
      period: payload.period,
      who: payload.who,
      what: payload.what,
      when: payload.when,
    }
    map.set(payload.providerEventId, created)
    persist(map)
    return { ok: true, kind: 'created', event: created }
  } catch {
    return {
      ok: false,
      reason: 'write_failed',
      message: 'Event was not stored. Do not treat this as saved.',
    }
  }
}

/**
 * Partial batch helper: save each event once; report which keys saved and which failed.
 * Does not call the whole batch a success when some writes fail.
 */
export function saveGameEventBatch(payloads: EventPayload[]): {
  saved: StoredGameEvent[]
  failed: Array<{ providerEventId: string; message: string }>
} {
  const saved: StoredGameEvent[] = []
  const failed: Array<{ providerEventId: string; message: string }> = []

  for (const payload of payloads) {
    const result = saveGameEvent(payload)
    if (result.ok) {
      saved.push(result.event)
    } else {
      failed.push({
        providerEventId: payload.providerEventId,
        message: result.message,
      })
    }
  }

  return { saved, failed }
}