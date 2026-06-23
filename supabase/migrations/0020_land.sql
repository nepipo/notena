-- Adds country field to user profiles.
-- Bundesland remains Germany-only; other countries get land stored but no holiday data.
ALTER TABLE nutzer_profil ADD COLUMN IF NOT EXISTS land text;
