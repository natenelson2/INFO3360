// Job: accept unknown input and decide if it is a legal hockey event (HockeyEvent schema).

import { toFieldErrors, type FieldError } from './field-errors'

export type EventPayload = {
  providerEventId: string
  period: string
  who: string
  what: string
  when: string
}

export type EventValidationResult =
  | { ok: true; data: EventPayload }
  | { ok: false; errors: FieldError[] }

const REQUIRED_STRING_FIELDS = [
  'providerEventId',
  'period',
  'who',
  'what',
  'when',
] as const

const ALLOWED_KEYS = new Set<string>(REQUIRED_STRING_FIELDS)

/** Period values called out in the OpenAPI description / status-model examples. */
const ALLOWED_PERIODS = new Set(['1', '2', '3', 'OT'])

type Failure = { path: string; message: string; code?: string }

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function validateEventPayload(body: unknown): EventValidationResult {
  const failures: Failure[] = []

  if (!isPlainObject(body)) {
    return {
      ok: false,
      errors: toFieldErrors([
        {
          path: '',
          code: 'INVALID_TYPE',
          message: 'Request body must be a JSON object.',
        },
      ]),
    }
  }

  for (const key of Object.keys(body)) {
    if (!ALLOWED_KEYS.has(key)) {
      failures.push({
        path: key,
        code: 'ADDITIONAL_PROPERTY',
        message: `Unexpected property "${key}" is not allowed on a hockey event.`,
      })
    }
  }

  const data: Partial<EventPayload> = {}

  for (const name of REQUIRED_STRING_FIELDS) {
    if (!(name in body)) {
      failures.push({
        path: name,
        code: 'REQUIRED',
        message: `${name} is required.`,
      })
      continue
    }

    const value = body[name]
    if (typeof value !== 'string') {
      failures.push({
        path: name,
        code: 'INVALID_TYPE',
        message: `${name} must be a string.`,
      })
      continue
    }

    if (value.length < 1) {
      failures.push({
        path: name,
        code: 'MIN_LENGTH',
        message: `${name} must be at least 1 character.`,
      })
      continue
    }

    if (name === 'period' && !ALLOWED_PERIODS.has(value)) {
      failures.push({
        path: 'period',
        code: 'OUT_OF_RANGE',
        message: 'period must be 1, 2, 3, or OT.',
      })
      continue
    }

    data[name] = value
  }

  if (failures.length > 0) {
    return { ok: false, errors: toFieldErrors(failures) }
  }

  return { ok: true, data: data as EventPayload }
}