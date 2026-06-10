-- Audit-Log für destruktive Operationen (Fach löschen, Halbjahr löschen etc.)
-- Ermöglicht Post-mortem-Analyse wenn User versehentlich Daten löscht.

CREATE TABLE IF NOT EXISTS public.audit_log (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  aktion      TEXT        NOT NULL,        -- z.B. 'fach_loeschen', 'halbjahr_loeschen'
  entity_id   TEXT,                        -- ID des gelöschten Datensatzes
  entity_data JSONB,                       -- Snapshot der Daten vor dem Löschen
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- User darf nur eigene Logs lesen (kein Schreiben — nur via Server Action)
CREATE POLICY "user_liest_eigene_logs"
  ON public.audit_log FOR SELECT
  USING (auth.uid() = user_id);

-- Index für schnelle Abfragen nach User und Zeit
CREATE INDEX audit_log_user_created ON public.audit_log (user_id, created_at DESC);

-- Automatische Bereinigung: Logs älter als 90 Tage löschen
-- (optional, kann via pg_cron aktiviert werden)
-- SELECT cron.schedule('audit-log-cleanup', '0 3 * * *',
--   $$DELETE FROM public.audit_log WHERE created_at < now() - INTERVAL '90 days'$$);
