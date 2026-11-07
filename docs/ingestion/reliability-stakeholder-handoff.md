# Reliability handoff: one goal stays one stat

## Who this is for

Coach liaison, course instructor, and the next builder who picks up this app. Readers need the decisions in plain words. They do not write code from this file.

## The coach-trust problem

When the provider is unsure whether we saved a goal, it may send that same goal again. If we treat both arrivals as two goals, coaches see a board that no longer matches the rink — see docs/ingestion/duplicate-delivery-impact.md.

## Decisions already made

| Decision | What we decided, in plain words | Source file |
| --- | --- | --- |
| Why a second delivery matters | One real goal counted twice makes the score and a player’s totals wrong, so coaches stop trusting the board. | docs/ingestion/duplicate-delivery-impact.md |
| Exact duplicate | Stats do not change. The goal is not counted a second time. | docs/ingestion/event-outcome-decision-table.md |
| Out-of-order arrival | If it is new, save it anyway. Do not reject it for being late. Do not delete what is already stored. | docs/ingestion/event-outcome-decision-table.md |
| Partial batch | Each new valid event is saved once. Saved neighbors stay saved. A retry must not add a second copy. | docs/ingestion/event-outcome-decision-table.md |
| Late correction | Still one event. Stats match the corrected facts. No second stat line. New facts are not ignored. | docs/ingestion/event-outcome-decision-table.md |
| Provider outage | Do not invent missing goals. Unsaved events are absent. A later resend is stored once. | docs/ingestion/event-outcome-decision-table.md |
| What makes two deliveries the same event | The provider’s stable id already named providerEventId — not arrival time, and not a fresh id on each try. | docs/ingestion/idempotency-key-decision.md |
| What a replayed request returns | The original success again (201 with the same success body). No second write. Not an error just because the event was already accepted. | docs/ingestion/contract-replay-delta.md |
| How storage treats a repeated event | One providerEventId maps to one stored event. An exact same-key, same-body replay does not insert again and does not add the goal again. | docs/ingestion/storage-rule.md |
| Whether storage matched the table | Matched: key check, replay-return check, and all five decision-table cases passed; no open fixes. | docs/ingestion/storage-implementation-review.md |
| What the replay comparison showed | Matched the sealed prediction: Jordan’s retried 10:12 goal stayed one goal; out-of-order Sam pass was kept; no mismatches. | docs/ingestion/replay-comparison.md |
| How a corrected event with the same key is handled | Same providerEventId with changed details replaces the stored details once; Player B gets the goal, Player A loses it, team total stays one. Known limitation: latest arrival wins — an older delayed copy can overwrite a newer correction. | docs/ingestion/late-correction-handling.md |
| What the provider may safely retry | Safe only with the same providerEventId and the same body (timeout, exact duplicate, outage). Not safe: a new id for the same goal, or resending the old body after a correction. | docs/ingestion/provider-retry-note.md |

## Consistency pass

Checked the nine files above in this session.
Result: No contradictions found. The key is providerEventId in every note that names it. The exact-duplicate outcome matches the storage rule and the contract replay promise. The late-correction replace-once rule matches the decision table’s late-correction row, and the provider retry note forbids the old-body resend that the correction limitation warns about. The implementation review and replay comparison both report matches, not open failures.

## Open questions

None for this sprint that block coach trust on the repeated-goal path. The known limitation that latest arrival wins (without a provider version number) stays recorded in docs/ingestion/late-correction-handling.md; it is a documented limit, not a clash between notes.

## What the next topic must reuse, not redo

- Do not rebuild the ingestion endpoint, the HTTP status codes and error model, the OpenAPI contract, or server-side validation.
- Do not re-choose the idempotency key, the replay promise, the storage rule, the correction rule, or the provider retry note recorded above.
- Do not create a new repository or a new hosting project. Reuse the ones this app already has.
- Do not change the key, the replay promise, the correction rule, or the retry note without updating this handoff.

## What this handoff does not decide

This file adds no new key, no new reply, and no new storage behavior. It only records decisions already made in the nine notes above.