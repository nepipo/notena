-- supabase/migrations/0005_stundenplan_hausaufgaben.sql

-- ── 1. stundenplan_stunde ──────────────────────────────────────────────────
create table if not exists public.stundenplan_stunde (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  fach_id     uuid references public.schule_fach(id) on delete set null,
  wochentag   smallint not null check (wochentag between 1 and 7),
  -- 1=Mo, 2=Di, 3=Mi, 4=Do, 5=Fr, 6=Sa, 7=So
  zeit_start  time not null,
  zeit_end    time not null,
  raum        text,
  woche_typ   text check (woche_typ in ('A', 'B'))
  -- null = jede Woche; 'A'/'B' = nur in dieser Woche
);

create index if not exists stundenplan_stunde_user_idx
  on public.stundenplan_stunde (user_id);

alter table public.stundenplan_stunde enable row level security;

create policy "Stunde: eigene verwalten"
  on public.stundenplan_stunde for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ── 2. hausaufgabe ─────────────────────────────────────────────────────────
create table if not exists public.hausaufgabe (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  fach_id      uuid references public.schule_fach(id) on delete set null,
  beschreibung text not null,
  faellig_am   date not null,
  erledigt     boolean not null default false,
  created_at   timestamptz not null default now()
);

create index if not exists hausaufgabe_user_idx
  on public.hausaufgabe (user_id);

alter table public.hausaufgabe enable row level security;

create policy "Hausaufgabe: eigene verwalten"
  on public.hausaufgabe for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ── 3. nutzer_profil: A/B-Wochen-Einstellungen ────────────────────────────
alter table public.nutzer_profil
  add column if not exists wochen_modus text
    check (wochen_modus in ('standard', 'AB')) default 'standard',
  add column if not exists aktuelle_woche text
    check (aktuelle_woche in ('A', 'B')) default 'A';
