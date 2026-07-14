# Scale & Security Plan — Notena für 100k User

**Stand:** 11.06.2026  
**Ziel:** Die App ist bereits gut gebaut — dieser Plan zeigt was noch fehlt, bevor sie wirklich 100k User tragen kann.

---

## Ausgangslage (was schon gut ist)

Kein Bullshit — der Code ist bereits auf solidem Fundament:

- ✅ RLS aktiviert auf allen 4 Kern-Tabellen (`nutzer_profil`, `schule_fach`, `schule_note`, `schule_klausur`)
- ✅ `getClaims()` statt `getUser()` in Middleware und API-Routes — JWT-Signatur-Validation, kein DB-Call pro Request
- ✅ `requireUserId()` in Server Actions — User-ID kommt aus der Session, nie aus dem Body
- ✅ Zod-Validierung in `lib/validation.ts` + Coach-API-Route hat Body-Size-Check (50 KB)
- ✅ `dbError()` — DB-Fehler werden in Production nicht an den User geleakt
- ✅ DB-backed Rate-Limiter für den Coach (atomic INSERT ... ON CONFLICT, race-condition-sicher über alle Vercel-Instanzen)
- ✅ Prompt Caching für Claude API (spart ~47% Coach-Kosten pro Session)
- ✅ Audit-Log-Tabelle vorhanden (`audit_log` mit `aktion`, `entity_id`, `entity_data`)

---

## Was noch fehlt — nach Priorität

### 🔴 Blocker (vor Closed Beta)

#### 1. Supabase Auth Hardening aktivieren
**Was:** Zwei Supabase-Features die noch nicht eingeschaltet sind.
- **Leaked Password Protection** — gleicht Passwörter gegen Have I Been Pwned ab
- **Rate-Limiting auf Login** — Supabase hat eingebautes Brute-Force-Schutz, muss im Dashboard aktiviert werden

**Wo:** Supabase Dashboard → Authentication → Settings

**Warum jetzt:** Ohne das sind alle User-Accounts angreifbar. 10 Minuten Aufwand.

---

#### 2. DB-Indexes auf die wichtigsten Query-Pfade
**Was:** Ohne Indexes macht Postgres bei 100k Usern einen Full Table Scan.
Die häufigsten Queries im Code:

```sql
-- Diese Queries laufen bei JEDEM Dashboard-Load:
SELECT * FROM schule_fach WHERE user_id = $1 AND halbjahr = $2
SELECT * FROM schule_note WHERE fach_id = ANY($1)
SELECT * FROM schule_klausur WHERE user_id = $1
SELECT * FROM schule_klausur WHERE fach_id = ANY($1)
SELECT * FROM audit_log WHERE user_id = $1  -- rate limiter
```

**Migration schreiben:**
```sql
-- Migration: 0003_performance_indexes
CREATE INDEX IF NOT EXISTS idx_schule_fach_user_halbjahr ON schule_fach(user_id, halbjahr);
CREATE INDEX IF NOT EXISTS idx_schule_note_fach_id ON schule_note(fach_id);
CREATE INDEX IF NOT EXISTS idx_schule_klausur_user_id ON schule_klausur(user_id);
CREATE INDEX IF NOT EXISTS idx_schule_klausur_fach_id ON schule_klausur(fach_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_created ON audit_log(user_id, created_at DESC);
```

**Warum jetzt:** Bei 50 Usern merkt man das nicht. Bei 10k kostet jeder Dashboard-Load plötzlich 200ms extra.

---

#### 3. `SELECT *` eliminieren in DB-Queries
**Was:** An mehreren Stellen werden alle Spalten geladen obwohl nur ein Teil gebraucht wird. Das erhöht Datenlast und gibt zu viel preis falls sich ein Schema-Bug einschleicht.

**Wo zu prüfen:** `lib/grades/db.ts`, `lib/coach/context.ts`

**Fix:** Explizit die Felder benennen die wirklich gebraucht werden.

---

#### 4. Cron-Route absichern
**Was:** `/api/cron/klausur-erinnerung` hat aktuell `CRON_SECRET`-Auth. Prüfen ob:
- `CRON_SECRET` in `.env` gesetzt und in Vercel-Env vorhanden ist
- Der Check `return 401` wenn kein/falscher Secret

**Warum:** Ohne das kann jeder extern die Cron-Route triggern und Massen-Benachrichtigungen auslösen.

---

### 🟡 Vor v1.0 (nach Beta-Launch)

#### 5. Coach-API: Tool-Input-Validierung mit Zod
**Was:** Die Coach-API führt Mutations aus (Noten erstellen, löschen etc.) basierend auf Claude's Tool-Input. Dieser wird aktuell direkt an Supabase weitergegeben.

**Risiko:** Wenn Claude halluziniert oder ein Input-Injection-Angriff passiert, könnte ein böswilliger Payload direkt in die DB geschrieben werden.

**Fix:** In `app/api/coach/route.ts` vor dem Tool-Dispatch jeden `input` mit dem passenden Zod-Schema validieren.

```ts
// Beispiel in route.ts:
import { AddNoteSchema } from "@/lib/validation";
// ... vor dem tool dispatch:
const parsed = AddNoteSchema.safeParse(input);
if (!parsed.success) return Response.json({ error: "Ungültige Eingabe" }, { status: 400 });
```

---

#### 6. Rate-Limiting auch für Auth-unabhängige Routes
**Was:** Aktuell hat nur der Coach ein Rate-Limit. Die Export-Route (`/api/export`), Push-Subscribe-Route und künftige API-Routes haben keins.

**Fix:** Vercel hat eingebautes Rate-Limiting ab Pro-Plan. Für jetzt: IP-basiertes Rate-Limiting in der Middleware für `/api/*`-Routes.

---

#### 7. Error-Tracking mit Sentry (Free Tier)
**Was:** Aktuell gibt es kein Error-Tracking. Bei 100k Usern braucht man das — sonst erfährt man von Bugs erst wenn User sich beschweren.

**Kosten:** Sentry Free Tier — 0€, reicht locker für Beta + v1.0.

**Setup:** 1h Aufwand, Next.js-SDK, automatisches Error-Capturing.

---

#### 8. DB-Connection-Pooling prüfen
**Was:** Supabase hat einen Connection-Pool (PgBouncer). Bei vielen gleichzeitigen Vercel-Serverless-Invocations können DB-Connections knapp werden.

**Fix:** Supabase Dashboard → Database → Connection Pooling → Transaction Mode aktivieren. Dann in der Connection-String den Pooler-Port (5432 → 6543) nutzen.

**Warum:** Vercel kann bei Spitzenload 100+ Funktions-Instanzen gleichzeitig starten. Jede ohne Pooling = eigene DB-Connection. Postgres erlaubt default ~100 Connections — das läuft schnell voll.

---

#### 9. Content Security Policy (CSP) Header
**Was:** Aktuell keine CSP-Headers gesetzt. Das öffnet XSS-Angriffsfläche.

**Fix:** In `next.config.ts` Headers hinzufügen:
```ts
headers: [{ key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self' 'unsafe-inline'; ..." }]
```

Und zusätzlich: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`.

---

#### 10. DSGVO: Datenlösch-Kaskade sicherstellen
**Was:** Wenn ein User seinen Account löscht, müssen alle seine Daten gelöscht werden. DSGVO Art. 17 (Recht auf Löschung).

**Prüfen:** Haben alle Tabellen `ON DELETE CASCADE` auf `user_id`? Falls nicht → Migration.

---

### ⚪ Später (nach v1.0, wenn Wachstum kommt)

#### 11. Kosten-Monitoring für Claude API bei Scale
**Was:** Bei 100k DAU die alle den Coach nutzen, können Claude-Kosten explodieren.

**Rechnung:** 
- 1 Coach-Message ≈ ~1500 Input-Tokens (mit Kontext) + ~200 Output-Tokens
- Haiku 4.5: $0.80/MTok input, $4/MTok output → ~$0.001 pro Message
- 100k User × 5 Messages/Tag = 500k Messages = **$500/Tag** — zu teuer

**Fix rechtzeitig planen:**
- Coach nur für Pro-User (macht Monetarisierung sowieso sinnvoll)
- Haiku 4.5 statt Sonnet 4.6 für einfache Coach-Antworten
- Hard-Limit per User & Tag (aktuell 20/Stunde — bleibt)

---

#### 12. Stundenplan-Foto-Import: Storage-Kosten
**Was:** `/components/stundenplan/foto-import.tsx` — wenn das 100k User nutzen, werden Supabase Storage-Kosten relevant.

**Fix:** Bilder nach Verarbeitung löschen (nur das Ergebnis in der DB speichern, nicht das Original).

---

#### 13. Vercel Pro für Cron + Edge-Limits
**Was:** Vercel Free hat:
- 1 Cron-Job (wir haben genau einen — ok für jetzt)
- 100 GB Bandwidth/Monat
- Serverless Function Timeout: 10s

Bei 100k Usern wird Bandwidth und Timeout ein Thema.

**Trigger:** Wenn Bandwidth > 80 GB/Monat oder Cron-Jobs > 1 nötig werden.

---

## Zusammenfassung: Reihenfolge

| # | Was | Aufwand | Wann |
|---|-----|---------|------|
| 1 | Supabase Auth Hardening (Leaked PW + Rate-Limit) | 15 min, kein Code | Jetzt sofort |
| 2 | DB-Indexes Migration | 30 min | Jetzt sofort |
| 3 | SELECT * eliminiern | 1h | Jetzt sofort |
| 4 | Cron-Route Absicherung prüfen | 30 min | Jetzt sofort |
| 5 | Coach Tool-Input Zod-Validierung | 2h | Vor v1.0 |
| 6 | Rate-Limiting weitere Routes | 1h | Vor v1.0 |
| 7 | Sentry Setup | 1h | Vor v1.0 |
| 8 | DB Connection Pooling | 30 min | Vor v1.0 |
| 9 | CSP Headers | 1h | Vor v1.0 |
| 10 | DSGVO Lösch-Kaskade | 1h | Vor v1.0 |
| 11 | Claude-Kosten-Deckel | Planung | Nach v1.0 |
| 12 | Storage-Cleanup | 2h | Nach v1.0 |
| 13 | Vercel Pro | Budget-Entscheidung | Bei Bedarf |

---

*Die 🔴-Items sind kein Aufwand-Monster. Items 1–4 zusammen: ~2h. Danach ist die App für Beta mit gutem Gewissen live.*
