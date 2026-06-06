-- Erweiterte Gewichtungskonfiguration pro Fach (alle Kategorien + Klausur-Dynamik)
ALTER TABLE schule_fach
  ADD COLUMN IF NOT EXISTS gewichtung_config JSONB;

-- Globale Standard-Gewichtung im Nutzerprofil
ALTER TABLE nutzer_profil
  ADD COLUMN IF NOT EXISTS default_gewichtung JSONB;
