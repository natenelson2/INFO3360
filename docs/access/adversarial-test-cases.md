# Break-tests: who I will pretend to be

Status: not run yet. Do not write pass or fail in this file.

How I filled Expected: I copied allow or deny from docs/access/access-matrix-v2.md. I did not guess.

Rules:
- Use the same role names and data names as the access matrix.
- Do not write passwords, keys, or tokens in this file.
- Test-account secrets are environment variables. Names only, no values.

## Environment variable names (names only)

- Assistant scout email: `TEST_ASSISTANT_SCOUT_EMAIL`
- Assistant scout password: `TEST_ASSISTANT_SCOUT_PASSWORD`
- Video analyst email: `TEST_VIDEO_ANALYST_EMAIL`
- Video analyst password: `TEST_VIDEO_ANALYST_PASSWORD`
- Medical role email: `TEST_MEDICAL_EMAIL`
- Medical role password: `TEST_MEDICAL_PASSWORD`
- Public Supabase URL (anon client only): `VITE_SUPABASE_URL` or `SUPABASE_URL`
- Public anon key (never service-role): `VITE_SUPABASE_ANON_KEY` or `SUPABASE_ANON_KEY`

## Role and data names (from matrix + migration)

- Roles: Assistant scout (`assistant_scout`), Video analyst (`video_analyst`), Medical (`medical`)
- Scouting data: `scouting_notes`
- Game data: `games` / `events` (and schedule_context plans where relevant)
- Medical / sports-science data: `sports_science_records` (schema table for both sealed kinds)
- Shared view for identity (must omit medical flags / `players.notes`): `players_shared_identity`

## Required cases

### AS-READ-SCOUT

- Case id: AS-READ-SCOUT
- Actor: Assistant scout
- Action: read
- Target: `scouting_notes`
- Expected: allow
- Matrix cell: Assistant scout / Scouting notes / See, add, change
- Why: The matrix allows this job to see caseload scouting note bodies.
- Test name: `AS-READ-SCOUT`

### AS-READ-GAME

- Case id: AS-READ-GAME
- Actor: Assistant scout
- Action: read
- Target: `games`
- Expected: allow
- Matrix cell: Assistant scout / Game data / See
- Why: The matrix allows schedule and game context reads for this job.
- Test name: `AS-READ-GAME`

### VA-READ-SCOUT

- Case id: VA-READ-SCOUT
- Actor: Video analyst
- Action: read
- Target: `scouting_notes`
- Expected: allow
- Matrix cell: Video analyst / Scouting notes / See
- Why: The matrix allows read-only scouting note text for analysis.
- Test name: `VA-READ-SCOUT`

### VA-READ-GAME

- Case id: VA-READ-GAME
- Actor: Video analyst
- Action: read
- Target: `games`
- Expected: allow
- Matrix cell: Video analyst / Game data / See
- Why: The matrix allows game schedule and event context for video labeling.
- Test name: `VA-READ-GAME`

### AS-READ-MED

- Case id: AS-READ-MED
- Actor: Assistant scout
- Action: read
- Target: `sports_science_records` (medical / sealed staff care data)
- Expected: deny
- Matrix cell: Assistant scout / Medical records / Deny
- Why: The matrix denies medical data for this job.
- Test name: `AS-READ-MED`

### AS-CHANGE-MED

- Case id: AS-CHANGE-MED
- Actor: Assistant scout
- Action: change
- Target: `sports_science_records`
- Expected: deny
- Matrix cell: Assistant scout / Medical records / Deny
- Why: Deny means no read and no change of medical data.
- Test name: `AS-CHANGE-MED`

### AS-READ-SS

- Case id: AS-READ-SS
- Actor: Assistant scout
- Action: read
- Target: `sports_science_records`
- Expected: deny
- Matrix cell: Assistant scout / Sports-science data / Deny
- Why: The matrix denies sports-science measures for this job.
- Test name: `AS-READ-SS`

### AS-CHANGE-SS

- Case id: AS-CHANGE-SS
- Actor: Assistant scout
- Action: change
- Target: `sports_science_records`
- Expected: deny
- Matrix cell: Assistant scout / Sports-science data / Deny
- Why: Deny includes write attempts on sports-science rows.
- Test name: `AS-CHANGE-SS`

### VA-READ-MED

- Case id: VA-READ-MED
- Actor: Video analyst
- Action: read
- Target: `sports_science_records`
- Expected: deny
- Matrix cell: Video analyst / Medical records / Deny
- Why: The matrix denies medical data for this job.
- Test name: `VA-READ-MED`

### VA-CHANGE-MED

- Case id: VA-CHANGE-MED
- Actor: Video analyst
- Action: change
- Target: `sports_science_records`
- Expected: deny
- Matrix cell: Video analyst / Medical records / Deny
- Why: Deny means no change of medical data.
- Test name: `VA-CHANGE-MED`

### VA-READ-SS

- Case id: VA-READ-SS
- Actor: Video analyst
- Action: read
- Target: `sports_science_records`
- Expected: deny
- Matrix cell: Video analyst / Sports-science data / Deny
- Why: Performance on video is not sports-science data; matrix Deny.
- Test name: `VA-READ-SS`

### VA-CHANGE-SS

- Case id: VA-CHANGE-SS
- Actor: Video analyst
- Action: change
- Target: `sports_science_records`
- Expected: deny
- Matrix cell: Video analyst / Sports-science data / Deny
- Why: Deny includes write attempts on sports-science rows.
- Test name: `VA-CHANGE-SS`

### AS-FLAG-SHARED

- Case id: AS-FLAG-SHARED
- Actor: Assistant scout
- Action: read
- Target: `players_shared_identity` (shared view from migration / matrix shared scouting views)
- Expected: deny (medical flag must be absent, hidden, or rejected)
- Matrix cell: Assistant scout / Medical flags in shared scouting views / Deny
- Why: A flag on an allowed identity view is still medical information. The view must not expose `players.notes`, `ir`, or other medical-flag fields.
- Test name: `AS-FLAG-SHARED`

### VA-FLAG-SHARED

- Case id: VA-FLAG-SHARED
- Actor: Video analyst
- Action: read
- Target: `players_shared_identity`
- Expected: deny (medical flag must be absent, hidden, or rejected)
- Matrix cell: Video analyst / Medical flags in shared scouting views / Deny
- Why: Same sealed-flag rule for the video analyst on the same shared view.
- Test name: `VA-FLAG-SHARED`

### MED-READ-MED

- Case id: MED-READ-MED
- Actor: Medical
- Action: read
- Target: `sports_science_records`
- Expected: allow
- Matrix cell: Medical / Medical records / See, add, change (and Medical / Sports-science data / See, add, change)
- Why: Control case: medical staff on caseload must still be able to read sealed care data so denies for other roles are not a total outage.
- Test name: `MED-READ-MED`

## Extra case (not on the required list)

### AS-BASE-PLAYERS-NOTES

- Case id: AS-BASE-PLAYERS-NOTES
- Actor: Assistant scout
- Action: read
- Target: base table `players` column `notes`
- Expected: deny
- Matrix cell: Assistant scout / Player free-text `notes` column / Deny
- Why: Row RLS on the base table must not hand this job `players.notes`; identity goes through `players_shared_identity` only.
- Test name: `AS-BASE-PLAYERS-NOTES`