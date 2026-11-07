# Replay comparison

This note records what I predicted before the run and what the app actually did. I did not write a test. A coding agent replayed the set and reported the results. I filled this table.

## Replay set

- Set name (copied from docs/ingestion/replay-prediction.md): D1–D4 example deliveries (Jordan 10:12 goal, same goal replay, Avery 12:00 goal, Sam 8:00 pass)
- Source prediction: docs/ingestion/replay-prediction.md
- Rule used to judge the run: docs/ingestion/event-outcome-decision-table.md
- Promised response (copied in my own words from docs/ingestion/contract-replay-delta.md): A first save and a same-key replay both return the original 201 success body; the replay does not write again and is not treated as an error.
- Order sent: the same order named in the prediction note. I did not reorder it.

## Expected versus actual

| Delivery | What was sent | Expected stored stat | Actual stored stat | Expected response | Actual response | Matches decision table? |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Jordan scores a goal (`prov-jordan-1012`, 10:12) | Jordan’s 10:12 goal is stored once | Jordan’s goals = 1 | 201 success | 201 success | yes |
| 2 | Same Jordan goal sent again after a timeout (`prov-jordan-1012`, 10:12) | Still one Jordan goal; the duplicate does not add a second goal | Jordan’s goals stayed 1 (no second goal) | 201 success | 201 success | yes |
| 3 | Later goal arrives first (Avery at 12:00, `prov-avery-1200`) | Avery’s 12:00 goal is also stored | Avery’s goals = 1; Jordan’s stayed 1 | 201 success | 201 success | yes |
| 4 | Earlier pass arrives after that later goal (Sam at 8:00, `prov-sam-0800`) | Sam’s 8:00 pass is kept even though it arrived after Avery’s 12:00 goal | Sam’s pass was kept; store size = 3 | 201 success | 201 success | yes |

## Decision-table check

- Duplicate case — decision table says: If the same event with the same facts shows up again, the goal count does not go up, and the sender hears that it was already saved — not a failure and not a new event.
- Duplicate case — final actual stored stat: Jordan’s goals stayed at 1 after delivery 2.
- Out-of-order case — decision table says: If a new earlier moment arrives after a later one, save it anyway; do not reject it for being late; do not delete what is already stored.
- Out-of-order case — final actual stored stat: Sam’s 8:00 pass was kept after Avery’s 12:00 goal; both remained stored.

## Mismatches and fixes

- First-run mismatches: none
- If a row did not match the decision table, what I asked the agent to change: not needed
- Later-run actual results: not needed
- If my prediction was wrong but the run matched the decision table: not applicable — the run matched both my prediction and the decision table

## Proof

A retried goal is still counted once: yes.
The row that shows it: 2.
In plain language: When Jordan’s 10:12 goal was sent a second time after a timeout, coaches still saw one Jordan goal, not two.