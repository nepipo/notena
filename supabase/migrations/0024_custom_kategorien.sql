-- Custom Bewertungsarten pro User: Liste von {id, name, kurzname} als JSONB
ALTER TABLE nutzer_profil
  ADD COLUMN IF NOT EXISTS custom_kategorien jsonb DEFAULT '[]'::jsonb;
