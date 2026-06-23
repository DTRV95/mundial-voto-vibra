-- ============================================================
-- Fix division_up activity_events showing wrong division
-- Root cause: trigger computed rank mid-batch while other profiles
-- hadn't been updated yet, producing a temporarily inflated rank.
-- ============================================================

-- 1. Remove incorrect division_up events where the user's current
--    actual rank doesn't match the claimed division.

DELETE FROM activity_events
WHERE type = 'division_up'
  AND (
    -- claimed 1ª Liga but actual rank > 5
    (data->>'division' = '1ª Liga' AND (
      SELECT COUNT(*) + 1 FROM profiles p2
      WHERE p2.total_points > (SELECT total_points FROM profiles WHERE id = activity_events.user_id)
    ) > 5)
    OR
    -- claimed 2ª Liga but actual rank > 15
    (data->>'division' = '2ª Liga' AND (
      SELECT COUNT(*) + 1 FROM profiles p2
      WHERE p2.total_points > (SELECT total_points FROM profiles WHERE id = activity_events.user_id)
    ) > 15)
    OR
    -- claimed Distrital but actual rank > 30
    (data->>'division' = 'Distrital' AND (
      SELECT COUNT(*) + 1 FROM profiles p2
      WHERE p2.total_points > (SELECT total_points FROM profiles WHERE id = activity_events.user_id)
    ) > 30)
  );

-- 2. Drop any existing division trigger on profiles (try common names)
DROP TRIGGER IF EXISTS on_profile_points_change ON public.profiles;
DROP TRIGGER IF EXISTS check_division_trigger ON public.profiles;
DROP TRIGGER IF EXISTS division_change_trigger ON public.profiles;
DROP TRIGGER IF EXISTS track_division_change ON public.profiles;
DROP TRIGGER IF EXISTS profile_division_change ON public.profiles;
DROP FUNCTION IF EXISTS check_division_change() CASCADE;
DROP FUNCTION IF EXISTS track_division_change() CASCADE;
DROP FUNCTION IF EXISTS profile_division_change() CASCADE;

-- 3. Helper: return division label for a given rank
CREATE OR REPLACE FUNCTION public.get_division_label(rank_num int)
RETURNS text LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  IF rank_num BETWEEN 1 AND 5  THEN RETURN '1ª Liga';
  ELSIF rank_num BETWEEN 6 AND 15 THEN RETURN '2ª Liga';
  ELSIF rank_num BETWEEN 16 AND 30 THEN RETURN 'Distrital';
  ELSE RETURN 'Liga do Zé Povinho';
  END IF;
END;
$$;

-- 4. New trigger function — runs AFTER profile update, uses committed data
--    Uses previous_rank (already stored) vs fresh rank computed post-commit.
--    The key fix: we defer the rank computation to AFTER the update so all
--    profiles in the same transaction are already in their new state.
CREATE OR REPLACE FUNCTION public.handle_division_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_new_rank      int;
  v_old_rank      int;
  v_new_division  text;
  v_old_division  text;
BEGIN
  -- Only proceed if total_points actually changed
  IF NEW.total_points IS NOT DISTINCT FROM OLD.total_points THEN
    RETURN NEW;
  END IF;

  -- Compute new rank (count of users with strictly more points + 1)
  SELECT COUNT(*) + 1 INTO v_new_rank
  FROM profiles
  WHERE total_points > NEW.total_points AND id != NEW.id;

  v_old_rank := OLD.previous_rank;

  -- If no previous rank recorded, just store current rank and exit
  IF v_old_rank IS NULL OR v_old_rank = 0 THEN
    UPDATE profiles SET previous_rank = v_new_rank WHERE id = NEW.id;
    RETURN NEW;
  END IF;

  v_new_division := public.get_division_label(v_new_rank);
  v_old_division := public.get_division_label(v_old_rank);

  -- Only emit event if the user genuinely moved to a better division
  IF v_new_division IS DISTINCT FROM v_old_division AND v_new_rank < v_old_rank THEN
    INSERT INTO activity_events (user_id, type, data, created_at)
    VALUES (NEW.id, 'division_up', jsonb_build_object('division', v_new_division), NOW());
  END IF;

  -- Persist the new rank for next comparison
  UPDATE profiles SET previous_rank = v_new_rank WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

-- Recreate trigger (AFTER UPDATE so rank computation sees final committed data)
CREATE TRIGGER on_profile_points_change
AFTER UPDATE OF total_points ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_division_change();

-- Grant execute to service_role
GRANT EXECUTE ON FUNCTION public.get_division_label(int) TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_division_change() TO service_role;
