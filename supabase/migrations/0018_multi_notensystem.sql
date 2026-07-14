-- =====================================================================
-- Notena — Multi-Notensystem.
-- punkte: smallint -> numeric(4,2) (CH-Kommanoten).
-- notensystem-CHECK um DE-1-6/CH/AT/IB erweitern.
-- Bestehende Daten (0-15, de_0_15) bleiben gültig — kein Backfill.
-- =====================================================================

-- Schritt 1: punkte-Spalte auf numeric(4,2) erweitern
alter table public.schule_note
  alter column punkte type numeric(4,2) using punkte::numeric;

-- Schritt 2: alten punkte-CHECK droppen + neu setzen (coarse guard)
alter table public.schule_note
  drop constraint if exists schule_note_punkte_check;
alter table public.schule_note
  add constraint schule_note_punkte_check check (punkte >= 0 and punkte <= 15);

-- Schritt 3: notensystem-CHECK auf nutzer_profil erweitern
alter table public.nutzer_profil
  drop constraint if exists nutzer_profil_notensystem_check;
alter table public.nutzer_profil
  add constraint nutzer_profil_notensystem_check
    check (notensystem in ('de_0_15', 'de_1_6', 'ch_1_6', 'at_1_5', 'ib_1_7'));
