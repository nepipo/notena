alter table nutzer_profil
  add column if not exists briefing_aktiv boolean not null default true;
