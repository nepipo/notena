-- Sicherheits-Hardening: p_limit-Parameter aus check_coach_rate_limit entfernen.
-- Vorher konnte jeder authenticated User via REST-API /rpc/check_coach_rate_limit
-- mit p_limit=999999 das 20/h-Limit umgehen und unbegrenzt Claude-API-Calls auslösen.
-- Fix: Limit auf 20 hardcoden, Parameter entfernen, kein Bypass mehr möglich.

DROP FUNCTION IF EXISTS public.check_coach_rate_limit(p_limit integer);

CREATE OR REPLACE FUNCTION public.check_coach_rate_limit()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id   UUID        := auth.uid();
  v_bucket    TIMESTAMPTZ := date_trunc('hour', now());
  v_count     INT;
  v_limit     CONSTANT INT := 20;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Nicht authentifiziert';
  END IF;

  -- Atomares Increment: verhindert Race Conditions bei parallelen Requests
  INSERT INTO public.coach_rate_limit (user_id, hour_bucket, count)
  VALUES (v_user_id, v_bucket, 1)
  ON CONFLICT (user_id, hour_bucket) DO UPDATE
    SET count = public.coach_rate_limit.count + 1
  RETURNING count INTO v_count;

  -- Alte Stunden-Buckets aufräumen (nur eigene, older than 2h)
  DELETE FROM public.coach_rate_limit
  WHERE user_id = v_user_id
    AND hour_bucket < v_bucket - INTERVAL '1 hour';

  RETURN json_build_object(
    'allowed',   v_count <= v_limit,
    'count',     v_count,
    'remaining', GREATEST(0, v_limit - v_count),
    'reset_at',  (v_bucket + INTERVAL '1 hour')::text
  );
END;
$$;

-- Nur authenticated darf aufrufen — anon bleibt revoked (war schon via 0017 gesetzt)
GRANT EXECUTE ON FUNCTION public.check_coach_rate_limit() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.check_coach_rate_limit() FROM anon;
