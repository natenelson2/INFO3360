// Thin POST handler for coach evaluation-form create.
// Parses JSON, runs validateEvaluationPayload, returns contract statuses.
// Not allowed: database writes, authentication checks, or a second copy of schema rules.

import { createFileRoute } from '@tanstack/react-router'
import { validateEvaluationPayload } from '../../server/validation/evaluation-payload'
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

export const Route = createFileRoute('/api/evaluations')({
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

        const result = validateEvaluationPayload(body)
        if (!result.ok) {
          return jsonError(
            422,
            'VALIDATION_FAILED',
            'Evaluation failed field validation.',
            result.errors,
          )
        }

        // Stub success body — invented id + accepted resource. No database.
        return Response.json(
          {
            evaluationId: `eval-stub-${result.data.player}`,
            player: result.data.player,
            practiceContext: result.data.practiceContext,
            notes: result.data.notes,
          },
          { status: 201 },
        )
      },
    },
  },
})