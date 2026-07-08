-- Einstellung: sollen LK-Fächer im Gesamtschnitt doppelt zählen?
-- Default true (bundesweit üblich in der gymnasialen Oberstufe).
ALTER TABLE public.nutzer_profil
  ADD COLUMN IF NOT EXISTS lk_doppelt_gewichten boolean NOT NULL DEFAULT true;
