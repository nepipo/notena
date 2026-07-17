-- 0030_email_hat_account.sql
-- Prüft, ob zu einer E-Mail bereits ein Auth-Konto existiert.
-- Wird von der Warteliste genutzt: bestehende Accounts landen nicht nochmal
-- auf der Liste. Nur service_role darf die Funktion aufrufen (Pattern aus 0027).
-- E-Mail-Vergleich case-insensitive, um Groß-/Kleinschreibung zu ignorieren.

create or replace function public.email_hat_account(p_email text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
      from auth.users
     where lower(email) = lower(p_email)
  );
$$;

revoke execute on function public.email_hat_account(text) from public, anon, authenticated;
grant execute on function public.email_hat_account(text) to service_role;
