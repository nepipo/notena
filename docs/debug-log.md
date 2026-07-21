---
Datum: 2026-07-21

**Build-Status:** OK — kein TypeScript-Fehler, kein Lint-Fehler, Build erfolgreich (32 Routen, Turbopack)
**Vercel:** OK — letztes Deployment READY (e70a87b, 21.07). Keine Runtime-Errors in den letzten 7 Tagen. Alle 20 geprüften Deployments im Zustand READY.
**Supabase:** WARNUNG — 2 Security-WARNs + 7 Performance-Infos (Details unten)

**Bauplan-Abgleich:**
- Fertig: c01, c02, c04, c05, c06, c07, c08, c09, c10, c11, c12, c13, c14 · r01–r05 · u03–u06 · g01, g03–g07 · Warteliste + Invite-Code-System komplett · Halbjahr-Wechsler, LK-Gewichtung, Fach-Farben, Theme-Toggle, Passwort-Ändern, Notenrechner, KI-Coach, Google-OAuth
- In Arbeit: Woche 5 (22.07) — f06 Test-Zahlung, m05/m06 TikTok/Beta-Liste, r06 Cookie-Prüfung
- Noch offen: c03 (iPhone-Test manuell), c15 (i18n), c16 (PDF-Report), c17–c19 (Übersetzungen, Perf-Audit, Bug-Bash), g02 (Leaked-PW-Protection), alle Marketing/Finanzen/Metriken-Tasks
- Einschätzung: **on track** — Beta-Launch 13.08. technisch realistisch. Core-Features vollständig. Fokus jetzt: Marketing aufbauen + Leaked-PW-Protection fixen.

**Behobene Fehler:**
- state.js g02 war fälschlicherweise als `true` markiert (Leaked-Password-Protection „aktiviert") — Supabase Security Advisor widerspricht: Feature ist DEAKTIVIERT. Korrigiert auf `false`.

**Offene Probleme (konnten nicht automatisch gefixt werden):**
- **[SECURITY WARN] Leaked-Password-Protection deaktiviert** — Supabase Dashboard → Auth → Password Security → „Have I Been Pwned" aktivieren. Manueller Schritt im Supabase-Dashboard.
- **[SECURITY INFO] `check_coach_rate_limit()` als SECURITY DEFINER von `authenticated` aufrufbar** — Funktion ist per RPC öffentlich erreichbar. Kein akutes Risiko (Funktion liest nur eigene Rate-Limits), aber Supabase empfiehlt EXECUTE-Revoke oder Wechsel zu SECURITY INVOKER falls nicht beabsichtigt.
- **[PERFORMANCE INFO] 7 ungenutzte Indexes** — `idx_nutzer_profil_ls_customer`, `idx_schule_fach_parent`, `idx_schule_klausur_user_datum`, `idx_hausaufgabe_user_erledigt_faellig`, `idx_stundenplan_entfall_stunde_id`, `idx_stundenplan_halbjahr_user`, `idx_stundenplan_stunde_halbjahr` — erwartet bei kleiner User-Base, kein Handlungsbedarf jetzt.
- **[INFO] invite_code + warteliste: RLS aktiv, keine Policies** — gewollt (service_role only), kein Bug.
---
