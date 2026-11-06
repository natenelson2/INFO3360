Error and Status Model

Purpose

One shared agreement for how the hockey ingestion API reports success and failure.
Every operation in docs/api/resource-design.md must appear below.
The hockey data provider and coaches should never receive a bare "something went wrong."

This file does not add endpoints. Paths and methods are copied from the resource design only.

Required status-code vocabulary

Use only these codes unless you record a written exception under Decisions.







Code



Name



Meaning in this API





200



OK



A fetch succeeded; the body is the requested resource.





201



Created



A new event or evaluation was accepted and created.





400



Bad Request



The HTTP request is unusable (not JSON, empty body, wrong Content-Type).





401



Unauthorized



No valid identity was provided.





403



Forbidden



Identity is valid, but this caller may not perform this action.





404



Not Found



The requested resource id does not exist.





409



Conflict



The request is well-formed but collides with stored data (duplicate provider event id).





422



Unprocessable Entity



JSON parsed, but one or more fields failed schema or business rules.

Why these matter for integrators





201 on creates — the provider (or coach) can tell a new resource was stored, not that an old one was echoed back as “ok.”



400 only for unusable HTTP — wrong media type, empty body, or not JSON. Do not use 400 for “period is wrong.”



422 for parsed-but-invalid fields — JSON opened fine; field rules failed. Field paths go in details.



401 vs 403 — 401 means we do not know who you are; 403 means we know you and you are not allowed.



409 for duplicate provider event id — same providerEventId already stored; not a validation typo.



Never 200 with a success flag set to false — failure uses a non-success status plus the error envelope.

200 stays in the vocabulary for future authorized fetches. The current resource design has no in-scope GET; creates use 201.

Status-code map

Copy every in-scope operation from docs/api/resource-design.md. Do not invent paths here.
Use an em dash when a failure cannot apply to that operation.







Operation name



Method



Path



Success



Malformed request



Validation



Missing identity



Not allowed



Resource missing



Conflict





Create game event (provider handoff)



POST



/game-events



201



400



422



401



403



—



409





Create evaluation form (coach handoff)



POST



/evaluation-forms



201



400



422



401



403



—



—

Success body (happy path)





Create game event — 201 with the created game-event resource (including server id and accepted fields), not a vague ok flag.



Create evaluation form — 201 with the created evaluation-form resource (including server id and accepted fields), not a vague ok flag.

Out-of-scope GETs / PUTs / PATCHes / DELETEs from the resource design are not given rows here (no new endpoints).

Hockey stories for each failure code

Write one concrete story per code so a reviewer can tell them apart.





400 — Provider posts to /game-events with a body that is not JSON (or an empty body / wrong Content-Type).



401 — Provider calls POST /game-events with no credentials at all.



403 — A valid coach identity calls POST /game-events (coach is known, but only the provider may create events); or a valid non-coach identity calls POST /evaluation-forms.



404 — Someone requests an evaluation id the API has never stored (vocabulary for a future authorized fetch; no in-scope GET today).



409 — Provider resends an event whose providerEventId is already stored.



422 — Event JSON parses but period is missing or out of range; or evaluation JSON parses but a required rating is blank.

Structured error envelope

Every non-success response uses this exact shape. Events and evaluations share it.

{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Short human summary of the whole failure.",
    "details": [
      {
        "field": "period",
        "code": "OUT_OF_RANGE",
        "message": "period must be 1, 2, 3, or OT."
      }
    ]
  }
}

Rules:





error.code is a stable machine-readable token in SCREAMING_SNAKE_CASE.



error.message is a summary only. It is never the only information on a 422.



error.details is always an array. Empty for 401 / 403 / 404 when no field applies. One or more entries for every 422, and for 409 when a specific field caused the collision.



Each detail has field (dot path into the request body, or "" when not field-specific), code (machine-readable), and message (what the coach or integrator should change).

Field names below (period, providerEventId, ratings.skating) are working names until the resource design’s open field list is settled. Status codes and envelope shape do not wait on that list.

Standard error.code values







error.code



Typical status



When to use





MALFORMED_REQUEST



400



Body missing, not JSON, or otherwise unusable.





UNAUTHENTICATED



401



No valid identity.





FORBIDDEN



403



Identity known, action not allowed.





NOT_FOUND



404



Resource id does not exist.





CONFLICT



409



Duplicate provider event id or other unique collision.





VALIDATION_FAILED



422



One or more fields failed schema or business rules.

Worked failure examples

Keep the envelope shape identical. Change only status, codes, fields, and messages.

Provider sends an event with a missing period





Status: 422



Operation: POST /game-events

{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Game event failed field validation.",
    "details": [
      {
        "field": "period",
        "code": "REQUIRED",
        "message": "period is required and must be 1, 2, 3, or OT."
      }
    ]
  }
}

Provider resends an event id the API already stored





Status: 409



Operation: POST /game-events

{
  "error": {
    "code": "CONFLICT",
    "message": "A game event with this provider event id already exists.",
    "details": [
      {
        "field": "providerEventId",
        "code": "DUPLICATE",
        "message": "providerEventId must be unique; this value was already accepted."
      }
    ]
  }
}

Coach submits an evaluation with a blank required rating





Status: 422



Operation: POST /evaluation-forms

{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Evaluation failed field validation.",
    "details": [
      {
        "field": "ratings.skating",
        "code": "REQUIRED",
        "message": "ratings.skating is required and cannot be blank."
      }
    ]
  }
}

Caller fetches an evaluation id that does not exist





Status: 404



Note: No evaluation GET is in scope in docs/api/resource-design.md. This example locks the 404 envelope for when a fetch is authorized later. Do not treat it as adding a GET endpoint here.

{
  "error": {
    "code": "NOT_FOUND",
    "message": "No evaluation form exists for the given id.",
    "details": []
  }
}

Decision: 400 vs 422





400 is only for unusable HTTP requests (not JSON, empty body, wrong Content-Type).



422 is for parsed JSON that fails field rules (missing period, blank required rating, out-of-range values).



This API will never return 200 with { "success": false } for a failed create or submit. Creates that succeed return 201 with the created resource; failures return a non-success status and this envelope.

Out of scope





5xx crash shapes (log them; do not invent a second client error format)



How tokens are issued or stored



Database tables or UI screens



OpenAPI YAML



Route handlers



New endpoints not listed in docs/api/resource-design.md

Open questions





Exact request field names for game events and evaluations (examples above use provisional period, providerEventId, ratings.skating)



Whether duplicate provider events are always 409, or sometimes ignored/merged (resource design left this open; this model assumes 409 when a stored providerEventId collides)



Whether evaluation create ever needs 409 (for example duplicate coach+player+practice); not authorized yet → em dash in the map



When (if ever) an in-scope GET appears so 200 / 404 apply to a live operation row

