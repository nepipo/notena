-- 0019_subfach.sql
-- Unterfächer: Ein Fach kann als Teil-Komponente eines anderen Fachs gelten
-- und einen prozentualen Anteil an dessen Gesamtnote ausmachen.
-- Beispiel: "Cambridge" ist Unterfach von "Englisch" mit 30% Gewicht.

ALTER TABLE schule_fach
  ADD COLUMN IF NOT EXISTS parent_fach_id uuid
    REFERENCES schule_fach(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS subfach_gewicht numeric(5,4)
    CHECK (subfach_gewicht IS NULL OR (subfach_gewicht >= 0 AND subfach_gewicht <= 1));

-- Index für schnelle Abfrage aller Unterfächer eines Elternfachs
CREATE INDEX IF NOT EXISTS idx_schule_fach_parent
  ON schule_fach(parent_fach_id)
  WHERE parent_fach_id IS NOT NULL;
