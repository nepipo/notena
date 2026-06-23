-- Fehlende UPDATE-Policy auf stundenplan_entfall.
-- Das upsert() in addEntfall/addTagEntfall macht ON CONFLICT DO UPDATE,
-- was ohne UPDATE-Policy von RLS still blockiert wird (kein Error, kein Effekt).
CREATE POLICY "eigene entfaelle aktualisieren"
  ON stundenplan_entfall FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM stundenplan_stunde
      WHERE id = stunde_id
        AND user_id = auth.uid()
    )
  );
