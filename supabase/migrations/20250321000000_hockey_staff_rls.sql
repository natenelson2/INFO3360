-- supabase/migrations/20250321000000_hockey_staff_rls.sql
-- Hockey Ops staff RLS — source of truth: docs/security/rls-policy-spec.md
-- Roles: coaching | scouting | medical (from staff_profiles, NOT client-sent role).
-- Same tables, different rows. No USING (true) on medical/sports-science data.
-- Coaching/medical must NOT read scouting_notes. Coaching/scouting must NOT read sports_science_records.

-- ---------------------------------------------------------------------------
-- 0) Supporting tables (create if missing so policies have columns to bind)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.staff_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('coaching', 'scouting', 'medical')),
  display_name text,
  created_at timestamptz DEFAULT now()
);

-- Assignment / caseload link (spec open question resolved for v1 migration shape).
CREATE TABLE IF NOT EXISTS public.staff_athlete_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  athlete_id uuid NOT NULL REFERENCES public.players (id) ON DELETE CASCADE,
  assignment_kind text NOT NULL CHECK (assignment_kind IN ('scouting', 'medical')),
  created_at timestamptz DEFAULT now(),
  UNIQUE (staff_user_id, athlete_id, assignment_kind)
);

CREATE TABLE IF NOT EXISTS public.scouting_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL REFERENCES public.players (id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  body text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sports_science_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL REFERENCES public.players (id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  measure_label text NOT NULL DEFAULT '',
  measure_value text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.practice_or_game_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  -- 'full' = coaching strategy; 'schedule_context' = scouting-readable schedule/opponent slice
  visibility text NOT NULL DEFAULT 'full'
    CHECK (visibility IN ('full', 'schedule_context')),
  body text NOT NULL DEFAULT '',
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ensure players exists from earlier migrations (001_scouting_schema.sql).
-- No schema change required beyond RLS below.

-- ---------------------------------------------------------------------------
-- 1) Role helper: resolve staff role for auth.uid() via staff_profiles
--    Spec § Identity linkage — forbid trusting a browser-sent role string.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.current_staff_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sp.role
  FROM public.staff_profiles sp
  WHERE sp.user_id = auth.uid()
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.current_staff_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_staff_role() TO authenticated;

-- Caseload helper: does the signed-in staff cover this athlete for a kind?
CREATE OR REPLACE FUNCTION public.staff_covers_athlete(
  p_athlete_id uuid,
  p_kind text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.staff_athlete_assignments a
    WHERE a.staff_user_id = auth.uid()
      AND a.athlete_id = p_athlete_id
      AND a.assignment_kind = p_kind
  );
$$;

REVOKE ALL ON FUNCTION public.staff_covers_athlete(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.staff_covers_athlete(uuid, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- 2) ENABLE ROW LEVEL SECURITY on every sensitive table in the spec
-- ---------------------------------------------------------------------------

ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_athlete_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scouting_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sports_science_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_or_game_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- Harden: authenticated may use tables; anon gets no direct privileges.
REVOKE ALL ON TABLE public.staff_profiles FROM anon;
REVOKE ALL ON TABLE public.staff_athlete_assignments FROM anon;
REVOKE ALL ON TABLE public.scouting_notes FROM anon;
REVOKE ALL ON TABLE public.sports_science_records FROM anon;
REVOKE ALL ON TABLE public.practice_or_game_plans FROM anon;

GRANT SELECT ON TABLE public.staff_profiles TO authenticated;
-- Assignments are provisioned by trusted admin/service paths in v1 (no write policies).
GRANT SELECT ON TABLE public.staff_athlete_assignments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.scouting_notes TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.sports_science_records TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.practice_or_game_plans TO authenticated;
GRANT SELECT ON TABLE public.players TO authenticated;

-- ---------------------------------------------------------------------------
-- 3) staff_profiles — users read their own profile only (identity linkage)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "staff_profiles_select_own" ON public.staff_profiles;
CREATE POLICY "staff_profiles_select_own"
  ON public.staff_profiles
  FOR SELECT
  TO authenticated
  USING (
    -- Spec: map auth.uid() → staff_profiles row
    user_id = auth.uid()
  );

-- No INSERT/UPDATE/DELETE policies for staff_profiles in v1 → default deny
-- (profiles are provisioned by trusted admin/service paths outside this migration).

-- ---------------------------------------------------------------------------
-- 4) staff_athlete_assignments — staff may read their own assignment rows
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "staff_assignments_select_own" ON public.staff_athlete_assignments;
CREATE POLICY "staff_assignments_select_own"
  ON public.staff_athlete_assignments
  FOR SELECT
  TO authenticated
  USING (staff_user_id = auth.uid());

-- Writes to assignments are admin/service for v1 (no permissive write policies).

-- ---------------------------------------------------------------------------
-- 5) scouting_notes
--    Spec: scouting SELECT/INSERT/UPDATE on assignment caseload.
--    Coaching DENY. Medical DENY. DELETE DENY for all (v1).
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "scouting_notes_select_scouting_caseload" ON public.scouting_notes;
CREATE POLICY "scouting_notes_select_scouting_caseload"
  ON public.scouting_notes
  FOR SELECT
  TO authenticated
  USING (
    -- Spec § scouting_notes SELECT — scouting Yes (assignment/caseload)
    public.current_staff_role() = 'scouting'
    AND public.staff_covers_athlete(athlete_id, 'scouting')
  );

DROP POLICY IF EXISTS "scouting_notes_insert_scouting_caseload" ON public.scouting_notes;
CREATE POLICY "scouting_notes_insert_scouting_caseload"
  ON public.scouting_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Spec § scouting_notes INSERT — scouting Yes; author must be current user
    public.current_staff_role() = 'scouting'
    AND author_id = auth.uid()
    AND public.staff_covers_athlete(athlete_id, 'scouting')
  );

DROP POLICY IF EXISTS "scouting_notes_update_scouting_caseload" ON public.scouting_notes;
CREATE POLICY "scouting_notes_update_scouting_caseload"
  ON public.scouting_notes
  FOR UPDATE
  TO authenticated
  USING (
    -- Spec § scouting_notes UPDATE — only rows already visible to scouting
    public.current_staff_role() = 'scouting'
    AND public.staff_covers_athlete(athlete_id, 'scouting')
  )
  WITH CHECK (
    -- Cannot reassign author/athlete to bypass RLS
    public.current_staff_role() = 'scouting'
    AND author_id = auth.uid()
    AND public.staff_covers_athlete(athlete_id, 'scouting')
  );

-- Intentionally NO DELETE policy on scouting_notes (spec: Deny for all roles v1).
-- Intentionally NO policy granting coaching or medical any access to scouting_notes.

-- ---------------------------------------------------------------------------
-- 6) sports_science_records — STRICT medical-only + care caseload
--    Spec: medical SELECT/INSERT/UPDATE. Coaching DENY. Scouting DENY.
--    No USING (true). DELETE DENY for all (v1).
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "sports_science_select_medical_caseload" ON public.sports_science_records;
CREATE POLICY "sports_science_select_medical_caseload"
  ON public.sports_science_records
  FOR SELECT
  TO authenticated
  USING (
    -- Spec § sports_science_records SELECT — medical Yes (care caseload only)
    public.current_staff_role() = 'medical'
    AND public.staff_covers_athlete(athlete_id, 'medical')
  );

DROP POLICY IF EXISTS "sports_science_insert_medical_caseload" ON public.sports_science_records;
CREATE POLICY "sports_science_insert_medical_caseload"
  ON public.sports_science_records
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Spec § sports_science_records INSERT — medical Yes
    public.current_staff_role() = 'medical'
    AND author_id = auth.uid()
    AND public.staff_covers_athlete(athlete_id, 'medical')
  );

DROP POLICY IF EXISTS "sports_science_update_medical_caseload" ON public.sports_science_records;
CREATE POLICY "sports_science_update_medical_caseload"
  ON public.sports_science_records
  FOR UPDATE
  TO authenticated
  USING (
    public.current_staff_role() = 'medical'
    AND public.staff_covers_athlete(athlete_id, 'medical')
  )
  WITH CHECK (
    public.current_staff_role() = 'medical'
    AND author_id = auth.uid()
    AND public.staff_covers_athlete(athlete_id, 'medical')
  );

-- Intentionally NO DELETE policy (spec Deny v1).
-- Intentionally NO coaching/scouting SELECT (stricter than scaffold demo).

-- ---------------------------------------------------------------------------
-- 7) practice_or_game_plans
--    Spec: coaching SELECT/INSERT/UPDATE (team-wide).
--    Scouting SELECT limited to visibility = schedule_context.
--    Medical DENY. DELETE DENY for all (v1).
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "plans_select_coaching_all" ON public.practice_or_game_plans;
CREATE POLICY "plans_select_coaching_all"
  ON public.practice_or_game_plans
  FOR SELECT
  TO authenticated
  USING (
    -- Spec § practice_or_game_plans SELECT — coaching Yes (team-wide)
    public.current_staff_role() = 'coaching'
  );

DROP POLICY IF EXISTS "plans_select_scouting_schedule_context" ON public.practice_or_game_plans;
CREATE POLICY "plans_select_scouting_schedule_context"
  ON public.practice_or_game_plans
  FOR SELECT
  TO authenticated
  USING (
    -- Spec § practice_or_game_plans SELECT — scouting Limited Yes
    public.current_staff_role() = 'scouting'
    AND visibility = 'schedule_context'
  );

DROP POLICY IF EXISTS "plans_insert_coaching" ON public.practice_or_game_plans;
CREATE POLICY "plans_insert_coaching"
  ON public.practice_or_game_plans
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Spec § practice_or_game_plans INSERT — coaching Yes
    public.current_staff_role() = 'coaching'
    AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS "plans_update_coaching" ON public.practice_or_game_plans;
CREATE POLICY "plans_update_coaching"
  ON public.practice_or_game_plans
  FOR UPDATE
  TO authenticated
  USING (public.current_staff_role() = 'coaching')
  WITH CHECK (public.current_staff_role() = 'coaching');

-- No medical policies on practice_or_game_plans (spec Deny).
-- No scouting INSERT/UPDATE/DELETE (spec Deny).
-- No DELETE policies (spec Deny v1).

-- ---------------------------------------------------------------------------
-- 8) players — shared roster fields (SELECT for all three staff roles)
--    Spec: coaching/scouting/medical R team-wide shared identity; writes Deny.
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "players_select_staff_roles" ON public.players;
CREATE POLICY "players_select_staff_roles"
  ON public.players
  FOR SELECT
  TO authenticated
  USING (
    -- Spec § players SELECT — all three roles Yes (shared identity)
    public.current_staff_role() IN ('coaching', 'scouting', 'medical')
  );

-- No INSERT/UPDATE/DELETE policies on players for staff (spec Deny v1).
