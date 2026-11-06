// Thin POST handler for provider game-event create.
// Parses JSON, runs validateEventPayload, returns contract statuses.
// Not allowed: database writes, authentication checks, or a second copy of schema rules.

import { createFileRoute } from '@tanstack/react-router'
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

        // Stub success body — invented id + accepted resource. No database.
        return Response.json(
          {
            eventId: `evt-stub-${result.data.providerEventId}`,
            providerEventId: result.data.providerEventId,
            period: result.data.period,
            who: result.data.who,
            what: result.data.what,
            when: result.data.when,
          },
          { status: 201 },
        )
      },
    },
  },
})