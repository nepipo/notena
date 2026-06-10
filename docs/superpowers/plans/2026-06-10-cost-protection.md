# Bauplan: Finanzielle Absicherung — API-Kosten

**Stand:** 10.06.2026  
**Priorität:** 🔴 Vor Beta-Launch umsetzen — kein optionales Feature  
**Problem:** Ein unkontrollierter Briefing-Cron oder eine gehackte Route kann über Nacht Tausende Euro verbrennen.

---

## Das Alptraum-Szenario

- Briefing-Cron läuft täglich für 500+ User → Sonnet 4.6 × 5k Tokens × 500 = 2,5M Tokens/Tag ≈ **€75/Tag**
- Ein Bug loopt den API-Call in einer Schleife → unbegrenzte Costs
- Jemand findet die Coach-Route und hammert sie mit Requests
- Anthropic stellt am Monatsende €3.000 in Rechnung

**Gegenmaßnahmen: 5 Schichten.** Jede Schicht für sich reicht nicht. Zusammen ist es bulletproof.

---

## Schicht 1 — Anthropic Dashboard: Hard Spending Limit (10 min, jetzt sofort)

Das ist die einzige Absicherung die *außerhalb deines Codes* liegt — also der letzte Fallback wenn alles andere versagt.

**Was tun:**
1. Geh auf console.anthropic.com → Settings → Billing → Spending Limits
2. Setze ein **monatliches Hard Limit** (z.B. €30/Monat für Beta-Phase)
3. Setze ein **Email-Alert** bei €10 (50% Warnung) und €25 (83% Warnung)

**Wichtig:** Wenn das Limit erreicht ist, schlägt jeder API-Call mit einem 429-Fehler fehl. Das ist gewollt — lieber App down als €20k Schulden.

**TODO:**
- [ ] Hard Limit auf €30/Monat setzen
- [ ] Email-Alerts konfigurieren

---

## Schicht 2 — Cache-First: Briefing nur 1× pro User pro Tag

Die `briefing_cache` Tabelle existiert bereits (`user_id + datum` unique constraint). Die Cron-Route darf den Claude-API-Call nur machen wenn **noch kein Eintrag für heute existiert**.

**Implementierung in der zukünftigen `/api/cron/briefing/route.ts`:**

```ts
// Vor dem API-Call:
const { data: cached } = await supabase
  .from("briefing_cache")
  .select("id")
  .eq("user_id", userId)
  .eq("datum", heute)
  .single();

if (cached) {
  // Bereits generiert heute → überspringen, KEIN API-Call
  continue;
}

// Erst jetzt: Claude aufrufen
```

**Effekt:** Selbst wenn der Cron zweimal läuft (Vercel-Bug, manueller Re-Run), zahlt man nicht doppelt.

---

## Schicht 3 — Beta-Gate: Nur freigeschaltete User bekommen Briefing

Nicht alle registrierten User sollen automatisch Briefings bekommen. Nur User die explizit freigeschaltet sind.

**Migration nötig:** `nutzer_profil.briefing_aktiv` existiert bereits (default `true`). Das reicht nicht — wir brauchen ein **Admin-Gate**.

```sql
-- Migration: 0012_beta_gate.sql
ALTER TABLE public.nutzer_profil
  ADD COLUMN IF NOT EXISTS beta_zugang boolean NOT NULL DEFAULT false;
```

**Cron-Logik:**
```ts
const { data: users } = await supabase
  .from("nutzer_profil")
  .select("id")
  .eq("briefing_aktiv", true)
  .eq("beta_zugang", true);  // ← nur freigeschaltete User
```

**Du schaltest User manuell frei** → volle Kontrolle über die Kosten-Skalierung.

---

## Schicht 4 — Per-Request Token Budget

Jeden Claude-Call mit `max_tokens` deckeln. Nie unbegrenzt laufen lassen.

| Route | Modell | Max Tokens | Geschätzte Kosten/Call |
|---|---|---|---|
| `/api/cron/briefing` | Sonnet 4.6 | 600 | ~€0,003 |
| `/api/coach` | Haiku 4.5 | 512 | ~€0,0001 |

**Im Code immer:**
```ts
const response = await anthropic.messages.create({
  model: "claude-haiku-4-5-20251001",
  max_tokens: 512,  // ← NIEMALS weglassen
  // ...
});
```

**Haiku 4.5 für den Coach ist richtig** — da kommt nichts dran zu ändern. Für Briefing kommt Sonnet 4.6, aber mit max 600 Tokens bleibt der Schaden überschaubar.

---

## Schicht 5 — Rate Limiting auf der Coach-Route

Die `/api/coach` Route ist user-getriggert und öffentlich (jeder eingeloggte User kann sie aufrufen). Ohne Rate Limit kann ein einzelner User 1000× pro Tag tippen.

**Implementierung mit Supabase:**

```sql
-- Migration: 0013_coach_ratelimit.sql
CREATE TABLE IF NOT EXISTS public.coach_request_log (
  id         bigserial primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Index für schnelle Abfragen
CREATE INDEX ON public.coach_request_log (user_id, created_at);
```

**In der Coach-Route (vor dem API-Call):**
```ts
const fensterStart = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // letzte Stunde

const { count } = await supabase
  .from("coach_request_log")
  .select("*", { count: "exact", head: true })
  .eq("user_id", userId)
  .gte("created_at", fensterStart);

if ((count ?? 0) >= 20) {
  return new Response("Zu viele Anfragen. Warte kurz.", { status: 429 });
}

// Anfrage loggen
await supabase.from("coach_request_log").insert({ user_id: userId });
// Jetzt Claude aufrufen...
```

**Limit:** 20 Coach-Nachrichten/Stunde pro User. Reicht für echte Nutzung, blockiert Abuse.

---

## Übersicht: Was wann umsetzen

| Schicht | Aufwand | Wann |
|---|---|---|
| 1 — Anthropic Spending Limit | 10 min, kein Code | **Jetzt sofort** |
| 2 — Cache-First Briefing | Beim Briefing-Bau (Woche 9) | Einbauen bevor Cron live geht |
| 3 — Beta-Gate Migration | 30 min | **Vor erstem echten User** |
| 4 — max_tokens überall | Bereits zu 90% gemacht | Prüfen beim Briefing-Bau |
| 5 — Coach Rate Limit | 1–2h | Vor Beta-Launch |

---

## Was es kostet wenn alles korrekt läuft

**Beta-Phase (20 User, Briefing aktiv):**
- Briefing: 20 User × 600 Tokens × €0,003/1k Tokens × 30 Tage ≈ **€1,08/Monat**
- Coach: 20 User × Ø5 Nachrichten/Tag × 512 Tokens × €0,0002/1k × 30 Tage ≈ **€0,31/Monat**
- Klausur-Erinnerung: **€0** (kein Claude-Call)
- **Gesamt Beta: ~€1,40/Monat** — weit weg von €20k

**Bei 500 Usern (v1.0):**  
~€35/Monat → dann brauchst du Pricing das das abdeckt (3€/Monat Premium reicht bei 20 zahlenden Usern).

---

## Notfall-Kill-Switch

Wenn irgendwas explodiert und du die Kosten stoppen musst:

1. **Anthropic Dashboard** → API Keys → Key deaktivieren → **sofort** keine Calls mehr möglich
2. **Vercel Dashboard** → Project Settings → Cron Jobs → deaktivieren
3. **Supabase** → `briefing_aktiv = false` für alle User per SQL:
   ```sql
   UPDATE nutzer_profil SET briefing_aktiv = false;
   ```

---

*Dieser Plan deckt alle realistischen Szenarien ab. Schicht 1 (Spending Limit) ist ein Non-Verhandelbares — das machst du noch heute.*
