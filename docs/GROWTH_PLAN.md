# GROWTH_PLAN — Landing Page, Waitlist, Outreach & Conversion
**Stand:** 02.07.2026 · **Beta-Launch:** Ende August 2026
**Ersetzt:** Teile von marketingplan_v2_invisible.html

---

## 0. Strategie-Überblick

**Drei Säulen — in dieser Reihenfolge:**

| Säule | Was | Wann | Ziel |
|-------|-----|------|------|
| 1. Direct Outreach | Persönliches Netzwerk direkt anschreiben | Sofort | Beta-User 1–20 |
| 2. Landing Page + Waitlist | Email-Capture vor Launch | Woche 2 | 50–200 Interessenten |
| 3. SEO + Community | Passiver Traffic, Schüler-Foren | Woche 4+ | Wachstum nach Beta |

**Ehrliche Erwartung:** 20 Beta-User bis August sind ohne Social Media lösbar — allein durch Nepomuks Netzwerk. Social Media und SEO sind für die Wachstumsphase nach Beta, nicht für Beta selbst.

---

## 1. Direct Outreach — Beta-User 1–20

Der schnellste und sicherste Weg zu echten ersten Usern. Kein Budget, kein Gesicht, nur ehrliche direkte Ansprache.

### Das Netzwerk-Modell

| Quelle | Realistisch | Wie |
|--------|-------------|-----|
| Schulklasse + Schulgruppen-Chats | 8–12 | 1 Nachricht in 2–3 Schulgruppen |
| Freundeskreis (1-zu-1) | 5–8 | Persönliche WhatsApp an 20 Kontakte |
| FC Hochrad + Padel | 3–6 | Kurze Erwähnung nach Training |
| **Gesamt** | **16–26** | In 2–3 Wochen erreichbar |

### Message-Templates

**Schulgruppe (WhatsApp-Gruppe):**
> "Hey, ich hab die letzten Wochen eine App gebaut die ich selbst gebraucht hätte. Notenrechner für die Oberstufe — 0–15 Punkte, Halbjahres-Tracking, What-If (was passiert mit meinem Schnitt wenn ich die nächste Klausur versaue). Sieht anständig aus, nicht wie notenapp.de aus 2009. Kostet nix. Beta-Phase, ihr seid die ersten die's benutzen können: [link]. Ehrliches Feedback erwünscht."

**Direkte 1-zu-1 WhatsApp:**
> "Hey [Name], ich hab gerade eine App fertig die für uns Sinn macht. Notenrechner Oberstufe — magst du kurz draufschauen und mir sagen was nervt? 5 Minuten reichen. [link]"

### Beta-Feedback sammeln (kein Fragebogen, kurzes Gespräch)

| # | Frage | Warum |
|---|-------|-------|
| 1 | „Was hast du als erstes gemacht als du die App geöffnet hast?" | Onboarding-Klarheit |
| 2 | „Hast du sie nochmal geöffnet? Warum / warum nicht?" | Retention-Signal — wichtigster KPI |
| 3 | „Würdest du sie einem Freund schicken? Mit welchen Worten?" | Echter Value Prop + Referral-Potenzial |
| 4 | „Was fehlt dir?" | Roadmap-Input |

**Ehrliche Erwartung:** Von 20 angeschriebenen Personen werden ~5 die App aktiv und wiederholt nutzen. Das ist normal. Diese 5 sagen dir was das Produkt wirklich braucht.

---

## 2. Landing Page & Waitlist

### Zweck
Die Landing Page hat einen Job: **Email-Adressen sammeln** von Schülern die die App wollen, bevor sie live ist. Jede Email = ein potenzieller Beta-User der aktiv schon Interesse gezeigt hat.

### Was auf die Landing Page muss

**Above the Fold (sofort sichtbar):**
- Headline: Klares Versprechen, keine Buzzwords (z.B. „Dein Abischnitt. Jederzeit. In 10 Sekunden.")
- Sub-Headline: Zielgruppe benennen (Klasse 11–13, 0–15 Punkte System)
- Email-Eingabe + CTA-Button („Jetzt Beta-Zugang sichern")
- Kein Login, keine Ablenkung

**Darunter (optional, baut Vertrauen):**
- 1–2 Screenshots der App (dunkel, wie die App aussieht)
- 3 konkrete Features in 1 Satz je (Notenrechner, What-If, Halbjahres-Tracking)
- Sozialer Beweis sobald vorhanden: „X Schüler auf der Waitlist"

**Footer:**
- Datenschutz + Impressum (Pflicht, auch für Waitlist)

### Was NICHT auf die Landing Page
- Pricing (noch kein Abo-Druck vor Beta)
- lange Feature-Liste
- Team-Fotos oder "über uns"
- Videos (Ladezeit, Ablenkung)

### Waitlist-Tool

**Empfehlung: eigene Implementierung via Supabase**
- Einfaches Formular → Email in Supabase-Tabelle `waitlist` speichern
- Keine externen Tools (kein Mailchimp, kein Beehiiv) solange die Liste unter 200 Einträge hat
- Kosten: 0€, volle Kontrolle, DSGVO-konform weil eigene DB

**Alternativ wenn schnell:** Tally.so (Free Tier) — kostenloses Formular, Emails per CSV exportierbar

### Email an Waitlist-User (1 Email, wenn Beta-Launch)

Betreff: „Du bist drin — [App-Name] Beta startet jetzt"

Inhalt (kurz):
- 2 Sätze: Was die App kann
- Direkter Link zum Sign-up
- „Du warst auf der Waitlist — du bekommst als Erstes Zugang"
- Optional: kleiner Anreiz (30 Tage Pro kostenlos für Waitlist-User)

---

## 3. Product-Led Growth (PLG)

Das Produkt selbst bringt neue User — ohne Marketing-Budget. Skaliert passiv.

### Referral-System

| Element | Umsetzung | Aufwand |
|---------|-----------|---------|
| Einlade-Link | Jeder User bekommt personalisierten Link (`/join?ref=abc123`) im Dashboard | Klein — URL-Parameter |
| Anreiz | „Du und dein Freund bekommen beide 30 Tage frühen Premium-Zugang" | Minimal — Boolean in DB |
| Share-Prompt | Nach erstem Login und nach Noteneingabe: kleiner, nicht nerviger Hinweis | Klein — UI-Komponente |
| Tracking | Supabase: Referral-Quelle beim Sign-up speichern | Klein — ein DB-Feld |

### Öffentlicher Notenrechner (`/rechner`)

**Die wichtigste PLG-Seite:**
- Funktioniert ohne Login
- User gibt Noten ein, sieht sofort Ergebnis
- Am Ende: „Speichere deine Daten — kostenlos anmelden"
- Das ist der natürlichste Conversion-Funnel: Wert zuerst, Account danach
- Gleichzeitig die wichtigste SEO-Seite (öffentlich indexierbar)

### Der Schulklassen-Effekt

Schüler einer Klasse haben identischen Kontext: gleiche Fächer, gleiche Klausuren. Wenn einer die App nutzt, entsteht ein natürlicher Gesprächsanlass. Word-of-Mouth innerhalb einer Klasse ist der stärkste Kanal ohne Marketing-Budget.

---

## 4. SEO-Strategie

SEO bringt keine Ergebnisse vor September/Oktober 2026. Trotzdem jetzt starten — jeder Monat Verzögerung = ein Monat später Traffic.

### Keywords (Suchvolumen DE, Schätzungen — nicht mit Ahrefs verifiziert)

| Keyword | Monatl. Suchen (Schätzung) | Schwierigkeit |
|---------|---------------------------|---------------|
| „Notenrechner Oberstufe" | 8.000–15.000 | Mittel |
| „Notendurchschnitt berechnen Gymnasium" | 3.000–6.000 | Niedrig |
| „Punkte in Noten umrechnen Abitur" | 2.000–5.000 | Mittel |
| „Was brauche ich noch in Mathe um eine 2" | 1.000–3.000 | Sehr niedrig |
| „Halbjahreszeugnis Schnitt berechnen" | 500–1.500 | Niedrig |

Konkurrenz (notenapp.de) hat schwaches SEO + altes Design — das ist die Lücke.

### SEO in 3 Schritten

**Schritt 1 — Sofort (Woche 1–3) · 0€**
- `/rechner` live bringen (öffentlich, kein Login)
- Title-Tag: `Notenrechner Oberstufe — 0–15 Punkte System | [App-Name]`
- Meta-Description mit Keywords
- Google Search Console einrichten (kostenlos)

**Schritt 2 — Woche 4–8 · 0€**
- 2–3 Informationsseiten schreiben:
  - „So funktioniert das 0–15 Punkte System in der Oberstufe"
  - „Wie wird der Abiturschnitt berechnet? (Hamburg)"
  - „Was passiert wenn du eine Klausur versaust — Halbjahresschnitt erklärt"
- Diese Seiten ranken für Informationsanfragen und leiten zur App

**Schritt 3 — Woche 9–12 · 0€**
- Backlinks organisch aufbauen: SchülerForum.de-Eintrag, r/Schule Post, Discord-Erwähnungen
- Kein Kauf von Backlinks, kein Black-Hat

---

## 5. Community Seeding

In bestehenden Schüler-Communities echten Mehrwert liefern, dann das Tool erwähnen. Kein Gesicht nötig. Funktioniert nur wenn das Produkt gut ist.

### Die relevanten Communities

| Community | Größe | Einstieg |
|-----------|-------|---------|
| r/Schule (Reddit) | ~35.000 | 1–2 Wochen aktiv kommentieren, dann ehrlicher Post |
| r/abitur (Reddit) | ~12.000 | Zur Klausur-/Abitursaison posten |
| SchülerForum.de | 100k+ registriert | Account erstellen, in Noten-Threads kommentieren |
| Abitur 2026/2027 Discord | 1k–20k | Server suchen und joinen |

### Regeln für Community Seeding

**Was funktioniert:**
- Erst 5–10 echte Kommentare ohne Produkt-Erwähnung
- Ehrlich sein: „Ich hab das selbst gebaut, bin gespannt was ihr denkt"
- Link in der Bio lassen, nicht in jeden Kommentar

**Was schadet:**
- Link in jedem Kommentar → Ban
- Fake-Accounts für künstliche Empfehlungen
- Post ohne Kontext: „Check out my app!"

### Reddit-Post Template (r/Schule)

**Titel:** „Ich hab einen Notenrechner gebaut weil ich notenapp.de nicht mehr sehen kann — Ehrliches Feedback gesucht"

**Text:**
> Hallo, ich bin 17, mache gerade 11. Klasse und hatte die gleiche Frustration wie vermutlich viele hier: Bestehende Noten-Apps sehen aus wie 2009 und machen das Falsche. Also hab ich selbst eine gebaut. Kostenlos, keine Anmeldung für den Basis-Rechner. [Link]. Was nervt? Was fehlt? Komplett offen für Kritik.

**Zeitaufwand:** 2–3 Stunden pro Woche für echte Community-Teilnahme. Kann nicht automatisiert werden.

---

## 6. Launch-Momentum

### 2 Wochen VOR Launch (Mitte August)

| Aktion | Zweck |
|--------|-------|
| Countdown-Posts auf Social (Clip: „in X Tagen live") | Erwartung aufbauen |
| Beta-Einladungen an Waitlist rausschicken | Erste echte User gewinnen |
| Netzwerk nochmal direkt anschreiben (Follow-up) | Erinnerung an App |
| Creator-Post in dieser Woche idealerweise live | Externe Glaubwürdigkeit |
| Öffentliche `/rechner`-Seite prominenter bewerben | Letzter Conversion-Push |

### 2 Wochen NACH Launch (September)

| Aktion | Zweck |
|--------|-------|
| „Die App ist live"-Content | Momentum, Social Proof |
| Erster echter Review von Beta-User posten (mit Erlaubnis) | Trust |
| Feedback aus Beta in Content ummünzen | Community-Bindung |
| Community-Kommentare intensivieren (Reddit, SchülerForum) | Organischer Traffic |
| Referral-System pushen: „Lade einen Freund ein" | PLG aktivieren |

---

## 7. Paid Ads (nach Beta)

**Grundsatz: Kein Paid vor Beta-Launch. Erst organisch validieren.**

**Wann sinnvoll:** Wenn organisch ein Post auf 50k+ Views gelaufen ist → diesen boosten.

**Kanal:** TikTok Ads (günstigster CPM für die Zielgruppe)

**Minimum sinnvolles Budget:** ~50–100€/Monat

**Vor Paid Ads unbedingt haben:**
- Funktionierender Onboarding-Flow (User landet, versteht sofort, bleibt)
- Messbare Conversion-Rate (Besucher → Sign-up)
- Klares USP in einer Zeile (für Ad-Creative)

---

## 8. Timeline & KPIs

### 12-Wochen-Zeitplan

```
Juli 2026
├── W1: Landing Page live + Waitlist aktiv + /rechner veröffentlichen
├── W2: Direct Outreach starten (Schulgruppen + Freundeskreis)
├── W3: Beta-Feedback einsammeln, App iterieren
└── W4: Google Search Console einrichten, erste SEO-Seite schreiben

August 2026
├── W5: Referral-System im Produkt live bringen
├── W6–8: Community Seeding (Reddit, SchülerForum) starten
├── W8: Creator-Deals final (Posting-Zeitraum Pre-Launch)
└── W10: Launch-Momentum beginnt

Ende August
└── 🚀 BETA-LAUNCH — Waitlist-Emails raus, Netzwerk nochmal pushen
```

### Primäre KPIs (einzige die zählen)

| KPI | Beta-Ziel | Wie messen |
|-----|-----------|-----------|
| Aktive Beta-User (mind. 2x geöffnet) | 20 | Supabase Login-Events |
| Waitlist-Emails | 50–100 | Supabase `waitlist`-Tabelle |
| Retention Day 7 | > 30% | Supabase — User noch aktiv nach 7 Tagen |
| Referral-Rate | > 10% | Wie viele User kamen per Einlade-Link |

### Sekundäre KPIs (nach Kanal)

| Kanal | KPI |
|-------|-----|
| Social Media | Follower, Videoviews (Richtwert: 1 Video auf 5k+ Views = Content funktioniert) |
| SEO | Search Console — Impressionen auf /rechner |
| Community | Kommentare/Replies die Interesse zeigen |
| Direct Outreach | Conversion: Angeschrieben → hat App installiert |

### Wann der Plan scheitert

- **Retention = 0:** User öffnet einmal, nie wieder. → Produkt-Problem, kein Marketing-Problem. Marketing stoppen, App fixen.
- **Outreach ignoriert:** → Entweder App noch nicht bereit, oder falscher Kanal. Feedback einholen.
- **Social wächst nicht:** → Erwartet. Kein Beta-Blocker. Weiter machen, Kanal ist für nach Beta.

---

## 9. Budget

| Posten | Kosten | Wann |
|--------|--------|------|
| Waitlist-Infrastruktur (Supabase) | 0€ | Schon vorhanden |
| Landing Page (Vercel) | 0€ | Schon vorhanden |
| Community Seeding | 0€ | Zeitaufwand, kein Geld |
| SEO | 0€ | Zeitaufwand, kein Geld |
| Creator-Deal | 0€ cash (Premium-Zugang) | Wenn Pro-System live |
| Paid Ads (optional) | 50–100€/Monat | Erst nach Beta, wenn organisch validiert |
| **Gesamt bis Launch** | **0€** | — |

---

*Dieses Dokument deckt alles außer Content-Produktion ab. Für Clip-Bibliothek, Plattform-Strategie und Creator-Outreach → CONTENT_PLAN.md*
