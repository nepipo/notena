-- Custom-Kategorien (0024) konnten nie gespeichert werden: der CHECK aus 0004
-- erlaubt nur die 6 Builtin-Werte, Custom-IDs (custom_xxxxxxxxxxxx) wurden von
-- Postgres abgelehnt. Constraint um das Custom-ID-Muster erweitern.
ALTER TABLE public.schule_note
  DROP CONSTRAINT IF EXISTS schule_note_kategorie_check;

ALTER TABLE public.schule_note
  ADD CONSTRAINT schule_note_kategorie_check
  CHECK (
    kategorie = ANY (ARRAY[
      'klausur'::text, 'muendlich'::text, 'sonstige'::text,
      'test'::text, 'referat'::text, 'hausaufgabe'::text
    ])
    OR kategorie ~ '^custom_[0-9a-f]{12}$'
  );
