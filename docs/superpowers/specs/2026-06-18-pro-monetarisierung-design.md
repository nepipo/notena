# Pro-Monetarisierung — Design-Spec

**Datum:** 2026-06-18
**Status:** Genehmigt (Brainstorming abgeschlossen)
**Ziel:** Pro-Abo scharf zum Beta-Launch (Ende August 2026)

---

## 1. Zusammenfassung

Notena bekommt ein **Soft-Freemium-Modell**: Alle Kern-Features bleiben gratis und
unbegrenzt, die KI-Features und Komfort-Extras kommen ins Pro-Abo. Pro wird **zum
Beta-Launch scharf geschaltet** (echtes Geld ab Tag 1).

Abo-Modell: **Wöchentlich / Monatlich / Jährlich**, jederzeit kündbar (Pro läuft bis
Periodenende weiter). **7-Tage-Trial für jeden** mit Kartenhinterlegung — nach Ablauf
automatische Abbuchung des Monats-Abos, sofern nicht gekündigt.

Payment-Provider: **LemonSqueezy** (Merchant of Record).

---

## 2. Rechtlicher Rahmen (Constraints, kein Code)

Diese Punkte sind Voraussetzung fürs Scharfschalten und damit **Beta-Blocker mit
Deadline Ende August 2026**:

- **Konto-Trägerschaft:** Nepomuk ist 17 (beschränkt geschäftsfähig, §106 BGB).
  Das LemonSqueezy-/Auszahlungskonto läuft sauber über einen Elternteil (Vater),
  bis Volljährigkeit erreicht ist.
- **Merchant of Record:** LemonSqueezy ist rechtlich der Verkäufer gegenüber dem
  Kunden, übernimmt EU-Umsatzsteuer + Rechnungen und trägt einen Teil des
  Chargeback-Risikos.
- **Button-Lösung (§312j BGB) — Pflicht für alle Kunden:** Bezahl-Button klar
  beschriftet ("Zahlungspflichtig abonnieren"), Trial-Bedingungen sichtbar daneben
  ("7 Tage gratis, danach 4,99 €/Monat, jederzeit kündbar"). AGB + Widerruf (14 Tage,
  FernAbsG) verlinkt.
- **Keine aktive Alters-/Eltern-Prüfung** (bewusste Produktentscheidung). Stattdessen
  passive Checkbox im Checkout: "Ich bin berechtigt, diesen Kauf zu tätigen."
- **Restrisiko Minderjährige:** Eltern könnten Einzelkäufe anfechten (§108 BGB) und
  zurückfordern. Bei den Beträgen klein, durch MoR teilweise abgefedert — akzeptiert.

---

## 3. Free vs. Pro — Feature-Aufteilung

| Feature | Free | Pro |
|---|:---:|:---:|
| Notenrechner (Hero, 0–15 Pkt, Halbjahre) | ✅ | ✅ |
| Fächer / Noten / Klausuren (unbegrenzt) | ✅ | ✅ |
| Stundenplan + Hausaufgaben | ✅ | ✅ |
| Daten-Export JSON (alle Daten) — **DSGVO-Pflicht, immer gratis** | ✅ | ✅ |
| Push-Benachrichtigungen — Basis (Klausur-Reminder) | ✅ | ✅ |
| **KI-Coach** (Chat mit Claude) | ❌ | ✅ |
| **Tägliches KI-Briefing** | ❌ | ✅ |
| **Trend-Analyse + Abi-Prognose** | ❌ | ✅ |
| Push-Benachrichtigungen — feine Konfiguration | ❌ | ✅ |
| Themes / Akzentfarben | ❌ | ✅ |
| PDF-Report (schöner Export) | ❌ | ✅ |
| Klassen-Vergleich (anonym) — später | ❌ | ✅ |

**Leitprinzip:** Free = alles, was die App täglich nützlich macht. Pro = die teuren
KI-Features (verursachen Claude-API-Kosten) + Komfort/Customizing. So zahlt Pro genau
die Features, die auch Kosten verursachen.

**Nicht verhandelbar:**
- Daten-Export (JSON) bleibt gratis (DSGVO Art. 20). Nur der hübsche PDF-Report ist Pro.
- Basis-Klausur-Reminder bleibt gratis, nur die feine Konfiguration ist Pro.

**Flexibel per Flag:** Das Briefing kann nach Launch ohne Code-Umbau auf "Free"
gedreht werden, falls ein stärkerer täglicher Engagement-Hook gebraucht wird.

---

## 4. Preise

| Intervall | Preis | ≈ €/Monat | Netto bei MoR (~5 % + 0,50 €) |
|---|---|---|---|
| Woche | 1,99 € | ~8,60 € | ~1,39 € |
| Monat | 4,99 € | 4,99 € | ~4,24 € |
| Jahr | 39,99 € | 3,33 € | ~37,49 € |

- Jahres-Rabatt ggü. Monat: **−33 %**.
- Wochen-Abo bewusst nicht billiger als 1,99 €, weil die 0,50-€-Fixgebühr billige
  Wochenpreise unwirtschaftlich macht.
- Default-Abo nach Trial: **Monat (4,99 €)**.

---

## 5. Trial-Logik

- 7 Tage gratis für jeden, **Karte beim Trial-Start hinterlegt** (über LemonSqueezy).
- Nach 7 Tagen automatische Abbuchung des Monats-Abos, sofern nicht gekündigt.
- Kündigung jederzeit; Pro läuft bis zum Ende der bezahlten Periode weiter.
- `trial_genutzt`-Flag verhindert Mehrfach-Trials pro Account.
- **Optional (kein Blocker):** Reminder-Mail an Tag 6 ("Trial endet morgen, ab dann
  4,99 €/Monat"). Reduziert Chargebacks.

---

## 6. Technische Architektur

### 6.1 Datenbank — Migration `0019_pro_subscription`

`nutzer_profil` erweitern:

| Spalte | Typ | Default | Zweck |
|---|---|---|---|
| `plan_tier` | text | `'free'` | free / pro — *existiert bereits* |
| `plan_status` | text | `null` | trial / active / cancelled / expired |
| `plan_intervall` | text | `null` | woche / monat / jahr |
| `plan_bis` | timestamptz | `null` | Bis wann Pro gilt (bleibt bei Kündigung = Periodenende) |
| `trial_genutzt` | boolean | `false` | Verhindert Mehrfach-Trials |
| `ls_customer_id` | text | `null` | LemonSqueezy-Verknüpfung |
| `ls_subscription_id` | text | `null` | LemonSqueezy-Verknüpfung |

RLS: bestehende Policies auf `nutzer_profil` greifen. **Wichtig:** Diese Felder dürfen
nur per Service-Role (Webhook) geschrieben werden — der User darf seinen `plan_tier`
nicht selbst per Update setzen. Update-Policy entsprechend einschränken oder Schreibweg
ausschließlich über Webhook mit Service-Key.

### 6.2 Pro-Check (server-seitig, §10 Security)

- Zentraler Helper, z. B. `istPro(profil): boolean` =
  `profil.plan_tier === 'pro' && profil.plan_bis && profil.plan_bis > jetzt`.
- Pro-Features in Server-Components & Route-Handlern damit gaten.
- UI zeigt nur Pro-Badge + Upgrade-Prompt — **niemals nur Client-seitig sperren.**
- API-Routen der Pro-Features (Coach, Briefing, Trend) prüfen `istPro` serverseitig,
  bevor sie Claude-API-Calls auslösen (sonst Kosten-Leck).

### 6.3 Webhook `/api/webhooks/lemonsqueezy`

- **Signatur verifizieren** (HMAC mit Signing-Secret) — sonst 401.
- Events → Aktion auf `nutzer_profil` (Mapping LemonSqueezy-Customer → user_id):
  - `subscription_created` → Trial-Start: `tier=pro`, `status=trial`, `bis=+7 Tage`,
    `trial_genutzt=true`
  - `subscription_payment_success` → `status=active`, `bis=+Intervall`
  - `subscription_updated` (Plan-Wechsel) → `intervall` aktualisieren
  - `subscription_cancelled` → `status=cancelled`, **`bis` bleibt = Periodenende**
  - `subscription_expired` → `tier=free`, `status=expired`
- Idempotent behandeln (Events können doppelt kommen).
- Input mit zod validieren.

### 6.4 Checkout-Flow

1. Pricing-Page (`/pro` oder `/einstellungen/pro`) zeigt 3 Intervalle + Feature-Vergleich.
2. "Upgrade"-Button → LemonSqueezy Hosted-Checkout (Trial dort konfiguriert,
   `custom_data` = user_id für Webhook-Mapping).
3. Checkbox "Ich bin berechtigt, diesen Kauf zu tätigen".
4. Nach Checkout → Redirect zurück in die App, Webhook aktiviert Pro.
5. Verwaltung/Kündigung über LemonSqueezy Customer-Portal (Link in Einstellungen).

### 6.5 UI-Komponenten

- **Pricing-Page** mit Feature-Vergleichstabelle + 3 Intervall-Karten (Jahr als
  "Beliebt/Spar-Tipp" hervorgehoben).
- **Upgrade-Prompt / Pro-Gate**: wiederverwendbare Komponente, die bei gesperrten
  Features statt Inhalt einen "Pro freischalten"-CTA zeigt.
- **Pro-Badge** im Profil/Einstellungen + Status ("Trial endet am …", "Aktiv bis …").
- **Einstellungen → Abo**: aktueller Plan, Status, Kündigen-Link (Customer-Portal).

---

## 7. Kosten bei Scale (Sanity-Check)

- LemonSqueezy: ~5 % + 0,50 € pro Transaktion, keine Fixkosten.
- Claude-API (Pro-Features) skaliert mit zahlenden Usern — pro Coach/Briefing-Call
  Kosten kalkulieren, serverseitiges Pro-Gating verhindert Kosten durch Free-User.
- Supabase/Vercel Free-Tier reicht für Beta; Webhook ist eine leichte Route.

---

## 8. Zukunfts-Szenario: Mitarbeiter (festgehalten, nicht aktiv)

Reine Zukunftsplanung — **keine Einstellung geplant**. Mitarbeiter finanziert man in
dieser Phase nicht aus Abo-Umsatz, sondern aus Funding oder gar nicht. Team = Nepomuk
+ Claude.

| Phase | Wann | Personal | Monats-Kosten |
|---|---|---|---|
| 0 — Solo | jetzt → Beta (Aug) | Du + Claude | ~10 € API + 0 € Free-Tiers |
| 1 — Erste Umsätze | Beta → ~100 zahlende | + evtl. 1 Freelancer (Einzelauftrag) | ~30–80 € |
| 2 — Traktion | ~500–1.000 zahlende | Werkstudent (Support/Content), stundenweise | aus Umsatz gedeckt |
| 3 — Skalierung | Funding ODER >2.000 zahlende | Erste echte Einstellung | extern finanziert |

Referenz-Rechnung: Ein Junior-Entwickler (~5.000 €/Monat Vollkosten) entspricht
~1.180 zahlenden Monats-Abos (~23.600 aktive User bei 5 % Conversion).

---

## 9. Offene Punkte / Nicht in diesem Scope

- LemonSqueezy-Account-Setup + Produkt-/Varianten-Anlage (manuell, durch Nepomuk/Vater).
- AGB + Widerrufsbelehrung + Datenschutz-Anpassung (separater rechtlicher Strang).
- Reminder-Mail Tag 6 (optional, später).
- PDF-Report-Generierung (eigenes Feature, später spezifizieren).
- Klassen-Vergleich (Post-Beta).

---

## 10. Build-Reihenfolge (Vorschau für Implementierungs-Plan)

1. Migration `0019_pro_subscription` + TS-Types regenerieren.
2. `istPro`-Helper + serverseitiges Gating der bestehenden Pro-Features (Coach, Briefing).
3. Webhook-Route inkl. Signaturprüfung + Event-Handling.
4. Pricing-Page + Pro-Gate-Komponente + Upgrade-Prompt.
5. Einstellungen → Abo (Status + Kündigen-Link).
6. LemonSqueezy verbinden (Checkout-Link, custom_data, Customer-Portal).
7. Korrekte Button-Beschriftung + Trial-Bedingungen (§312j) im Checkout-Pfad.
