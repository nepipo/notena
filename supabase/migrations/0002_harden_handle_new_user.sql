-- =====================================================================
-- Notena — Hardening: handle_new_user() darf nicht per RPC aufrufbar sein.
--
-- Hintergrund: Supabase-Linter (0028/0029) markiert SECURITY DEFINER-Funktionen
-- im public-Schema als Risiko, weil sie ueber /rest/v1/rpc von aussen aufrufbar
-- sind. Unsere Funktion ist ausschliesslich fuer den Trigger gedacht.
-- =====================================================================

revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;
