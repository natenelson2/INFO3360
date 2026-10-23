-- supabase/migrations/20260418120000_least_privilege_new_staff_roles.sql
--
-- HEADER (sources and inventory lock)
-- Sources:
--   1) docs/access/access-matrix-v2.md
--   2) docs/access/overgrant-audit.md
--   3) docs/access/service-role-key-rule.md
-- Existing style (followed, not replaced):
--   supabase/migrations/20250321000000_hockey_staff_rls.sql
--   Roles are staff-table labels on public.staff_profiles.role
--   (coaching | scouting | medical | assistant_scout | video_analyst),
--   resolved by public.current_staff_role() for auth.uid().
--   Not a second Postgres LOGIN role system. Not a client-sent claim.
--
-- Tables touched (all named in the over-grant audit):
--   staff_profiles, staff_athlete_assignments, scouting_notes,
--   sports_science_records, practice_or_game_plans, players, games, events
--
-- Database views touched:
--   none — the audit listed no CREATE VIEW / no view names.
--   This migration does NOT invent a new business view.
--
-- Medical / sports-science columns that any shared scouting or game view
-- must omit if one is added later (from audit + matrix sealed rule):
--   sports_science_records.measure_label
--   sports_science_records.measure_value
--   sports_science_records.notes
--   players.notes  (free-text player-card notes; not shared identity)
--   Seed / app roster status "ir" (audit shared-screen medical flag; not a
--   Postgres column in migrations — enforce in app screens, not invent here)
--
-- Server functions touched (audit-listed names only):
--   public.current_staff_role()
--   public.staff_covers_athlete(uuid, text)
--   public.player_event_counts_for_game(uuid)
--
-- Service-role key:
--   Staff requests must not run as the master key.
--   Allowed server jobs in docs/access/service-role-key-rule.md: none.
--   This file contains no key, token, connection string, or env value.
--
-- No new business tables. No screens. No React. No test files.

-- ---------------------------------------------------------------------------
-- 1) Extend staff_profiles.role labels for the two new jobs (matrix names).
--    Keep the existing staff-table label style from the earlier RLS migration.
-- ---------------------------------------------------------------------------

ALTER TABLE public.staff_profiles
  DROP CONSTRAINT IF EXISTS staff_profiles_role_check;

ALTER TABLE public.staff_profiles
  ADD CONSTRAINT staff_profiles_role_check
  CHECK (
    role IN (
      'coaching',
      'scouting',
      'medical',
      'assistant_scout',
      'video_analyst'
    )
  );

-- ---------------------------------------------------------------------------
-- 2) Tighten audit over-grant: player_event_counts_for_game must not be
--    callable by anon (or as a staff shortcut via service_role).
--    Authenticated signed-in staff may still EXECUTE; RLS on underlying
--    tables applies (SECURITY INVOKER).
-- ---------------------------------------------------------------------------

-- Role: anonymous caller | Action: Deny | Data: player_event_counts_for_game RPC
REVOKE EXECUTE ON FUNCTION public.player_event_counts_for_game(uuid) FROM anon;

-- Role: any staff path via master key | Action: Never | Data: same RPC
-- (service-role key rule allow list is none; do not keep EXECUTE for service_role)
REVOKE EXECUTE ON FUNCTION public.player_event_counts_for_game(uuid) FROM service_role;

-- Role: signed-in staff | Action: allow EXECUTE only | Data: game event aggregates
GRANT EXECUTE ON FUNCTION public.player_event_counts_for_game(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 3) scouting_notes — add assistant_scout (See, add, change) and
--    video_analyst (See only) on scouting caseload assignments.
--    Do not remove existing scouting policies. Coaching/medical stay Deny
--    by absence of policies for those roles.
-- ---------------------------------------------------------------------------

-- Role: assistant_scout | Action: See (allow SELECT) | Data: scouting_notes on scouting caseload
DROP POLICY IF EXISTS "scouting_notes_select_assistant_scout_caseload" ON public.scouting_notes;
CREATE POLICY "scouting_notes_select_assistant_scout_caseload"
  ON public.scouting_notes
  FOR SELECT
  TO authenticated
  USING (
    public.current_staff_role() = 'assistant_scout'
    AND public.staff_covers_athlete(athlete_id, 'scouting')
  );

-- Role: assistant_scout | Action: add (allow INSERT) | Data: scouting_notes on scouting caseload
DROP POLICY IF EXISTS "scouting_notes_insert_assistant_scout_caseload" ON public.scouting_notes;
CREATE POLICY "scouting_notes_insert_assistant_scout_caseload"
  ON public.scouting_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.current_staff_role() = 'assistant_scout'
    AND author_id = auth.uid()
    AND public.staff_covers_athlete(athlete_id, 'scouting')
  );

-- Role: assistant_scout | Action: change (allow UPDATE) | Data: scouting_notes on scouting caseload
DROP POLICY IF EXISTS "scouting_notes_update_assistant_scout_caseload" ON public.scouting_notes;
CREATE POLICY "scouting_notes_update_assistant_scout_caseload"
  ON public.scouting_notes
  FOR UPDATE
  TO authenticated
  USING (
    public.current_staff_role() = 'assistant_scout'
    AND public.staff_covers_athlete(athlete_id, 'scouting')
  )
  WITH CHECK (
    public.current_staff_role() = 'assistant_scout'
    AND author_id = auth.uid()
    AND public.staff_covers_athlete(athlete_id, 'scouting')
  );

-- Role: video_analyst | Action: See (allow SELECT only) | Data: scouting_notes on scouting caseload
DROP POLICY IF EXISTS "scouting_notes_select_video_analyst_caseload" ON public.scouting_notes;
CREATE POLICY "scouting_notes_select_video_analyst_caseload"
  ON public.scouting_notes
  FOR SELECT
  TO authenticated
  USING (
    public.current_staff_role() = 'video_analyst'
    AND public.staff_covers_athlete(athlete_id, 'scouting')
  );

-- Intentionally NO INSERT/UPDATE/DELETE policies for video_analyst on scouting_notes
-- (matrix: See only). Intentionally NO DELETE for assistant_scout (matrix: no delete).

-- ---------------------------------------------------------------------------
-- 4) sports_science_records — sealed for new jobs (default deny).
--    Existing medical caseload policies from the earlier migration stay.
--    No new policy for assistant_scout or video_analyst.
-- ---------------------------------------------------------------------------

-- Role: assistant_scout | Action: Deny | Data: sports_science_records
-- (no policy on purpose — default deny)
-- Role: video_analyst | Action: Deny | Data: sports_science_records
-- (no policy on purpose — default deny)
-- Role: medical | Action: unchanged allow on care caseload | Data: sports_science_records
-- (policies from 20250321000000_hockey_staff_rls.sql left in place)

-- ---------------------------------------------------------------------------
-- 5) players — shared identity SELECT for new jobs; keep coaching/scouting/medical.
--    Matrix: assistant_scout and video_analyst Deny on players.notes column.
--    Audit listed no database view to replace, so this file does not CREATE VIEW
--    and does not SELECT *. App queries for those roles must omit players.notes.
-- ---------------------------------------------------------------------------

-- Role: coaching, scouting, medical, assistant_scout, video_analyst | Action: See shared identity | Data: players rows
DROP POLICY IF EXISTS "players_select_staff_roles" ON public.players;
CREATE POLICY "players_select_staff_roles"
  ON public.players
  FOR SELECT
  TO authenticated
  USING (
    public.current_staff_role() IN (
      'coaching',
      'scouting',
      'medical',
      'assistant_scout',
      'video_analyst'
    )
  );

-- No INSERT/UPDATE/DELETE policies on players for staff (unchanged deny writes).

-- ---------------------------------------------------------------------------
-- 6) games and events — enable RLS (audit: who-can was unknown / no policies).
--    Matrix: See game data for coaching, scouting, assistant_scout, video_analyst.
--    Matrix: Deny game data for medical.
--    Columns granted are non-medical game fields only (no sports_science columns
--    exist on these tables per audit).
-- ---------------------------------------------------------------------------

ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.games FROM anon;
REVOKE ALL ON TABLE public.events FROM anon;

GRANT SELECT ON TABLE public.games TO authenticated;
GRANT SELECT ON TABLE public.events TO authenticated;

-- Role: coaching, scouting, assistant_scout, video_analyst | Action: See | Data: games
DROP POLICY IF EXISTS "games_select_game_ops_roles" ON public.games;
CREATE POLICY "games_select_game_ops_roles"
  ON public.games
  FOR SELECT
  TO authenticated
  USING (
    public.current_staff_role() IN (
      'coaching',
      'scouting',
      'assistant_scout',
      'video_analyst'
    )
  );

-- Role: medical | Action: Deny | Data: games
-- (no medical policy on purpose — default deny)

-- Role: coaching, scouting, assistant_scout, video_analyst | Action: See | Data: events
DROP POLICY IF EXISTS "events_select_game_ops_roles" ON public.events;
CREATE POLICY "events_select_game_ops_roles"
  ON public.events
  FOR SELECT
  TO authenticated
  USING (
    public.current_staff_role() IN (
      'coaching',
      'scouting',
      'assistant_scout',
      'video_analyst'
    )
  );

-- Role: medical | Action: Deny | Data: events
-- (no medical policy on purpose — default deny)

-- ---------------------------------------------------------------------------
-- 7) practice_or_game_plans — schedule_context See for new jobs (game/schedule
--    context only). Do not grant full strategy body. Keep coaching and scouting
--    policies from the earlier migration. Medical stays Deny.
-- ---------------------------------------------------------------------------

-- Role: assistant_scout | Action: See | Data: practice_or_game_plans schedule_context only
DROP POLICY IF EXISTS "plans_select_assistant_scout_schedule_context" ON public.practice_or_game_plans;
CREATE POLICY "plans_select_assistant_scout_schedule_context"
  ON public.practice_or_game_plans
  FOR SELECT
  TO authenticated
  USING (
    public.current_staff_role() = 'assistant_scout'
    AND visibility = 'schedule_context'
  );

-- Role: video_analyst | Action: See | Data: practice_or_game_plans schedule_context only
DROP POLICY IF EXISTS "plans_select_video_analyst_schedule_context" ON public.practice_or_game_plans;
CREATE POLICY "plans_select_video_analyst_schedule_context"
  ON public.practice_or_game_plans
  FOR SELECT
  TO authenticated
  USING (
    public.current_staff_role() = 'video_analyst'
    AND visibility = 'schedule_context'
  );

-- ---------------------------------------------------------------------------
-- 8) Service-role / staff-request reminder (no secret stored here)
-- ---------------------------------------------------------------------------

-- Staff browser and staff server paths for assistant_scout, video_analyst,
-- coaching, scouting, and medical must use the signed-in user (anon key +
-- session), never the service-role master key.
-- docs/access/service-role-key-rule.md allowed list: none.