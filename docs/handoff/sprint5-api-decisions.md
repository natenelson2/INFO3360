# Sprint 5 API decisions — stakeholder handoff

Audience: coaches and the product owner (non-engineers).  
Sources used (do not contradict these):

- `docs/scoping/client-story-brief.md`
- `docs/api/resource-design.md`
- `openapi/hockey-ingestion.yaml`
- `docs/api/acceptance-criteria.md`

## 1. What we set out to do

Hockey operations asked for two separate jobs this season—not one big “sports app.”

First, an outside hockey data company needs to send live game facts into our system when play happens, and get a clear yes or no back. That is the provider handoff from the client story: they start it, they send who / what / when style facts, and they must not be left guessing whether we took the data.

Second, after practice a coach needs to turn in a player evaluation (their judgment of a player for that session) and know it landed for hockey operations. That is the coach handoff from the same brief. It is not the same path as the provider push, and it is not a coach typing game events by hand.

## 2. What we delivered this sprint

Each item below is something a coach or product owner can rely on—not just a file name.

- **Client story brief** (`docs/scoping/client-story-brief.md`): We wrote down, in plain terms, the two jobs above and what “done” means for the provider and for the coach.
- **Resource design** (`docs/api/resource-design.md`): We locked two kinds of records only—**game events** and **evaluation forms**—and how they are sent: `POST /game-events` (provider) and `POST /evaluation-forms` (coach). We did **not** add browse, edit, or delete doors for either record.
- **Shared contract** (`openapi/hockey-ingestion.yaml`): One written agreement for what a good event looks like, what a good evaluation looks like, what a success answer looks like, and what a problem answer looks like. Providers and our own team should not each invent a different shape.
- **Server-side checks and field-level errors**: Our back-end—not a checkbox on a screen—is the final say on accept or reject. If something is missing or the wrong kind of value, the answer names the field and the problem.
- **Acceptance criteria** (`docs/api/acceptance-criteria.md`): Written “pass / fail” stories so we can prove a complete submission is welcomed and a broken one is refused with the field called out.

## 3. Decisions a stakeholder must know

### Resources and methods

Copied from the resource design and the shared contract—not reinvented:

| Resource | Path | Method | What success looks like | What a typical failure looks like |
| --- | --- | --- | --- | --- |
| Game event | `/game-events` | POST | Status **201** — we accepted a new event and return it with a server id | Status **422** if a field fails rules (for example missing `period`); status **400** if the body is not usable JSON |
| Evaluation form | `/evaluation-forms` | POST | Status **201** — we accepted a new evaluation and return it with a server id | Status **422** if a field fails rules (for example missing `notes`); status **400** if the body is not usable JSON |

Also already specified on the event create (not invented here): **401** / **403** when identity is missing or not allowed, and **409** when the provider sends an event id we already stored. Evaluation create does **not** use **409** in the status map.

We did **not** open list, read-one, change, or delete for either resource this sprint.

### Error format

When something is missing or the wrong shape, the server does not answer with a vague “something went wrong.” It returns a structured list: which field, a short machine code, and a human message (properties `field`, `code`, and `message` inside `error.details`). That shape is already in the shared contract. We are not inventing a second error format.

### What we deliberately deferred

- **Identity:** We do not yet prove the caller is really the hockey data provider, or which coach is submitting. The contract names **401** / **403** for those situations, but the full “who are you?” process is next work.
- **Persistence:** We do not yet save accepted events or evaluations into a lasting team database. A success answer today means “passed our checks,” not “it is filed in the club archive forever.”
- **Screens:** We did not build the coach form UI in this topic.
- **Browse / change / delete:** Staff cannot yet look up, fix, or remove events or evaluations through these doors—that was left out of the resource design on purpose.
- **Drafts:** Whether a coach may save a half-finished evaluation is still an open product question, not a silent feature.

## 4. Who owns what

### Frontend

Belongs here: clear labels on a future coach form, empty-state copy, and showing the field problems the server returned so a coach can fix them. A check in the browser is helpful for speed, but it is **never** the final say—the server still decides.

### Backend

Belongs only on the server: take the request, run the agreed checks, and answer with success (**201**) or field-level problems that match the contract (**422**, or **400** when the body is not readable JSON). This memo does not add new doors beyond what is already designed.

### Database

Storage is **out of scope** this sprint. We are not claiming tables, columns, or a cloud database already hold events or evaluations.

### Manual process

What stays human: a coach still watches practice, decides a player needs an evaluation, writes the judgment, and later reviews what was submitted. The system does not replace coaching judgment, line decisions, or development plans.

## 5. What the next Sprint 5 topic should implement first

Numbered, in this order—do not swap them:

1. **Identity** for the provider and for coaches (who is allowed to send a create).
2. **Persistence** (save an accepted submission after it passes validation).

Why identity comes before persistence: we should not store writes we cannot attribute. Saving first would create a pile of events and evaluations with no trustworthy “who sent this?”

## 6. Open questions for the next topic

Only questions, not new doors:

- How does the provider prove it is the provider?
- How does a coach prove who they are when they submit an evaluation?
- How long do we keep an evaluation after a coach submits it?
- Once we save events, who on hockey operations may read them, and how?
- Should a coach be allowed to save a draft evaluation, or only a complete submit?
- Should the live app addresses match the contract names `/game-events` and `/evaluation-forms` exactly (today the running handlers also expose `/api/events` and `/api/evaluations`)?