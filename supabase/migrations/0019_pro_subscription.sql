-- Pro-Abo-Felder. plan_tier existiert bereits (default 'free').
alter table nutzer_profil
  add column if not exists plan_status     text,
  add column if not exists plan_intervall  text,
  add column if not exists plan_bis        timestamptz,
  add column if not exists trial_genutzt   boolean not null default false,
  add column if not exists ls_customer_id     text,
  add column if not exists ls_subscription_id text;

-- Plan-Felder dürfen NUR per Service-Role (Webhook) geschrieben werden.
-- Der eingeloggte User (Rolle `authenticated`) darf seinen eigenen Plan nicht
-- hochsetzen. Sauberste Lösung: column-level UPDATE-Privileg auf den Plan-Spalten
-- entziehen. Die bestehende RLS-Update-Policy "Profil: eigene Zeile ändern" bleibt
-- unverändert — normale Profil-Updates (name, klasse etc.) funktionieren weiter.
-- Der Webhook nutzt den Service-Role-Key und umgeht diese Grants ohnehin.
revoke update (plan_tier, plan_status, plan_intervall, plan_bis, trial_genutzt, ls_customer_id, ls_subscription_id)
  on nutzer_profil from authenticated;

create index if not exists idx_nutzer_profil_ls_customer on nutzer_profil (ls_customer_id);
