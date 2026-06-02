-- =====================================================================
-- Project X — Profil-Praeferenzen: Notensystem + Eingabe-Modus.
-- Notensystem ist vorbereitet fuer spaetere Erweiterung (CH/AT/IB),
-- jetzt nur 'de_0_15' erlaubt.
-- =====================================================================
alter table public.nutzer_profil
  add column if not exists notensystem text not null default 'de_0_15'
    check (notensystem in ('de_0_15')),
  add column if not exists eingabe_modus text not null default 'punkte'
    check (eingabe_modus in ('punkte', 'note'));
