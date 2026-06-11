-- Security Hardening: anonyme User dürfen keine SECURITY DEFINER Funktionen aufrufen.
-- check_coach_rate_limit: anon-Rolle hatte EXECUTE — wird entzogen.
-- Die Funktion ist nur für eingeloggte User gedacht (nutzt auth.uid() intern).
REVOKE EXECUTE ON FUNCTION public.check_coach_rate_limit(integer) FROM anon;
