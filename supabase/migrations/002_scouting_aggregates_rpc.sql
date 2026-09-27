-- supabase/migrations/002_scouting_aggregates_rpc.sql
-- Scout question: for a given game, how many events (and goals) did each player log?
-- Set-based: JOIN players ↔ events + GROUP BY (no PL/pgSQL row loops).

CREATE OR REPLACE FUNCTION public.player_event_counts_for_game(p_game_id uuid)
RETURNS TABLE (
  player_id uuid,
  player_name text,
  event_count bigint,
  goal_count bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT
    p.id AS player_id,
    p.full_name AS player_name,
    COUNT(e.id)::bigint AS event_count,
    COUNT(e.id) FILTER (WHERE e.event_type = 'goal')::bigint AS goal_count
  FROM public.players p
  INNER JOIN public.events e
    ON e.player_id = p.id
  WHERE e.game_id = p_game_id
  GROUP BY p.id, p.full_name
  ORDER BY event_count DESC, p.full_name ASC;
$$;

-- App scouting client uses the anon key; staff may also call as authenticated.
GRANT EXECUTE ON FUNCTION public.player_event_counts_for_game(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.player_event_counts_for_game(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.player_event_counts_for_game(uuid) TO service_role;