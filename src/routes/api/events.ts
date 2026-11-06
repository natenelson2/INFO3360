// Thin POST handler for provider game-event create.
// Parses JSON, runs validateEventPayload, then saves via game-event-store
// (idempotent on providerEventId per docs/ingestion/storage-rule.md).

import { createFileRoute } from '@tanstack/react-router'
import { saveGameEvent } from '../../server/ingestion/game-event-store'
import { validateEventPayload } from '../../server/validation/event-payload'
import { toFieldErrors, type FieldError } from '../../server/validation/field-errors'

function jsonError(
  status: number,
  code: string,
  message: string,
  details: FieldError[],
) {
  return Response.json(
    {
      error: {
        code,
        message,
        details,
      },
    },
    { status },
  )
}

export const Route = createFileRoute('/api/events')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown
        try {
          body = await request.json()
        } catch {
          return jsonError(
            400,
            'MALFORMED_REQUEST',
            'Request body must be valid JSON.',
            toFieldErrors([
              {
                path: '',
                code: 'MALFORMED_REQUEST',
                message: 'Body missing, not JSON, or otherwise unusable.',
              },
            ]),
          )
        }

        const result = validateEventPayload(body)
        if (!result.ok) {
          return jsonError(
            422,
            'VALIDATION_FAILED',
            'Game event failed field validation.',
            result.errors,
          )
        }

        const saved = saveGameEvent(result.data)
        if (!saved.ok) {
          // Provider outage / failed write — never report success if not stored.
          return jsonError(500, 'WRITE_FAILED', saved.message, [])
        }

        // First create, exact replay, and late correction all return the original
        // success shape (201). Replay does not insert a second row.
        return Response.json(
          {
            eventId: saved.event.eventId,
            providerEventId: saved.event.providerEventId,
            period: saved.event.period,
            who: saved.event.who,
            what: saved.event.what,
            when: saved.event.when,
          },
          { status: 201 },
        )
      },
    },
  },
})