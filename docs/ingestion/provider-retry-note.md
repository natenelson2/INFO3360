# What the provider can safely retry

Who this is for: the data provider, and internal operations

Key to reuse on every retry: `providerEventId` (from docs/ingestion/idempotency-key-decision.md). Do not create a new id for a goal you already sent.

## Safe (same key and same body only)

- Timeout: If you did not hear back in time, resend with the same `providerEventId` and the same body — that retry is safe and must not add a second goal.
- Exact duplicate: Sending the same key and the same body again is safe and must not add a second goal.
- Outage: After we were down, a resend is safe only with the same `providerEventId` and the same body, and that retry must not add a second goal.

What a safe replay returns: the original **201** success already promised in docs/ingestion/contract-replay-delta.md — not a new status, not a second write, and not an error just because the event was already accepted.

## Not safe

- New id for the same goal: Inventing a new `providerEventId` for a goal you already sent is not safe and will double-count that goal for coaches.
- Old body after a correction: Resending the old wrong body after a correction is not safe — latest arrival wins for that key, so a delayed old copy can overwrite the corrected facts (see docs/ingestion/late-correction-handling.md).

## Replay check

docs/ingestion/replay-comparison.md showed the timeout/exact-duplicate path worked: Jordan’s retried 10:12 goal stayed counted once (delivery 2), with no open mismatches. Those same-key, same-body cases are safe to call safe; this note does not mark any case safe that the comparison still showed as failed.