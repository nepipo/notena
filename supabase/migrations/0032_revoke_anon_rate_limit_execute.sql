-- check_coach_rate_limit() läuft als SECURITY DEFINER und war via REST für
-- anon aufrufbar. Anonym-User haben keinen Coach-Zugriff — EXECUTE von anon entziehen.
REVOKE EXECUTE ON FUNCTION public.check_coach_rate_limit() FROM anon;
