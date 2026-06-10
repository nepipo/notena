-- Stärke die INSERT-Policy auf stundenplan_entfall:
-- Zusätzlich zur user_id-Prüfung sicherstellen dass stunde_id dem User gehört.

DROP POLICY IF EXISTS "eigene entfaelle schreiben" ON stundenplan_entfall;

CREATE POLICY "eigene entfaelle schreiben"
  ON stundenplan_entfall FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM stundenplan_stunde
      WHERE id = stunde_id
        AND user_id = auth.uid()
    )
  );
