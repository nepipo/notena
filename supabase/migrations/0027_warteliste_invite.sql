-- 0027_warteliste_invite.sql
-- Warteliste (Double-Opt-in) + Invite-Codes mit Nutzungslimit.
-- Beide Tabellen: RLS aktiv, KEINE Policies — Zugriff nur über Service-Role
-- (Server Actions). Redeem-Funktionen: EXECUTE nur für service_role.

create table public.warteliste (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  token uuid not null default gen_random_uuid(),
  bestaetigt_am timestamptz,
  letzte_mail_am timestamptz,
  created_at timestamptz not null default now()
);

create unique index warteliste_token_idx on public.warteliste (token);

create table public.invite_code (
  code text primary key,
  max_nutzungen int not null default 1 check (max_nutzungen > 0),
  genutzt int not null default 0 check (genutzt >= 0),
  aktiv boolean not null default true,
  kommentar text,
  created_at timestamptz not null default now()
);

alter table public.warteliste enable row level security;
alter table public.invite_code enable row level security;

-- Atomare Einlösung: genau dann true, wenn der Code aktiv ist und noch
-- Nutzungen frei hat. Kein Race bei gleichzeitigen Signups (row lock im UPDATE).
create or replace function public.redeem_invite_code(p_code text)
returns boolean
language sql
security definer
set search_path = public
as $$
  update invite_code
     set genutzt = genutzt + 1
   where code = p_code
     and aktiv
     and genutzt < max_nutzungen
  returning true;
$$;

-- Rollback, wenn signUp nach der Einlösung fehlschlägt (E-Mail existiert etc.).
create or replace function public.unredeem_invite_code(p_code text)
returns void
language sql
security definer
set search_path = public
as $$
  update invite_code
     set genutzt = greatest(genutzt - 1, 0)
   where code = p_code;
$$;

-- Nur service_role darf die Funktionen aufrufen (Pattern aus 0002).
revoke execute on function public.redeem_invite_code(text) from public, anon, authenticated;
revoke execute on function public.unredeem_invite_code(text) from public, anon, authenticated;
grant execute on function public.redeem_invite_code(text) to service_role;
grant execute on function public.unredeem_invite_code(text) to service_role;
