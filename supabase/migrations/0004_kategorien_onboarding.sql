-- =====================================================================
-- Notena — Schicht 2: Erweiterte Kategorien + Onboarding-Flag
-- =====================================================================

-- Bestehende CHECK-Constraint für kategorie entfernen und neu setzen.
ALTER TABLE public.schule_note
  DROP CONSTRAINT IF EXISTS schule_note_kategorie_check;

ALTER TABLE public.schule_note
  ADD CONSTRAINT schule_note_kategorie_check
  CHECK (kategorie = ANY (ARRAY[
    'klausur'::text, 'muendlich'::text, 'sonstige'::text,
    'test'::text, 'referat'::text, 'hausaufgabe'::text
  ]));

-- Onboarding-Flag auf nutzer_profil
ALTER TABLE public.nutzer_profil
  ADD COLUMN IF NOT EXISTS onboarding_abgeschlossen boolean NOT NULL DEFAULT false;
