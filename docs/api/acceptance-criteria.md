Acceptance Criteria: Hockey Event Ingestion and Evaluation Forms

How to read these cases

Each case uses Given / When / Then:





Given — the starting situation



When — the HTTP request someone sends (method, path, body)



Then — the response openapi/hockey-ingestion.yaml already promises

Do not invent fields, paths, or status codes here. Quote them from the contract
and from the server schemas the routes already import.





Contract: openapi/hockey-ingestion.yaml



Routes: src/routes/api/events.ts, src/routes/api/evaluations.ts



Schemas: src/server/validation/event-payload.ts, src/server/validation/evaluation-payload.ts



Errors: src/server/validation/field-errors.ts

Path note (known mismatch)

The OpenAPI file documents create as POST /game-events and POST /evaluation-forms.
The TanStack Start handlers in this repo are mounted at POST /api/events and POST /api/evaluations.
These cases use the route paths (what a caller hits today). Status codes, required fields, success bodies, and the ErrorResponse / ErrorDetail shapes still come only from the YAML.

Status codes used in these cases (from YAML)







Situation



Status



YAML meaning





Create succeeded



201



Created — new event or evaluation accepted





JSON unusable



400



Bad Request — not JSON / empty / wrong Content-Type





Fields failed rules



422



Unprocessable Entity — JSON parsed, fields invalid

Scaffold examples that said 400 for a missing field are wrong for this contract. Missing or wrong-type fields are 422. Only unreadable JSON is 400.

Required request fields (from YAML)





HockeyEvent: providerEventId, period, who, what, when (all strings, minLength 1; period must be 1, 2, 3, or OT)



EvaluationForm: player, practiceContext, notes (all strings, minLength 1)

Validation-error item properties (from YAML ErrorDetail)

Each detail object has exactly: field, code, message.
The envelope is { "error": { "code", "message", "details": [ ErrorDetail, ... ] } }.



Provider: ingest a hockey event

AC-1: Valid event is accepted





Given: a complete event payload with string values for providerEventId, period (1), who, what, and when



When: POST /api/events is sent with that body



Then: the response status is 201



And: the response body matches HockeyEventResponse — includes eventId plus the accepted providerEventId, period, who, what, and when

AC-2: Missing required event fields are rejected





Given: an event payload that omits required field period



When: POST /api/events is sent with that body



Then: the response status is 422



And: error.details lists an entry whose field is period with a human-readable message

AC-3: Wrong types on event fields are rejected





Given: an event payload whose providerEventId is the number 12345 instead of a string



When: POST /api/events is sent with that body



Then: the response status is 422



And: error.details names field providerEventId

AC-4: Structured field errors for events





Given: any invalid event payload from AC-2 or AC-3



When: the server rejects it



Then: the body matches ErrorResponse — top-level error with code, message, and details array; each detail has field, code, and message (not a single unlabeled string)

Coach: submit an evaluation form

AC-5: Valid evaluation is accepted





Given: a complete evaluation payload with string values for player, practiceContext, and notes



When: POST /api/evaluations is sent with that body



Then: the response status is 201



And: the response body matches EvaluationFormResponse — includes evaluationId plus the accepted player, practiceContext, and notes

AC-6: Missing required evaluation fields are rejected





Given: an evaluation payload that omits required field notes



When: POST /api/evaluations is sent with that body



Then: the response status is 422



And: error.details lists an entry whose field is notes with a human-readable message

AC-7: Wrong types on evaluation fields are rejected





Given: an evaluation payload whose player is the boolean true instead of a string



When: POST /api/evaluations is sent with that body



Then: the response status is 422



And: error.details names field player

AC-8: Structured field errors for evaluations





Given: any invalid evaluation payload from AC-6 or AC-7



When: the server rejects it



Then: the body matches the same ErrorResponse / ErrorDetail schema used for events (field, code, message on each detail)

Cross-cutting: the server is the authority

AC-9: Client-side checks are not enough





Given: a payload a browser or provider client might have allowed through (for example an event missing who, or an evaluation with blank practiceContext)



When: it reaches POST /api/events or POST /api/evaluations



Then: the server still runs validateEventPayload or validateEvaluationPayload for that resource



And: invalid input never receives status 201 from AC-1 / AC-5 (it receives 422 with ErrorResponse)

Traceability

Map every case to the contract, the module under test, and the test name the agent must create. A case with no test name is unfinished.







Case



OpenAPI path + method



App route path



Validation module



Test name





AC-1



POST /game-events



POST /api/events



src/server/validation/event-payload.ts



AC-1: valid event is accepted





AC-2



POST /game-events



POST /api/events



src/server/validation/event-payload.ts



AC-2: missing required event field period is rejected





AC-3



POST /game-events



POST /api/events



src/server/validation/event-payload.ts



AC-3: wrong type on providerEventId is rejected





AC-4



POST /game-events



POST /api/events



src/server/validation/field-errors.ts



AC-4: event rejection uses ErrorDetail field code message





AC-5



POST /evaluation-forms



POST /api/evaluations



src/server/validation/evaluation-payload.ts



AC-5: valid evaluation is accepted





AC-6



POST /evaluation-forms



POST /api/evaluations



src/server/validation/evaluation-payload.ts



AC-6: missing required evaluation field notes is rejected





AC-7



POST /evaluation-forms



POST /api/evaluations



src/server/validation/evaluation-payload.ts



AC-7: wrong type on player is rejected





AC-8



POST /evaluation-forms



POST /api/evaluations



src/server/validation/field-errors.ts



AC-8: evaluation rejection uses ErrorDetail field code message





AC-9



both create POSTs



both app routes



route handlers + schemas



AC-9: invalid payloads never map to success 201

