-- Performance-Indexes für die häufigsten Query-Pfade.
-- Ohne diese Indexes macht Postgres bei 10k+ Usern Full Table Scans.
-- IF NOT EXISTS — idempotent, kann mehrfach ausgeführt werden.

-- schule_fach: häufigste Query ist user_id + halbjahr (Dashboard, Noten, Coach)
CREATE INDEX IF NOT EXISTS idx_schule_fach_user_halbjahr
  ON public.schule_fach(user_id, halbjahr);

-- schule_note: wird ausschließlich über fach_id geladen (IN-Filter nach Fach-Lookup)
CREATE INDEX IF NOT EXISTS idx_schule_note_fach_id
  ON public.schule_note(fach_id);

-- schule_klausur: Date-Range-Queries (user_id + datum >= today)
CREATE INDEX IF NOT EXISTS idx_schule_klausur_user_datum
  ON public.schule_klausur(user_id, datum);

-- hausaufgabe: gefiltert nach user_id + erledigt, sortiert nach faellig_am
CREATE INDEX IF NOT EXISTS idx_hausaufgabe_user_erledigt_faellig
  ON public.hausaufgabe(user_id, erledigt, faellig_am);

-- stundenplan_stunde: Dashboard lädt Stunden für einen bestimmten Wochentag
CREATE INDEX IF NOT EXISTS idx_stundenplan_stunde_user_wochentag
  ON public.stundenplan_stunde(user_id, wochentag);

-- stundenplan_entfall: Date-Range-Query für die nächste Woche
CREATE INDEX IF NOT EXISTS idx_stundenplan_entfall_user_datum
  ON public.stundenplan_entfall(user_id, datum);

-- stundenplan_entfall: Coach-Kontext sucht Entfälle nach stunde_id
CREATE INDEX IF NOT EXISTS idx_stundenplan_entfall_stunde_id
  ON public.stundenplan_entfall(stunde_id);

-- audit_log: Rate-Limiter und Audit-Queries filtern nach user_id + Zeitfenster
CREATE INDEX IF NOT EXISTS idx_audit_log_user_created
  ON public.audit_log(user_id, created_at DESC);
