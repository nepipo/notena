-- Optional free-text reason for a cancellation / sick day
ALTER TABLE stundenplan_entfall
  ADD COLUMN IF NOT EXISTS begruendung TEXT;
