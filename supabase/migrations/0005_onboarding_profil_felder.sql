-- =====================================================================
-- Notena — Onboarding-Profilfelder
-- Ergaenzt nutzer_profil um die im Onboarding erfassten Felder.
-- Alle nullable -> additive Aenderung, kein Tabellen-Lock-Risiko.
-- =====================================================================

ALTER TABLE public.nutzer_profil
  ADD COLUMN IF NOT EXISTS nachname text,
  ADD COLUMN IF NOT EXISTS schulform text,
  ADD COLUMN IF NOT EXISTS geburtsdatum date;
