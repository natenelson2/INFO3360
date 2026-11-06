# Storage rule for hockey events

This file is a plain-language instruction for a later coding-agent step.
It is not SQL, not a migration, and not application code.
Do not leave any blank below. Fill each one from the source files.

## Sources this rule must match

- Decision table: docs/ingestion/event-outcome-decision-table.md
- Idempotency key: docs/ingestion/idempotency-key-decision.md
- Replay promise: docs/ingestion/contract-replay-delta.md

If a sentence here disagrees with those files, this file is wrong.

## The key

- Chosen idempotency key (copy the name, do not invent one): `providerEventId`
- Rule: one value of that key maps to one stored event. A second delivery with the same key is not a new event.

## Exact replay

- When that same key arrives again and the event is the same: do not insert again. Do not add the goal or the stat again.
- What the replayed request returns (copy from the contract delta): the original success — the same successful answer the contract already uses for a first accepted event (**201** with the same success body shape); not an error just because the event was already accepted.
- That return is not a second save. The event is already stored.

## Out of order

- If an event arrives late and its key is new: keep it. Do not drop it only because it arrived after a later event.
- Stats come from stored events, not from the order deliveries arrived.
- Outcome copied from the decision table: If it is new, save it anyway. Do not reject it for being late. Do not delete what is already stored.

## Partial batch and outage

- Partial batch outcome copied from the decision table (do not call the whole batch a success if some events were not stored): Each new valid event is saved once. Saved neighbors stay saved. A retry must not add a second copy. Tell the sender which ones saved and which did not, so only failures are retried.
- Failed write or provider outage: do not report success. Outcome copied from the decision table: Do not invent missing goals. Unsaved events are absent. A later resend is stored once. Tell the sender it was not saved if the save failed, and never say saved unless it was stored.
- How this differs from an exact replay: An exact replay means the event really is already stored, so we return the original success and do not write again. A partial batch or outage means some or all events were never stored, so we must not describe that as full success the way we describe an exact replay.

## Late correction (one sentence only)

- Restate only the stored-stat outcome from the decision table. Do not design the correction procedure: Still one event; stats match the corrected facts; no second stat line; new facts are not ignored.

## What a later implementation must not do

- Do not invent a different idempotency key.
- Do not invent a different replay response.
- Do not insert a second copy of an exact replay.
- Do not report success when the write did not succeed.
- Do not turn this note into SQL.