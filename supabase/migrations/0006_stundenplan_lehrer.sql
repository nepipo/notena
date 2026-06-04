-- supabase/migrations/0006_stundenplan_lehrer.sql

alter table public.stundenplan_stunde
  add column if not exists lehrer text;
