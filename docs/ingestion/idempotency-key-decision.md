What makes two deliveries the same hockey event

The question

When the provider sends something again, which facts must match before we treat the two deliveries as one hockey event?

Chosen identity (the idempotency key)

The provider’s stable event id for that happening — the field already named providerEventId on the game-event create in our shared contract. It comes from the provider. It is not the time we received the message, and it is not an id we invent fresh on each try. A timeout retry and a late correction of the same happening keep the same providerEventId; only the other event details may change on a correction.

My hockey check

When Jordan scores at 10:12 and the provider sends that goal twice after a timeout, both deliveries share the same providerEventId, so coaches still see one Jordan goal — not two.

Why an exact replay stays one event

An exact replay is the same goal sent again with the same details, including the same providerEventId. Because that id already identifies the saved happening, the replay matches and must not become a second stat line.

Why a correction can still be recognized

If the provider later fixes one detail — for example the assist on Jordan’s 10:12 goal — the corrected send still carries the same providerEventId. The full set of event details is not the key, so a fixed assist does not look like a brand-new goal.

Rejected: arrival time alone

A retry always arrives later than the first try, so “when we received it” is different even when the goal is the same. Using arrival time alone would store one Jordan goal as two stats coaches would not trust.

Rejected: a brand-new id on each delivery

If every POST invents a fresh id, the timeout retry looks like a different event even when the provider meant the same goal. One goal would become two stats on the board.

Another option I rejected

I also rejected using every detail in the message as the identity (a fingerprint of the whole body). An exact replay would match, but a late correction with one fixed assist would look like a new event, so coaches could still see a second goal or a stuck wrong assist instead of one corrected fact.

What this note does not decide

This note does not say what reply a replay should get, and it does not describe how stats are stored. Later steps do that. No code belongs in this file.