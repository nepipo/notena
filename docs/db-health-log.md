---
DB HEALTH - 2026-07-21

Row-Counts:
- nutzer_profil: 6
- schule_fach: 45
- schule_note: 37
- schule_klausur: 2

DB-Größe gesamt: ~956 kB (stundenplan_stunde 136 kB, schule_fach 128 kB, schule_klausur 80 kB, hausaufgabe 80 kB, stundenplan_entfall 80 kB, rest ≤64 kB je Tabelle)

RLS-Status:
- Alle 15 Tabellen haben RLS enabled: JA ✅
- invite_code: RLS enabled, 0 Policies → alle Zugriffe via PostgREST geblockt (intentional? service_role only)
- warteliste: RLS enabled, 0 Policies → alle Zugriffe via PostgREST geblockt (Waitlist-INSERT für Anon fehlt möglicherweise)

Indexes:
- Fehlende Indexes: keine — alle kritischen user_id + fach_id Indexes vorhanden
- Neu hinzugefügt: keine
- Hinweis: 7 Indexes als "unused" markiert (INFO) — bei 6 Usern normal, NICHT droppen

Advisor-Befunde:
Performance (alle INFO):
  - idx_nutzer_profil_ls_customer (nutzer_profil) — unused, LemonSqueezy noch nicht aktiv, behalten
  - idx_schule_fach_parent (schule_fach) — unused, Subfach-Feature noch wenig genutzt, behalten
  - idx_schule_klausur_user_datum (schule_klausur) — unused bei 2 Einträgen, behalten
  - idx_hausaufgabe_user_erledigt_faellig (hausaufgabe) — unused, behalten
  - idx_stundenplan_entfall_stunde_id (stundenplan_entfall) — unused, behalten
  - idx_stundenplan_halbjahr_user (stundenplan_halbjahr) — unused, behalten
  - idx_stundenplan_stunde_halbjahr (stundenplan_stunde) — unused, behalten

Security:
  - WARN: check_coach_rate_limit() — SECURITY DEFINER, via REST erreichbar für authenticated Users (wahrscheinlich intentional für Rate-Limiting)
  - WARN: delete_current_user() — SECURITY DEFINER, via REST erreichbar für authenticated Users (intentional für Account-Löschung)
  - WARN: Leaked Password Protection disabled (HaveIBeenPwned-Check in Supabase Auth) — offen seit CLAUDE.md, nur im Dashboard aktivierbar
  - INFO: invite_code — RLS enabled, 0 Policies
  - INFO: warteliste — RLS enabled, 0 Policies

Migrations: 35 lokal / 51 remote applied — 16 Migrations nur remote vorhanden (kein Sicherheitsproblem, aber lokales Migrations-Tracking unvollständig)

Gesamtstatus: WARNUNG
---
