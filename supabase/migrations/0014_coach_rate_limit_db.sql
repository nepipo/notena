-- Fixed-Window Rate-Limit für den KI-Coach (1 Stunde, 20 Nachrichten).
-- Atomar via INSERT ... ON CONFLICT — race-condition-sicher auf allen Vercel-Instanzen.

CREATE TABLE IF NOT EXISTS public.coach_rate_limit (
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hour_bucket TIMESTAMPTZ NOT NULL,  -- date_trunc('hour', now())
  count       INTEGER     NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, hour_bucket)
);

ALTER TABLE public.coach_rate_limit ENABLE ROW LEVEL SECURITY;
-- Kein direkter User-Zugriff — nur via SECURITY DEFINER RPC erlaubt.

CREATE OR REPLACE FUNCTION public.check_coach_rate_limit(p_limit INT DEFAULT 20)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id   UUID        := auth.uid();
  v_bucket    TIMESTAMPTZ := date_trunc('hour', now());
  v_count     INT;
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
    'allowed',   v_count <= p_limit,
    'count',     v_count,
    'remaining', GREATEST(0, p_limit - v_count),
    'reset_at',  (v_bucket + INTERVAL '1 hour')::text
  );
END;
$$;
