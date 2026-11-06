# Resource inventory — hockey event ingestion and coach evaluations

Source brief: `docs/scoping/client-story-brief.md`  
Scope rule: do **not** design URLs, HTTP methods, or status codes in this document.  
If the brief does not answer something, add it under Open questions. Do not invent a rule.

## 1. Actors

| Actor | What they want | Which flow they touch | Notes |
| --- | --- | --- | --- |
| Third-party hockey data provider | Hand off game events and get a clear accept or reject outcome | events | Outside system; starts the push; not a coach typing events |
| Coach | Submit a player evaluation after practice and know it landed | evaluations | Person; starts after practice; separate path from provider pushes |
| Hockey operations (team) | Keep accepted events and received evaluations available and distinguishable | both | Named in the brief as who uses kept records; not an extra product role |

The brief names no fans, parents, league officials, or a specific reviewer title (for example head coach). Who may read or mark an evaluation as reviewed is an open question, not a new invented actor.

## 2. Resource candidates

A resource candidate is a **named thing**, not a verb.  
Good: game event, evaluation form.  
Not a resource: "push events", "submit evaluation", "log in".

| Resource | Plain-language definition | Who creates it | Who reads it |
| --- | --- | --- | --- |
| Game event | One fact about something that happened in a hockey game, as handed off by the provider | Third-party hockey data provider | Hockey operations (once accepted); provider only needs the outcome of the handoff |
| Provider push outcome | The clear result of a handoff: accepted or rejected, with a plain reason when rejected | Our app (in response to the provider) | Third-party hockey data provider |
| Player evaluation | A coach’s written judgment of a player tied to a practice | Coach | Hockey operations (who exactly may read is unsettled); the coach needs confirmation it landed |
| Practice context | The practice the evaluation is about (enough to tie the judgment to that session) | Coach provides it with the evaluation | Coach; hockey operations when reading evaluations |

Not listed as resources: buttons, login, “push,” or “submit.”

## 3. Inputs and outputs

### Event ingestion

- Inputs (what arrives from the provider):
  - Game event facts packaged by the provider (brief: who / what / when as they send them)
  - Exact field list: **not settled in the brief** (see Open questions)
- Outputs (what we keep or send back):
  - Accepted game event(s) kept for the team, **or**
  - A clear rejection with a plain reason (untrusted sender, unusable payload, and similar)—without pretending the events landed
  - No silent “maybe it worked”

### Evaluation forms

- Inputs (what a coach provides):
  - Which player the evaluation is about
  - Practice context (after-practice timing)
  - The coach’s judgment and notes they choose to include
  - Exact form fields and rating scales: **not settled in the brief** (see Open questions)
- Outputs:
  - A kept player evaluation available for hockey operations, **or**
  - A clear signal that something still blocks a real submission
  - Confirmation to the coach that the handoff finished or did not

## 4. Workflow states

### Game events

| State | Who or what puts it here | What happens next |
| --- | --- | --- |
| received | Provider push arrives and is noticed by our app | Check whether the sender is trusted and the payload is usable |
| accepted | Our app keeps the event after trust and usability checks pass | Event is available to hockey operations; provider gets a clear accepted outcome |
| rejected | Our app refuses an untrusted or unusable push | Provider gets a clear rejected outcome; event is not treated as kept team data |

Names kept as received / accepted / rejected to match the brief’s accept-or-reject language. Correction after accept is **not** designed here (open question in the brief).

### Evaluation forms

| State | Who or what puts it here | What happens next |
| --- | --- | --- |
| draft | Coach is still writing (only if drafts are allowed) | Coach continues editing, or moves to submit when ready |
| submitted | Coach finishes a handoff the app treats as received | Evaluation is kept for hockey operations; coach sees that it landed |
| reviewed | A human on the team looks at a submitted evaluation (if that step exists) | Coaching follow-up stays with people; software does not invent the review rule |

Draft vs submit-only is unsettled in the brief; draft stays in the table because the brief asks whether drafts are allowed. Reviewed stays as a possible human step; who reviews is an open question—not a fake approval chain.

## 5. Approval and review points

| Decision | Who decides | May software decide this? | Why |
| --- | --- | --- | --- |
| Is this provider who they claim to be? | Team rule (how is unsettled); software may enforce a chosen check later | Partial | Software can enforce a rule once the team chooses one; choosing the rule is not automation of coaching |
| Is this push usable enough to accept? | Our app, using team rules for completeness / clarity | Yes (for mechanical checks) | Incomplete or nonsense payloads can be refused without a coach judging hockey |
| What does this evaluation say about the player? | Coach | No | Human coaching judgment |
| Is a submitted evaluation ready for whatever the team does next (share, act, file)? | Human on the team (who is unsettled) | No | Human coaching judgment; brief does not hand this to software |
| What is the player’s development plan? | Coach / hockey operations | No | Human coaching judgment; not part of the provider push |

## 6. System boundaries

Put a short note in **every** cell that applies. Leave a cell blank only if that box truly has no job.

| Concern | Frontend (screens) | Backend API (doorway) | Database (storage) | Manual coaching process |
| --- | --- | --- | --- | --- |
| Collect a coach evaluation | Coach-facing form to enter judgment after practice | Doorway that receives the coach’s evaluation handoff | Keep submitted (and draft, if allowed) evaluations | Coach decides what to write about the player |
| Accept a provider game event | Usually none for the provider push (machine-to-machine); staff may later view kept events | Doorway that receives the provider push and returns a clear accept or reject outcome | Keep accepted events for the team | Not a coaching typing job |
| Reject incomplete or invalid data | Show the coach what still blocks submit; provider has no coach screen | Refuse untrusted or unusable pushes; refuse incomplete evaluations when rules exist | Do not store rejected pushes as accepted team events | Coach fixes content; they do not “approve” provider trust |
| Keep an accepted record | Staff may later open kept events or evaluations (screens not designed here) | Confirm handoffs that should be kept | Store accepted events and received evaluations separately | Reading for coaching use is human; storage is not the judgment |
| Decide a player's development plan | — | — | — | Coaches / hockey operations decide; software does not |

## 7. What we will not automate

- What an evaluation says about a player (coach judgment)
- Whether a submitted evaluation is ready for the team’s next human use (share, act, file)
- A player’s development plan
- Choosing the business rule for how we trust the provider (software may enforce a rule later; inventing that rule is out of this inventory)

## 8. Open questions

- How do we know the provider is who they say they are?
- Can a pushed event be corrected later? If yes, who is allowed to correct it, and when?
- Is a draft evaluation allowed, or must every coach submission be complete?
- Who on the team may read coach evaluations after they are submitted?
- What happens if the provider sends the same event more than once?
- Which exact fields must arrive on a game event (beyond who / what / when in plain language)?
- Which exact fields must a coach fill on an evaluation (ratings, free text, required vs optional)?
- Does “reviewed” require a named role, or is reading by hockey operations enough?
- Should staff browse accepted events in the app in this product slice, or is “kept for the team” enough for now?