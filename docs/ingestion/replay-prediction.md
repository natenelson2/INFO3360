# Replay prediction (sealed before any replay)

## Seal
- Written at:Saturday, Nov 7, 2026, 1:35 PM
- Written before any replay was run: yes
- I did not send these deliveries, and I did not ask an agent to fill in the outcomes: yes

## Rules I am applying (copied from my earlier docs, not new rules)
- Source docs: docs/ingestion/event-outcome-decision-table.md, docs/ingestion/storage-rule.md, docs/ingestion/idempotency-key-decision.md, docs/ingestion/contract-replay-delta.md, docs/ingestion/storage-implementation-review.md
- Idempotency key: providerEventId — two deliveries are the same hockey event when they share that provider id
- Replay response promise: first save returns 201 with the success body; a replay with the same providerEventId also returns that same 201 success, does not write again, and is not an error
- Implementation review: matches the decision table — key check and replay-return check both passed; no open fixes
- If there is a gap, the expected results below still follow the decision table and the storage rule. Gap to watch later: none. This file does not change the app.

## Example deliveries
| Label | What happened in the game | Idempotency key value | Game time | Arrival order | Case |
| --- | --- | --- | --- | --- | --- |
| D1 | Jordan scores a goal | prov-jordan-1012 | 10:12 | 1 | first save |
| D2 | Same Jordan goal sent again after a timeout | prov-jordan-1012 | 10:12 | 2 | duplicate |
| D3 | Later goal arrives first (Avery at 12:00) | prov-avery-1200 | 12:00 | 3 | first save |
| D4 | Earlier pass arrives after that later goal (Sam at 8:00) | prov-sam-0800 | 8:00 | 4 | out of order |

## Expected results (mine, from the rules, not from a run)
| Label | Expected stored stat after this delivery | Expected response | Decision-table case | Storage-rule phrase |
| --- | --- | --- | --- | --- |
| D1 | Jordan scores a goal — open event-outcome-decision-table.md; this is a first new event | 201 success — use the replay promise above (first save) | first save | one new key → one stored event |
| D2 | Same Jordan goal sent again after a timeout — look at Exact duplicate row; same key must not become a second goal | 201 success — use the replay promise above (replay) | duplicate | same key → do not insert again |
| D3 | Later goal arrives first (Avery at 12:00) — new key, so it is saved | 201 success — use the replay promise above (first save) | first save | new key → keep it |
| D4 | Earlier pass arrives after that later goal (Sam at 8:00) — look at Out-of-order arrival row | 201 success — use the replay promise above (first save of a new key) | out of order | new key late → keep it anyway |

## Snapshot after the whole list
- Goals stored: count goals once; D1 and D2 are the same goal
- Other events stored: say in plain words what stayed after the out-of-order pair
- I did not run this list. There is no actual-result column.