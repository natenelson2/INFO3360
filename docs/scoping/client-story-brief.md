Hockey Event Ingestion — Client Story Brief

Restated client story

Hockey operations wants our app to handle two separate jobs—not one blended “sports platform.”

Job 1 — Outside provider → game events. An outside hockey data provider sends game events into our system when play produces them. The provider starts the handoff. They give us the event facts for a game. When the job is done, they should know we accepted what they sent (or that we refused it for a clear reason). This is not a coach typing events by hand.

Job 2 — Coach → player evaluation after practice. After practice, a coach submits a player evaluation. The coach starts this job. They hand over their judgment of a player from that practice. When the job is done, the coach should know the evaluation was received and is available for hockey operations to use. This is not the same path as the provider push.

These jobs stay separate. Provider traffic is machine-to-machine game facts. Coach work is a person submitting an evaluation after practice. Mixing them would hide who starts each job and what “done” means.



Workflows

Workflow A — Provider pushes game events





Trigger (what starts this): The outside hockey data provider has game events to send and pushes them to our app.



What the provider sends: Game event facts for a hockey game (who / what / when as the provider packages them). Exact field lists are not decided in this brief.



What our app should do with it: Accept the push if the sender is trusted and the payload is usable; keep the events for the team; refuse unclear or untrusted pushes without pretending they landed.



What “done” looks like for the provider: They get a clear outcome that the events were accepted or rejected—not silence about whether the handoff worked.

Workflow B — Coach submits a player evaluation





Trigger (what starts this): Practice is over and the coach is ready to submit a player evaluation.



What the coach fills in: An evaluation of a player tied to that practice context (judgment and notes the coach chooses to include). Exact form fields are not decided here.



What our app should do with it: Take the coach’s submission, keep it for hockey operations, and show the coach that the handoff finished—or that something still needs fixing before it counts as submitted.



What “done” looks like for the coach: They know the evaluation was successfully submitted (or clearly not), without treating this as the same path as provider game events.



Actors







Actor



Role in this story



What they want





Third-party hockey data provider



Outside system that pushes game events



A reliable way to hand off game events and know whether we took them





Coach



Staff member who evaluates players after practice



A clear way to submit a player evaluation and know it landed

No other actors are named in this story. Fans, parents, and league officials are not added here.



Goals





Provider goal: Deliver game events to the team’s app and get a clear accept/reject outcome.



Coach goal: Submit a player evaluation after practice and confirm it was received.



Team / app goal: Keep the two handoffs separate, trustworthy, and usable for hockey operations—without inventing extra products around them.



Success criteria





Provider: this worked when a pushed set of game events is either clearly accepted or clearly rejected, and accepted events are available to the team.



Coach: this worked when the coach finishes an after-practice evaluation submission and can tell that it was received (or what still blocks it).



Team: this worked when staff can tell provider events and coach evaluations apart, and neither job depends on inventing actors or screens this story never asked for.



Questions we must not skip





How do we know the provider is who they say they are?



Can a pushed event be corrected later? If yes, who is allowed to correct it, and when?



Is a draft evaluation allowed, or must every coach submission be complete?



Who on the team may read coach evaluations after they are submitted?



What happens if the provider sends the same event more than once?



Explicitly out of scope for this brief

This page captures what people need, not how the software is built. Do not list web addresses, button layouts, or database tables here. Those decisions come in later steps and must answer this brief, not replace it.

Also out of scope here: status numbers, screen wireframes, login design, invented field catalogs, and any workflow that merges provider pushes with coach evaluations into one path.