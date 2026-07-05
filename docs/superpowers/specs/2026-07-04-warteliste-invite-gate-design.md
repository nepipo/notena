# Design: Warteliste + Invite-Gate

**Datum:** 04.07.2026
**Status:** Von Nepomuk freigegeben (Design-Dialog), Spec-Review ausstehend
**Ziel:** Die „Geschlossene Beta" von der Landing wahr machen — Signup nur mit Invite-Code, alle anderen landen auf einer Warteliste mit Double-Opt-in.

---

## Entscheidungen (aus dem Brainstorming)

| Frage | Entscheidung |
|---|---|
| Gate-Position | Beim Signup — anonymes Onboarding bleibt für alle offen (Duolingo-Prinzip) |
| Code-Mechanik | Codes mit konfigurierbarem Nutzungslimit (1× bis n×), Zählung pro Code |
| Code-Verwaltung | Per SQL im Supabase-Dashboard, kein Admin-UI (YAGNI) |
| Opt-in | Double-Opt-in via Resend-Bestätigungslink |
| Architektur | Server Actions + Service-Role-Client; Gate in der App-Schicht. Bekanntes Restrisiko: Bypass über direkten Supabase-Auth-API-Call ist möglich (Anon-Key ist öffentlich) — akzeptiert, DB-Level-Hardening (Before-User-Created-Hook) nur bei tatsächlichem Missbrauch nachrüsten |
| Kosten | 0 € (Supabase Free Tier, Resend Free Tier: 100 Mails/Tag) |

---

## Datenmodell (Migration `0027_warteliste_invite`)

> Hinweis: `0026` ist bereits durch eine parallele Session belegt (`0026_kategorie_check_custom.sql`).

### Tabelle `warteliste`

| Spalte | Typ | Notiz |
|---|---|---|
| `id` | uuid PK | `gen_random_uuid()` |
| `email` | text, unique, not null | normalisiert: lowercase + trim (in der Server Action) |
| `token` | uuid, not null | Bestätigungstoken, default `gen_random_uuid()`, läuft nicht ab |
| `bestaetigt_am` | timestamptz, null | gesetzt = Double-Opt-in abgeschlossen |
| `letzte_mail_am` | timestamptz, null | Mail-Throttle (max. 1 Mail / 10 Min pro E-Mail) |
| `created_at` | timestamptz | default `now()` |

### Tabelle `invite_code`

| Spalte | Typ | Notiz |
|---|---|---|
| `code` | text PK | uppercase normalisiert |
| `max_nutzungen` | int, not null, default 1 | 1× für Einzelpersonen, n× für Gruppen/Influencer |
| `genutzt` | int, not null, default 0 | |
| `aktiv` | boolean, default true | Kill-Switch pro Code |
| `kommentar` | text | z. B. „Stufe 11 Welle 1" |
| `created_at` | timestamptz | default `now()` |

### Sicherheit

- RLS auf beiden Tabellen **aktiviert, aber ohne Policies** — kein direkter Zugriff für `anon` oder `authenticated`.
- Alle Zugriffe laufen serverseitig über einen Service-Role-Client: neues Modul `lib/supabase/admin.ts`, `SUPABASE_SERVICE_ROLE_KEY` nur in Server-Env (`.env.local` + Vercel), nie im Client-Bundle.
- Bewusst **keine** SECURITY-DEFINER-RPCs: die wären via PostgREST für `anon` aufrufbar (gleiche Logik wie Hardening-Migration `0002`).

### Codes anlegen (manuell, Supabase-Dashboard)

```sql
insert into invite_code (code, max_nutzungen, kommentar)
values ('HOCHRAD26', 30, 'Schule + Verein Welle 1');
```

---

## Server-Logik

### `lib/actions/warteliste.ts` (neu)

**`wartelisteEintragen(email)`** — zod-validiert, E-Mail normalisiert.
- Neue E-Mail → Insert + Bestätigungsmail via Resend (Link: `/warteliste/bestaetigen?token=…`).
- Vorhanden, unbestätigt → Mail erneut senden, sofern `letzte_mail_am` älter als 10 Minuten.
- Vorhanden, bestätigt → nichts senden.
- **Antwort immer generisch** („Check dein Postfach") — keine E-Mail-Enumeration möglich.
- Resend-Fehler wird hier **nicht** verschluckt (anders als `welcome.ts`): ohne Mail kein Opt-in → ehrliche Fehlermeldung, Eintrag bleibt bestehen, erneutes Absenden schickt neue Mail.

**`wartelisteBestaetigen(token)`** — setzt `bestaetigt_am`. Ungültiger Token → Fehlerzustand.

### Signup-Gate (`app/auth/actions.ts`, Funktion `signup`)

- Neues Pflichtfeld `invite_code` (uppercase normalisiert).
- Atomare Einlösung vor `signUp`:
  ```sql
  update invite_code
     set genutzt = genutzt + 1
   where code = $1 and aktiv and genutzt < max_nutzungen
   returning code;
  ```
  Keine Zeile getroffen → Fehler „Dieser Code ist ungültig oder schon voll.", Formulardaten bleiben erhalten.
- Schlägt `signUp` danach fehl (z. B. E-Mail existiert), wird `genutzt` wieder dekrementiert — kein verbrannter Code.

### `lib/email/warteliste.ts` (neu)

Bestätigungsmail im Stil von `lib/email/welcome.ts` (Text + HTML, deutsch, direkter Ton). Fehler werden propagiert, nicht nur geloggt.

---

## UI

### Landing (`app/page.tsx`)

- „Kostenlos starten" bleibt primärer CTA (Onboarding bleibt anonym offen).
- Untere Beta-CTA-Karte („Sei dabei, bevor alle anderen starten") wird zur **Warteliste-Sektion**: E-Mail-Feld + Button, Anker-ID `#warteliste`, DSGVO-Hinweistext mit Link auf `/datenschutz`.
- Bestehender Stil: `surface-2`, Brand-Akzente, Mono-Labels — kein neues Design-Vokabular.

### `components/warteliste-form.tsx` (neu)

Client-Komponente, `useActionState` gegen `wartelisteEintragen`, Erfolgs-/Fehlerzustand inline. Wird auf Landing **und** Signup wiederverwendet.

### Signup (`app/signup/page.tsx`)

- Neues Pflichtfeld „Invite-Code" (uppercase, Mono-Font — Ticket-Feeling).
- Darunter „Noch keinen Code?" mit Inline-Warteliste-Form — wer 8 Onboarding-Steps investiert hat, wird aufgefangen statt abzuprallen.

### `app/warteliste/bestaetigen/page.tsx` (neu)

Löst Token ein → „Du bist auf der Liste ✓" oder Fehlerzustand mit Neu-Eintragen-Formular. In `lib/supabase/proxy.ts` als öffentliche Route eintragen.

---

## Edge-Cases

| Fall | Verhalten |
|---|---|
| Code ungültig / voll / deaktiviert | Klare Fehlermeldung im Signup, Formulardaten bleiben erhalten |
| `signUp` scheitert nach Einlösung | `genutzt` wird dekrementiert |
| Doppelter Wartelisten-Eintrag | Generische Erfolgsmeldung, Mail-Throttle greift |
| Ungültiger Bestätigungs-Token | Fehlerzustand + Formular zum Neu-Eintragen |
| Resend nicht erreichbar | Ehrliche Fehlermeldung; Eintrag bleibt, erneutes Absenden schickt neue Mail |
| 5 Leute lösen gleichzeitig denselben Code ein | Atomares UPDATE — Limit hält |

---

## Tests & Verifikation

- Unit-Tests: zod-Schema + Eintrag-Logik mit gemocktem Supabase-Client (bestehendes Test-Pattern).
- Atomare Code-Einlösung: manuell gegen die DB testen.
- Vor Push: Build grün + kompletter Live-Durchklick (Landing → Warteliste → Mail → Bestätigen; Onboarding → Signup mit Code).

## DSGVO

- `/datenschutz` ergänzen: Zweck der Warteliste (Info zum Beta-Start), Resend als Auftragsverarbeiter, Löschung auf Anfrage.
- Hinweistext unter dem Warteliste-Formular mit Link.

## Offene Punkte für den Implementierungsplan

- Passende m-Task-ID in `docs/roadmap/state.js` identifizieren und nach Abschluss auf `true` setzen (Roadmap-Sync-Pflicht).
- `SUPABASE_SERVICE_ROLE_KEY` in Vercel-Env setzen (manueller Schritt für Nepomuk, falls noch nicht vorhanden).

## Bewusst NICHT im Scope

- Referral-System („teile deinen Link, rücke vor") — v2 der Warteliste.
- Admin-UI für Codes — erst wenn wöchentlich Codes gebraucht werden.
- Token-Ablauf für Bestätigungslinks.
- DB-Level-Signup-Hardening (Before-User-Created-Hook) — nur bei tatsächlichem Missbrauch.
