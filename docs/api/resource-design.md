Resource Design: Hockey Event Ingestion and Coach Evaluations

Purpose

Turn docs/scoping/resource-inventory.md into concrete HTTP operations.
Later steps will check the OpenAPI contract against this file.
Do not put a status-code table here. Do not invent resources the inventory does not name.

Source of truth





Inventory file: docs/scoping/resource-inventory.md



In-scope actors: third-party hockey data provider; coach; hockey operations (team) as keepers/readers of records (no browse API authorized yet)



In-scope resources (from inventory): game event; provider push outcome (as the response to an event handoff, not a separate collection); player evaluation; practice context (as fields on an evaluation, not a separate collection)

This file exposes HTTP operations only for hockey event and evaluation form collections. Provider push outcome is returned on the event create call. Practice context rides inside the evaluation body.

Path and method conventions





Paths name resources (nouns), never actions (verbs).



Collection paths: /game-events, /evaluation-forms



Item paths: /game-events/{eventId}, /evaluation-forms/{evaluationId} (placeholders only; item methods are out of scope unless authorized below)



Each operation names exactly one caller.



Out-of-scope operations are listed, not silently omitted.



No numeric status codes and no OpenAPI YAML in this file.

Operations

Resource: Hockey event







Operation name



Method



Path



Caller



What it does



In scope?



Notes





Create game event (provider handoff)



POST



/game-events



Third-party hockey data provider



Accepts a push of game event facts; keeps the event when trusted and usable, or refuses with a clear outcome



Yes



Inventory: provider creates game events; doorway returns accept/reject outcome. Outcome is the response to this call, not a second resource path.

Resource: Evaluation form







Operation name



Method



Path



Caller



What it does



In scope?



Notes





Create evaluation form (coach handoff)



POST



/evaluation-forms



Coach



Accepts a coach’s player evaluation after practice (including practice context in the body); keeps it when complete enough to count as submitted, or signals what still blocks



Yes



Inventory: coach creates player evaluation; doorway confirms handoff. Draft-only save is not authorized until Open decisions settle drafts.

Explicitly out of scope

List every operation someone might expect that this sprint will not expose.
For each, name the method and path you are refusing, who might have wanted it, and why the inventory does not authorize it.







Refused operation



Method + path not offered



Who might want it



Why it is out of scope





List game events



GET /game-events



Hockey operations



Inventory open question: whether staff browse accepted events in-app; no authorized list read





Read one game event



GET /game-events/{eventId}



Hockey operations



Same — “kept for the team” is storage intent, not an authorized item GET





Replace game event



PUT /game-events/{eventId}



Provider or staff



Inventory: event correction after accept is unsettled; no authorized replace





Partial update game event



PATCH /game-events/{eventId}



Provider or staff



Same — no authorized correction path yet





Delete game event



DELETE /game-events/{eventId}



Staff



Inventory never authorizes delete





Verb path “ingest events”



POST /ingestEvents (or similar)



Provider



Action verb path; refused in favor of POST /game-events





List evaluation forms



GET /evaluation-forms



Hockey operations / coach



Who may read evaluations is unsettled; no authorized collection GET





Read one evaluation form



GET /evaluation-forms/{evaluationId}



Hockey operations / coach



Same — no authorized item GET





Save draft evaluation



PUT or PATCH /evaluation-forms/{evaluationId}



Coach



Draft allowed vs submit-only is unsettled; no authorized update





Delete evaluation form



DELETE /evaluation-forms/{evaluationId}



Coach or staff



Inventory never authorizes delete





Verb path “submit evaluation”



POST /submitEvaluation (or similar)



Coach



Action verb path; refused in favor of POST /evaluation-forms





Separate provider-outcome collection



POST/GET /provider-push-outcomes



Provider



Inventory names outcome as the handoff result, returned on event create — not its own collection





Separate practice-context collection



POST/GET /practice-contexts



Coach



Practice context is input on the evaluation, not a standalone resource operation

Caller matrix







Actor



May call (method + path)



Must not call





Third-party hockey data provider



POST /game-events



Any evaluation-form path; GET/PUT/PATCH/DELETE on /game-events or /game-events/{eventId}; verb paths such as /ingestEvents





Coach



POST /evaluation-forms



Any game-event path; GET/PUT/PATCH/DELETE on /evaluation-forms or /evaluation-forms/{evaluationId}; verb paths such as /submitEvaluation

Hockey operations may use kept records inside the product later; this design does not yet grant them HTTP reads (see Open decisions).

Review log

Cycle 1 — resource versus action





Reviewer: coding agent (cloud), directed by Nate



Paths that looked like actions (verbs) and how you fixed them:





Considered /ingestEvents, /createEvent, /pushEvents → not used; in-scope path is collection noun POST /game-events



Considered /submitEvaluation, /sendForm, /createEvaluation → not used; in-scope path is collection noun POST /evaluation-forms



No verb segments remain in in-scope Path cells



Remaining questions:





None for naming; collection noun choices (game-events, evaluation-forms) can be renamed later only if the contract step requires it, without turning them into verbs

Cycle 2 — missing reads and unsafe updates





Reviewer: coding agent (cloud), directed by Nate



Read operations (GET) you almost added but the inventory did not authorize:





GET /game-events and GET /game-events/{eventId} — inventory says events are kept for the team and asks whether staff browse in-app; no quote authorizes a list/item GET → moved to Explicitly out of scope



GET /evaluation-forms and GET /evaluation-forms/{evaluationId} — inventory leaves who may read unsettled → moved to Explicitly out of scope



Write operations (PUT / PATCH / DELETE) you almost added but the inventory did not authorize:





PUT/PATCH/DELETE on game events — correction-after-accept is an open question; delete never authorized → out of scope



PUT/PATCH draft evaluation and DELETE evaluation — draft unsettled; delete never authorized → out of scope



Remaining questions:





If a later decision allows drafts or corrections, add new rows only after the inventory is updated — do not sneak them into the OpenAPI step

Open decisions





Exact JSON fields for a game event (beyond who / what / when in plain language)



Exact JSON fields for an evaluation form (ratings, free text, required vs optional)



How the provider proves identity on POST /game-events



Whether duplicate provider events are refused, ignored, or merged



Whether event correction is ever allowed (and by whom)



Whether draft evaluations get their own write operation later



Whether hockey operations get any GET on events or evaluations in a later slice



Whether {eventId} / {evaluationId} shape is opaque string or something else (ids only matter once item routes exist)

