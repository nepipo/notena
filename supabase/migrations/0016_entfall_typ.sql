ALTER TABLE stundenplan_entfall
  ADD COLUMN IF NOT EXISTS typ TEXT NOT NULL DEFAULT 'entfall'
  CONSTRAINT stundenplan_entfall_typ_check CHECK (typ IN ('entfall', 'krank'));
