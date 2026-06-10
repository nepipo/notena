-- Add optional custom label to stunden (for free periods etc.)
ALTER TABLE stundenplan_stunde ADD COLUMN IF NOT EXISTS bezeichnung TEXT;

-- Table for one-time cancellations without deleting the recurring entry
CREATE TABLE IF NOT EXISTS stundenplan_entfall (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stunde_id   UUID NOT NULL REFERENCES stundenplan_stunde(id) ON DELETE CASCADE,
  datum       DATE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (stunde_id, datum)
);

ALTER TABLE stundenplan_entfall ENABLE ROW LEVEL SECURITY;

CREATE POLICY "eigene entfaelle lesen"
  ON stundenplan_entfall FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "eigene entfaelle schreiben"
  ON stundenplan_entfall FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "eigene entfaelle loeschen"
  ON stundenplan_entfall FOR DELETE
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_stundenplan_entfall_user_datum
  ON stundenplan_entfall (user_id, datum);
