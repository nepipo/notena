-- Doppelte Fachnamen pro User + Halbjahr verhindern (case-insensitiv).
-- Serverseitige Checks existieren in den Actions; der Index ist die
-- race-sichere Garantie auf DB-Ebene.
-- coalesce: Legacy-Fächer ohne Halbjahr bilden eine eigene Gruppe ('').
-- Live-Check 05.07.2026: keine bestehenden Duplikate — Index legt sich sauber an.
CREATE UNIQUE INDEX IF NOT EXISTS schule_fach_user_halbjahr_name_unique
  ON public.schule_fach (user_id, coalesce(halbjahr, ''), lower(btrim(name)));
