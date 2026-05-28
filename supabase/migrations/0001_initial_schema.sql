-- =====================================================================
-- Project X — Initiales Schema (VORSCHLAG, noch NICHT angewendet)
-- Phase 1 (Profil) + Phase 2 (Schule Core).
-- Review durch Nepomuk -> dann via Supabase MCP apply_migration anwenden.
--
-- Prinzipien:
--  - Jede Tabelle hängt an auth.users (user_id) und hat Row Level Security.
--  - User sehen/ändern AUSSCHLIESSLICH ihre eigenen Zeilen.
--  - Löschen eines Users / Fachs kaskadiert sauber.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) NUTZER-PROFIL  (1:1 zu auth.users)
-- ---------------------------------------------------------------------
create table if not exists public.nutzer_profil (
  id              uuid primary key references auth.users (id) on delete cascade,
  name            text,
  klasse          smallint check (klasse between 5 and 13),
  schule          text,
  geburtsjahr     smallint check (geburtsjahr between 1990 and 2020),
  plan_tier       text not null default 'free' check (plan_tier in ('free', 'premium')),
  aktuelles_halbjahr text,            -- z.B. '2025/26-2' (2. Halbjahr)
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.nutzer_profil enable row level security;

create policy "Profil: eigene Zeile lesen"
  on public.nutzer_profil for select
  using ((select auth.uid()) = id);

create policy "Profil: eigene Zeile ändern"
  on public.nutzer_profil for update
  using ((select auth.uid()) = id);

create policy "Profil: eigene Zeile anlegen"
  on public.nutzer_profil for insert
  with check ((select auth.uid()) = id);

-- Bei neuem Auth-User automatisch ein Profil anlegen.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.nutzer_profil (id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', null));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 2) SCHULE: FÄCHER-KONFIG  (pro User & Halbjahr)
-- ---------------------------------------------------------------------
create table if not exists public.schule_fach (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  name              text not null,
  farbe             text,                              -- Hex für UI-Akzent
  niveau            text not null default 'grund' check (niveau in ('grund', 'erhoeht')),
  halbjahr          text,                              -- z.B. '2025/26-2'
  fach_gewicht      numeric not null default 1   check (fach_gewicht >= 0),
  gewicht_klausur   numeric not null default 0.5 check (gewicht_klausur >= 0),
  gewicht_muendlich numeric not null default 0.5 check (gewicht_muendlich >= 0),
  gewicht_sonstige  numeric not null default 0   check (gewicht_sonstige >= 0),
  created_at        timestamptz not null default now()
);

create index if not exists schule_fach_user_idx on public.schule_fach (user_id);

alter table public.schule_fach enable row level security;

create policy "Fach: eigene verwalten"
  on public.schule_fach for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------
-- 3) SCHULE: NOTEN
-- ---------------------------------------------------------------------
create table if not exists public.schule_note (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  fach_id     uuid not null references public.schule_fach (id) on delete cascade,
  punkte      smallint not null check (punkte between 0 and 15),
  kategorie   text not null check (kategorie in ('klausur', 'muendlich', 'sonstige')),
  gewicht     numeric not null default 1 check (gewicht > 0),
  bezeichnung text,                                    -- z.B. '1. Klausur'
  datum       date,
  created_at  timestamptz not null default now()
);

create index if not exists schule_note_user_idx on public.schule_note (user_id);
create index if not exists schule_note_fach_idx on public.schule_note (fach_id);

alter table public.schule_note enable row level security;

create policy "Note: eigene verwalten"
  on public.schule_note for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------
-- 4) SCHULE: KLAUSUR-TERMINE  (geplante Klausuren mit Countdown)
-- ---------------------------------------------------------------------
create table if not exists public.schule_klausur (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users (id) on delete cascade,
  fach_id             uuid references public.schule_fach (id) on delete set null,
  titel               text not null,
  datum               timestamptz not null,
  vorbereitung_prozent smallint not null default 0 check (vorbereitung_prozent between 0 and 100),
  notiz               text,
  created_at          timestamptz not null default now()
);

create index if not exists schule_klausur_user_idx on public.schule_klausur (user_id);

alter table public.schule_klausur enable row level security;

create policy "Klausur: eigene verwalten"
  on public.schule_klausur for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
