-- ============================================================
-- 0025: RLS Policy Fixes
-- ============================================================
-- Fix 1 (KRITISCH): briefing_cache UPDATE-Policy fehlt.
-- .upsert() braucht INSERT + UPDATE. INSERT-Policy existiert, UPDATE nicht →
-- jeder Cache-Write schlägt fehl → Claude API wird jedes Mal neu gerufen.
-- ============================================================
CREATE POLICY "Eigenes Briefing aktualisieren"
  ON public.briefing_cache
  FOR UPDATE
  USING (( SELECT auth.uid()) = user_id)
  WITH CHECK (( SELECT auth.uid()) = user_id);

-- ============================================================
-- Fix 2 (HOCH): audit_log INSERT-Policy fehlt.
-- Authenticated users können Zeilen lesen aber nicht schreiben.
-- ============================================================
CREATE POLICY "User kann eigene Logs schreiben"
  ON public.audit_log
  FOR INSERT
  WITH CHECK (( SELECT auth.uid()) = user_id);

-- ============================================================
-- Fix 3 (MITTEL): coach_rate_limit hat 0 Policies.
-- check_coach_rate_limit() ist SECURITY DEFINER und bypassed RLS —
-- die Funktion selbst funktioniert. Policies hier für Advisor-Compliance
-- und Defense-in-Depth (kein direkter Tabellen-Zugriff für User).
-- ============================================================
CREATE POLICY "User liest eigenes Rate-Limit"
  ON public.coach_rate_limit
  FOR SELECT
  USING (( SELECT auth.uid()) = user_id);

CREATE POLICY "User schreibt eigenes Rate-Limit"
  ON public.coach_rate_limit
  FOR INSERT
  WITH CHECK (( SELECT auth.uid()) = user_id);

CREATE POLICY "User aktualisiert eigenes Rate-Limit"
  ON public.coach_rate_limit
  FOR UPDATE
  USING (( SELECT auth.uid()) = user_id)
  WITH CHECK (( SELECT auth.uid()) = user_id);

CREATE POLICY "User löscht eigenes Rate-Limit"
  ON public.coach_rate_limit
  FOR DELETE
  USING (( SELECT auth.uid()) = user_id);
