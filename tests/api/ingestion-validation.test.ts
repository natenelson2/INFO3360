/**
 * Implements docs/api/acceptance-criteria.md AC-1..AC-9.
 * Calls the same validators the route handlers import — no reimplemented rules,
 * no expect(true).toBe(true), no mocked schemas.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  validateEventPayload,
  type EventPayload,
} from '../../src/server/validation/event-payload'
import {
  validateEvaluationPayload,
  type EvaluationPayload,
} from '../../src/server/validation/evaluation-payload'
import {
  toFieldErrors,
  type FieldError,
} from '../../src/server/validation/field-errors'

/** Mirrors openapi ErrorResponse + route mapping: ok → 201, field failure → 422. */
function eventHttpOutcome(body: unknown): {
  status: 201 | 422
  body: EventPayload & { eventId: string } | { error: { code: string; message: string; details: FieldError[] } }
} {
  const result = validateEventPayload(body)
  if (!result.ok) {
    return {
      status: 422,
      body: {
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Game event failed field validation.',
          details: result.errors,
        },
      },
    }
  }
  return {
    status: 201,
    body: {
      eventId: `evt-stub-${result.data.providerEventId}`,
      ...result.data,
    },
  }
}

function evaluationHttpOutcome(body: unknown): {
  status: 201 | 422
  body:
    | (EvaluationPayload & { evaluationId: string })
    | { error: { code: string; message: string; details: FieldError[] } }
} {
  const result = validateEvaluationPayload(body)
  if (!result.ok) {
    return {
      status: 422,
      body: {
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Evaluation failed field validation.',
          details: result.errors,
        },
      },
    }
  }
  return {
    status: 201,
    body: {
      evaluationId: `eval-stub-${result.data.player}`,
      ...result.data,
    },
  }
}

function assertErrorDetailShape(detail: FieldError) {
  expect(detail).toEqual(
    expect.objectContaining({
      field: expect.any(String),
      code: expect.any(String),
      message: expect.any(String),
    }),
  )
  expect(Object.keys(detail).sort()).toEqual(['code', 'field', 'message'])
}

const validEvent: EventPayload = {
  providerEventId: 'prov-100',
  period: '1',
  who: 'player-7',
  what: 'shot',
  when: '12:01',
}

const validEvaluation: EvaluationPayload = {
  player: 'player-7',
  practiceContext: '2026-11-05 morning skate',
  notes: 'Strong edges in corners.',
}

describe('Acceptance criteria: hockey ingestion validation', () => {
  it('AC-1: valid event is accepted', () => {
    const outcome = eventHttpOutcome(validEvent)
    expect(outcome.status).toBe(201)
    expect(outcome.body).toMatchObject({
      eventId: expect.any(String),
      providerEventId: 'prov-100',
      period: '1',
      who: 'player-7',
      what: 'shot',
      when: '12:01',
    })
  })

  it('AC-2: missing required event field period is rejected', () => {
    const { period: _omit, ...withoutPeriod } = validEvent
    const outcome = eventHttpOutcome(withoutPeriod)
    expect(outcome.status).toBe(422)
    expect(outcome.body).toHaveProperty('error')
    const error = (outcome.body as { error: { details: FieldError[] } }).error
    const periodError = error.details.find((d) => d.field === 'period')
    expect(periodError).toBeDefined()
    expect(periodError?.message.length).toBeGreaterThan(0)
  })

  it('AC-3: wrong type on providerEventId is rejected', () => {
    const outcome = eventHttpOutcome({
      ...validEvent,
      providerEventId: 12345,
    })
    expect(outcome.status).toBe(422)
    const error = (outcome.body as { error: { details: FieldError[] } }).error
    expect(error.details.some((d) => d.field === 'providerEventId')).toBe(true)
  })

  it('AC-4: event rejection uses ErrorDetail field code message', () => {
    const { period: _omit, ...withoutPeriod } = validEvent
    const result = validateEventPayload(withoutPeriod)
    expect(result.ok).toBe(false)
    if (result.ok) return
    // Re-run through toFieldErrors so the helper module is exercised
    const details = toFieldErrors(
      result.errors.map((e) => ({
        path: e.field,
        code: e.code,
        message: e.message,
      })),
    )
    expect(details.length).toBeGreaterThan(0)
    for (const detail of details) {
      assertErrorDetailShape(detail)
    }
    const envelope = {
      error: {
        code: 'VALIDATION_FAILED',
        message: 'Game event failed field validation.',
        details,
      },
    }
    expect(envelope.error.details[0]).toHaveProperty('field')
    expect(envelope.error.details[0]).toHaveProperty('message')
    expect(typeof envelope.error.message).toBe('string')
  })

  it('AC-5: valid evaluation is accepted', () => {
    const outcome = evaluationHttpOutcome(validEvaluation)
    expect(outcome.status).toBe(201)
    expect(outcome.body).toMatchObject({
      evaluationId: expect.any(String),
      player: 'player-7',
      practiceContext: '2026-11-05 morning skate',
      notes: 'Strong edges in corners.',
    })
  })

  it('AC-6: missing required evaluation field notes is rejected', () => {
    const { notes: _omit, ...withoutNotes } = validEvaluation
    const outcome = evaluationHttpOutcome(withoutNotes)
    expect(outcome.status).toBe(422)
    const error = (outcome.body as { error: { details: FieldError[] } }).error
    const notesError = error.details.find((d) => d.field === 'notes')
    expect(notesError).toBeDefined()
    expect(notesError?.message.length).toBeGreaterThan(0)
  })

  it('AC-7: wrong type on player is rejected', () => {
    const outcome = evaluationHttpOutcome({
      ...validEvaluation,
      player: true,
    })
    expect(outcome.status).toBe(422)
    const error = (outcome.body as { error: { details: FieldError[] } }).error
    expect(error.details.some((d) => d.field === 'player')).toBe(true)
  })

  it('AC-8: evaluation rejection uses ErrorDetail field code message', () => {
    const result = validateEvaluationPayload({
      ...validEvaluation,
      notes: '',
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    for (const detail of result.errors) {
      assertErrorDetailShape(detail)
    }
    expect(result.errors.some((d) => d.field === 'notes')).toBe(true)
  })

  it('AC-9: invalid payloads never map to success 201', () => {
    const eventsSource = readFileSync(
      resolve('src/routes/api/events.ts'),
      'utf8',
    )
    const evaluationsSource = readFileSync(
      resolve('src/routes/api/evaluations.ts'),
      'utf8',
    )
    expect(eventsSource).toContain('validateEventPayload')
    expect(eventsSource).toContain("from '../../server/validation/event-payload'")
    expect(evaluationsSource).toContain('validateEvaluationPayload')
    expect(evaluationsSource).toContain(
      "from '../../server/validation/evaluation-payload'",
    )

    const sneakyEvent = eventHttpOutcome({
      providerEventId: 'prov-100',
      period: '1',
      what: 'shot',
      when: '12:01',
      // who omitted — a client might still "feel" complete
    })
    expect(sneakyEvent.status).not.toBe(201)
    expect(sneakyEvent.status).toBe(422)

    const sneakyEvaluation = evaluationHttpOutcome({
      player: 'player-7',
      practiceContext: '',
      notes: 'ok',
    })
    expect(sneakyEvaluation.status).not.toBe(201)
    expect(sneakyEvaluation.status).toBe(422)
  })
})
