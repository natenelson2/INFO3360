Why a second delivery corrupts coach stats

What this note is

This note explains a delivery problem for the hockey app: the same game fact can show up more than once when the outside data provider is unsure whether we saved it. It does not change the ingestion endpoint, HTTP status codes, server-side validation, or the OpenAPI contract from the first Sprint 5 tutorial.

The endpoint we already have

We already have an ingestion door that receives hockey game events from the third-party provider (POST /game-events in the shared contract; the running app also exposes that create through the existing events route). We are not rebuilding that door, and we are not redesigning how it checks or answers.

Why a timeout makes the provider try again

A timeout means the data provider sent an event, waited, and got no answer in time. It cannot tell whether our app saved the event or never saw it. Because of that uncertainty, it sends the event again (a retry). A retry is normal when the answer is missing—not proof that the provider is careless.

How the same event can arrive twice

Example: the provider sends one goal, the answer never comes back in time, and the provider sends that same goal again. If our app treats both arrivals as two separate goals, one real goal becomes two on the board.

How events can arrive out of order

Example: a pass late in a period is delayed on the wire, so a goal that happened after that pass arrives first. The coach’s timeline then shows the goal before the pass that set it up, even though that is not how the play happened on the ice.

What one double-counted goal costs coaches

If one goal is counted twice, the score and a player’s goal total are both wrong. Coaches stop trusting the board because the app no longer matches what they saw at the rink.

Five cases this tutorial will rule on later

Do not decide what to store. Only name each case and what it means in one plain sentence.





Exact duplicate: the same event arrives again, unchanged.



Out-of-order: a later event arrives before an earlier one.



Partial batch: a group of events is sent together, but only some of them arrive.



Late correction: a fixed version arrives after the first version was already stored.



Provider outage: the provider stops sending, then comes back and may resend.

What this note does not decide

The correct stored result for each of those five cases is not chosen in this file.