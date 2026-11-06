Contract replay delta

Replay promise

When the provider sends the same event again, using the idempotency key named below, the endpoint must:





Return the original success: the same successful answer the contract already uses for a first accepted event. Do not invent a new status code.



Not perform a second write: do not save the event again, so one goal is counted once.



Not return an error just because the event was already accepted.

Idempotency key name (copied from docs/ingestion/idempotency-key-decision.md, not a new name): providerEventId

Decision-table row this promise must match: the exact-duplicate outcome in docs/ingestion/event-outcome-decision-table.md. In my words, that row says: stats stay the same and the goal is not counted a second time; the sender hears that it was already saved, not that it failed, and not that it is a new event.

This note does not decide late corrections, out-of-order storage, partial batches, or outages. Those stay in the decision table.

Do not change





Do not add, remove, or rename endpoints.



Do not change HTTP status codes or the error model from the first Sprint 5 tutorial.



Do not rewrite validation rules.



Do not create a second contract file.



Do not write storage code, SQL, or migrations in this step.



Do not pick a different idempotency key.

Smallest contract changes

Existing contract file path (the file already in the repo): openapi/hockey-ingestion.yaml

Add only these ideas to that file, as plain descriptions on the existing ingest request and its success response:





The request includes the idempotency key named above (providerEventId — already required; describe it as the idempotency key).



If that key was already accepted, the response is the original success again (201 with the same success body shape).



A replay does not create another stored event.

Clarify that an exact duplicate replay is not treated as a failure answer: do not use an error just because the key was already accepted. Keep the existing 409 response entry in the contract, but describe it so it is not the answer for a quiet exact replay of an already-accepted providerEventId.

Review of the agent's edit

Fill this in after you read the diff. Do not leave it blank.





Contract file the agent edited: openapi/hockey-ingestion.yaml



What changed, in one or two sentences: Added replay wording on POST /game-events and on the 201 success description; labeled providerEventId as the idempotency key; narrowed the 409 description so an exact already-accepted replay returns the original success instead of an error. No new paths, no new status codes, no second contract file.



Did the edit add a second contract file? no



Did the edit rewrite endpoints, status codes, or validation? no — same paths and same status code numbers; validation modules untouched



Does the edit say a replay returns the original success and does not write a second time? yes



Does that match the exact-duplicate row of the decision table? yes



If any answer was wrong, what you told the agent to fix: nothing to fix

