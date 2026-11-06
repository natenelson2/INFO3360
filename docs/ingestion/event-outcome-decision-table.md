# Event outcome decision table

Checked against: docs/ingestion/duplicate-delivery-impact.md

## Rules this table must not break

1. A second delivery of the same goal must not raise the goal count.
2. An event that arrives late must not be dropped forever.

## Outcomes

| Case | What arrived | Stored-stat outcome | What we tell the sender |
| --- | --- | --- | --- |
| Exact duplicate | Same event, same facts, again | Stats do not change. The goal is not counted a second time. | Already saved. Not a failure. Not a new event. |
| Out-of-order arrival | An earlier game moment arrives after a later one | If it is new, save it anyway. Do not reject it for being late. Do not delete what is already stored. | Saved, if it was new. If it was already saved, use the duplicate answer. |
| Partial batch | A group arrives and only some events are saved | Each new valid event is saved once. Saved neighbors stay saved. A retry must not add a second copy. | Which ones saved and which did not, so only failures are retried. |
| Late correction | Same event, different facts | Still one event. Stats match the corrected facts. No second stat line. New facts are not ignored. | Correction applied. Not ignored as a duplicate. Not created as a new event. |
| Provider outage | Nothing could be delivered, or a save did not succeed | Do not invent missing goals. Unsaved events are absent. A later resend is stored once. | Not saved, if the save failed. Never say saved unless it was stored. |

## Learner critique

I kept the out-of-order stored-stat sentence on purpose: a minute-8 pass that shows up after a minute-12 goal is still saved, so we do not drop a late event forever just because a later moment already landed. I also kept exact duplicate separate from late correction: a repeated minute-10 goal leaves the goal count alone, while a corrected minute-10 goal updates the facts once and still does not add a second goal. That is how this table matches the impact note without inventing a new storage design.

## Left for later steps

- Which fields make two deliveries the same event
- The words and status codes in the existing contract
- How storage is implemented
- What the provider may safely retry, and how often