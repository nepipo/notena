-- plan_tier-Constraint an den Pro-Code angleichen.
--
-- Der LemonSqueezy-Webhook (lib/pro/webhook.ts) schreibt bei erfolgreicher
-- Zahlung plan_tier = 'pro'. Der ursprüngliche Check aus 0001 erlaubte aber
-- nur ('free', 'premium') — 'premium' war nie in Nutzung. Ohne diesen Fix
-- lehnt die Datenbank die Freischaltung nach der Zahlung mit einem
-- Constraint-Fehler ab: Der User zahlt, wird aber nicht Pro.
--
-- (Ersetzt den nie nach main gemergten Fix aus dem Pro-Worktree, Migration
--  0020 dort — Nummer 0020 ist in main bereits durch 0020_land.sql belegt.)

alter table public.nutzer_profil
  drop constraint if exists nutzer_profil_plan_tier_check;

alter table public.nutzer_profil
  add constraint nutzer_profil_plan_tier_check
  check (plan_tier in ('free', 'pro'));
