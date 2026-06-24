-- Stundenplan-Halbjahre: mehrere Halbjahre pro User, mit History
CREATE TABLE stundenplan_halbjahr (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bezeichnung TEXT NOT NULL,   -- z.B. "11/1", "11/2", "12/1"
  aktiv BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE stundenplan_halbjahr ENABLE ROW LEVEL SECURITY;

CREATE POLICY "halbjahr_select" ON stundenplan_halbjahr
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "halbjahr_insert" ON stundenplan_halbjahr
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "halbjahr_update" ON stundenplan_halbjahr
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "halbjahr_delete" ON stundenplan_halbjahr
  FOR DELETE USING (auth.uid() = user_id);

-- Halbjahr-Referenz auf stundenplan_stunde
ALTER TABLE stundenplan_stunde
  ADD COLUMN halbjahr_id UUID REFERENCES stundenplan_halbjahr(id) ON DELETE CASCADE;

-- Bestehende Stunden: pro User ein Standard-Halbjahr "Aktuell" erstellen
DO $$
DECLARE
  uid UUID;
  hj_id UUID;
BEGIN
  FOR uid IN SELECT DISTINCT user_id FROM stundenplan_stunde WHERE halbjahr_id IS NULL
  LOOP
    INSERT INTO stundenplan_halbjahr (user_id, bezeichnung, aktiv)
    VALUES (uid, 'Aktuell', true)
    RETURNING id INTO hj_id;

    UPDATE stundenplan_stunde
    SET halbjahr_id = hj_id
    WHERE user_id = uid AND halbjahr_id IS NULL;
  END LOOP;
END $$;

CREATE INDEX idx_stundenplan_halbjahr_user ON stundenplan_halbjahr(user_id);
CREATE INDEX idx_stundenplan_stunde_halbjahr ON stundenplan_stunde(halbjahr_id);
