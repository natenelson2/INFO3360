# Storage implementation review

Checked against:

- docs/ingestion/storage-rule.md
- docs/ingestion/event-outcome-decision-table.md
- docs/ingestion/idempotency-key-decision.md
- docs/ingestion/contract-replay-delta.md

I directed a coding agent. I did not write the storage code or SQL myself.

## What the agent changed

- Files touched (names only): `src/server/ingestion/game-event-store.ts`, `src/routes/api/events.ts`, `.gitignore`
- In one or two sentences, what those changes do: The events route now saves through a store keyed by `providerEventId`. An exact replay returns the original saved event without adding a second row; a new key is kept even if it arrives late; a failed write never claims success.

## Prompt and refine log

- First instruction I gave (one or two sentences): Implement the storage rule using the four notes as the only rulebook; change only storage so the five decision-table cases hold; do not rewrite the notes; reply with file names and one everyday story per case.
- What failed, if anything: none
- Refine instruction I gave: not needed

## Key check

- Idempotency key the storage uses: `providerEventId`
- Key I already chose: `providerEventId`
- Match: pass
- Required fix if fail: none

## Replay return check

- What a replayed request must return (from the contract note): the original success (**201** with the same success body shape); not an error just because the event was already accepted; not a second write
- What the implementation returns on a replay: **201** with the already-stored event body (`eventId`, `providerEventId`, period, who, what, when); store kind `replay` (no second insert)
- Match: pass
- Required fix if fail: none

## Exact duplicate

- Expected outcome (from the decision table): Stats do not change. The goal is not counted a second time. Sender: already saved, not a failure, not a new event.
- What the implementation does: First delivery creates one stored event; the same `providerEventId` with the same facts returns that same event and does not insert again.
- Evidence (quote one sentence from the agent's explanation or from a stored result it showed you): "Jordan’s 10:12 goal sent twice after a timeout left the store size at 1 and Jordan’s goal count at 1."
- Does a second delivery insert a second stat: no
- Result: pass
- Required fix if fail: none
- Re-check after fix: not needed

## Out-of-order arrival

- Expected outcome (from the decision table): If it is new, save it anyway. Do not reject it for being late. Do not delete what is already stored.
- What the implementation does: A minute-12 goal can land first; a new minute-8 pass with a different `providerEventId` is still saved; both stay in the store.
- Evidence: "After saving the later goal first, the earlier pass was still created; bothKept was true with store size 2."
- Result: pass
- Required fix if fail: none
- Re-check after fix: not needed

## Partial batch

- Expected outcome (from the decision table): Each new valid event is saved once. Saved neighbors stay saved. A retry must not add a second copy. Tell which ones saved and which did not.
- What the implementation does: A batch helper saves each event on its own; when one write fails, the other can still save; the result lists saved ids and failed ids instead of calling the whole batch a success.
- Evidence: "In the partial-batch trace, e1 failed and e2 saved; store size stayed 1 and failedIds listed e1."
- Result: pass
- Required fix if fail: none
- Re-check after fix: not needed

## Late correction

- Note: step 10 extends the rules for a corrected event. Here, check only what your storage rule from step 6 says about a late correction.
- Expected outcome (from the decision table): Still one event. Stats match the corrected facts. No second stat line. New facts are not ignored.
- What the implementation does: Same `providerEventId` with different facts updates the one stored row (for example fixing the player from WrongPlayer to Jordan) without adding a second goal line.
- Evidence: "After correction, store size was 1, who was Jordan, Jordan’s goals were 1, and WrongPlayer’s goals were 0."
- Result: pass
- Required fix if fail: none
- Re-check after fix: not needed

## Provider outage

- Expected outcome (from the decision table): Do not invent missing goals. Unsaved events are absent. A later resend is stored once. Never say saved unless it was stored.
- What the implementation does: If the write fails, the handler does not return success and the store stays empty; a later successful resend creates exactly one row.
- Evidence: "Outage save returned ok false with store size 0; the later resend created one event (size 1)."
- Result: pass
- Required fix if fail: none
- Re-check after fix: not needed

## Final verdict

- All five cases, the key check, and the replay-return check are pass: yes
- Safe for coaches to trust stored stats from this storage path: yes
- Open fixes still required: none