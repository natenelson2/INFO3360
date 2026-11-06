// Job: turn schema failures into the ErrorDetail shape from openapi/hockey-ingestion.yaml.
// Property names copied VERBATIM from components.schemas.ErrorDetail: field, code, message.

export type FieldError = {
  field: string
  code: string
  message: string
}

export function toFieldErrors(
  failures: Array<{ path: string; message: string; code?: string }>,
): FieldError[] {
  return failures.map((failure) => ({
    field: failure.path,
    code: failure.code ?? 'VALIDATION_FAILED',
    message: failure.message,
  }))
}