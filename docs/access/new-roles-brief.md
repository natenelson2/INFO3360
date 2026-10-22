# New hockey staff roles brief

## Why this note exists

Hockey operations added two jobs mid-season: **assistant scout** and **video analyst**. This note is the contract later steps must follow. It does **not** rebuild staff sign-in, login checks, or the existing coaching / scouting / medical access rules from Sprint 4.

## Jobs already in the app (do not rebuild)

- **Coaching:** already built. Plans practices and games; must not receive scouting-note bodies or medical / sports-science rows.
- **Scouting:** already built. Records and reviews scouting notes for assigned athletes; must not receive medical / sports-science rows.
- **Medical:** already built. Works with sports-science / medical staff data for care caseload; must not receive scouting-note bodies.
- **Out of scope for this note:** staff sign-in, the checks that prove who is logged in, and the existing coaching / scouting / medical access matrix. Those stay as they are.

## New jobs

### Assistant scout

- **Who they are:** A junior scouting staff member who helps full scouts prepare and tidy player evaluations during the season.
- **Scouting information they need:** Scouting note bodies and evaluation text for athletes on the scouting caseload they support, plus shared player identity (name, position, jersey) used only to label those notes.
- **Game information they need:** Game schedule, opponent name, and final score / result context so they can write and review notes tied to real games.
- **What they must never see:** Medical data, sports-science data, and any medical flags. A medical flag on an otherwise allowed scouting screen is still a leak.

### Video analyst

- **Who they are:** A staff member who breaks down game video and clips for hockey operations so coaches and scouts can review play.
- **Scouting information they need:** Read access to scouting note text that describes player tendencies and opponent strengths or weaknesses for the games they are analyzing, plus shared player identity used only to label clips and reviews.
- **Game information they need:** Game schedule, opponent name, period and score context, and game-event facts used to find and label video (for example shift or play markers the product already treats as game data).
- **What they must never see:** Medical data, sports-science data, and any medical flags. A medical flag on an otherwise allowed scouting or game screen is still a leak.

## What stays sealed

- **Medical data:** Stays sealed from both new jobs. Neither the assistant scout nor the video analyst may read or write medical rows.
- **Sports-science data:** Stays sealed from both new jobs. Neither the assistant scout nor the video analyst may read or write sports-science rows.
- **Medical flags on shared screens:** Shared scouting or game screens must not show medical flags to either new job. Hiding the medical menu is not enough if a health label still appears on a player or game card those jobs can open.

## Out of scope

- Rebuilding staff sign-in or login UI.
- Rebuilding the checks that prove who is logged in.
- Rewriting the existing coaching / scouting / medical access matrix.
- Adding admin screens, dual-role rules, or break-glass medical access.
- Program code, database commands, or new permissions not listed in this note.

## What done means

- [ ] A teammate can tell what each new job may see (scouting information and game information) without guessing.
- [ ] A teammate can tell that medical data, sports-science data, and medical flags on shared screens stay sealed for both new jobs.
- [ ] Nothing in this note asks to rebuild sign-in or the old coaching / scouting / medical access matrix.

## Author self-check (places to re-read)

Decisions locked in this brief (not invented after the fact):

1. Assistant scout needs **scouting note bodies** for the caseload they support, and **schedule / opponent / score** game context.
2. Video analyst needs **read** of scouting note text for games they analyze, and **schedule / opponent / period-score / game-event** context for video labeling.
3. Both jobs are **denied** medical data, sports-science data, and medical flags on shared screens (stated under each job and again under "What stays sealed").
4. Coaching, scouting, medical, sign-in, and login checks are named **already built / out of scope**.

If a later draft adds injury status, availability health labels, or sports-science measures for either new job, that sentence is wrong and must be removed.