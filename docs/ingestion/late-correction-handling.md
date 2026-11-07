# Late correction handling

## What a late correction is

A late correction uses the same idempotency key as the stored event and changes at least one goal detail (for example the scorer). This is not an exact retry, because the details are different.

Idempotency key already chosen in docs/ingestion/idempotency-key-decision.md:

`providerEventId`

## Hockey example

First delivery (wrong details):
Provider sends a 10:12 goal with `providerEventId` `prov-goal-1012` credited to Player A.

Correction (same key, what changed):
Provider resends the same `prov-goal-1012` key, but the scorer is now Player B (other facts stay the same).

Who has the goal after the correction:
Player B

Who no longer has that goal:
Player A

Team goal total after the correction (must stay one):
1

## Storage rule

When the same `providerEventId` arrives again with changed goal details, the app replaces the stored details for that key.

Known limitation on which corrected copy is newest: the store does not use a provider version or sequence number; the latest arrival wins, so an older delayed copy can overwrite a newer correction if it shows up later.

 It does not insert a second goal. Stats must match the corrected facts, so the wrong scorer is removed and the correct scorer has the one goal.

Forbidden outcome 1, freezing the mistake:
Leaving Player A with the goal after the correction arrives.

Forbidden outcome 2, counting the goal twice:
Keeping Player A’s goal and also adding Player B’s goal (team total 2), or inserting a second stored event for the same key.

## Answer the provider gets

When details changed, the endpoint answers **201** with the corrected event body (the stored facts now show Player B). That tells the provider the correction was applied, not ignored.

Exact-retry answer already promised for unchanged details:
**201** with the original success body, no second write, and not an error — the replay promise in docs/ingestion/contract-replay-delta.md.

How the correction answer is different:
An exact retry leaves the stored details alone and returns the already-saved event. A correction updates the stored details first, then returns **201** with those new details so the provider can see the correction was applied. Both keep one stored event for the key; only the correction changes the facts.

## Check against the decision table

Late-correction row, in your own words, from docs/ingestion/event-outcome-decision-table.md:
Same event with different facts stays one event; stats match the corrected facts; no second stat line; new facts are not ignored. The sender hears that the correction was applied — not treated as a quiet duplicate and not created as a brand-new event.

Does this note match that row? Write yes, or write the clash and the replace-once resolution.
yes

## Check against the contract replay delta

What docs/ingestion/contract-replay-delta.md promises for an unchanged resend:
Return the original **201** success again, do not write a second time, and do not treat the resend as an error just because the key was already accepted.

Write that this promise stays only when the goal details are unchanged.
This replay promise applies only when the goal details are unchanged. A same-key resend with changed details is a late correction, not that exact-retry path.

## Agent instruction and review

What you asked the coding agent to do:
First: read the late-correction note (once written), the late-correction decision-table row, and the contract replay promise; describe in plain language what the app does today if the same `providerEventId` arrives with a different scorer; do not change files yet. Second: make the smallest change so changed details replace the stored stat, the goal stays one, and an unchanged resend still follows the replay promise — no new endpoint, no new key, no database change script.

What the agent reported for the corrected player, the original player, and the team total:
Today the app already replaces the stored scorer: after the correction, Player B has the goal (1), Player A has 0, the team total is 1, and the provider gets **201** with Player B on the body. An unchanged resend after that is still a replay (**201**, no second write). No file change was required.

Review result (matches, or the mismatch and the refined instruction):
matches — current behavior already replaces the details and still counts one goal; exact retries with unchanged details still follow the replay promise.

Sentence that confirms a bad stat can be replaced without counting the goal twice:
When the provider corrects Player A to Player B on the same `providerEventId`, coaches see the one goal move to Player B and the team total stays one.