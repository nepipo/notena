# Onboarding-Flow — Design Spec

**Datum:** 2026-06-05  
**Status:** Approved  
**Scope:** `/app/onboarding/page.tsx` + `lib/actions/schule.ts` + `completeOnboarding`

---

## Ziel

Time-to-Value minimieren: Ein neuer User soll nach dem Signup in unter 60 Sekunden seinen Namen, seine Klasse und mindestens ein Fach eingetragen haben — und dann ein lebendiges Dashboard sehen, nicht eine leere Seite.

---

## Flow-Übersicht

3 Screens, kein Scroll-Wall, Progress-Balken oben.

```
Screen 1: Profil      → Screen 2: Fächer      → Screen 3: Modus + Done
(name + klasse)          (chips + freitext)       (eingabe_modus + summary)
```

Trigger: `onboarding_abgeschlossen === false` in `nutzer_profil` → Redirect zu `/onboarding` (bereits implementiert im App-Layout).

---

## Screen 1 — Profil

**Felder:**
- `name` (Vorname) — Pflicht, Freitext-Input, Placeholder "Vorname"
- `klasse` — Pflicht, 3 große Button-Cards: **11 / 12 / 13**

**Validierung:** Weiter-Button disabled bis beide Felder ausgefüllt/gewählt.

**State:** Wird client-seitig gehalten bis "Los geht's" auf Screen 3 alles in einem einzigen Server Action Call speichert.

---

## Screen 2 — Fächer

**Überspringen** erlaubt (Link unter dem Weiter-Button).

**Chip-Liste (häufige Fächer):**
Mathe, Deutsch, Englisch, Physik, Geschichte, Biologie, Chemie, Sport, Musik, Informatik, Latein, Französisch, Spanisch

Jeder Chip ist ein Toggle: Antippen = ausgewählt (blauer Fill), nochmal = abgewählt.

**Freitexteingabe:**
- Input "Eigenes Fach…" + GK/LK-Dropdown + `+`-Button
- Hinzugefügte eigene Fächer erscheinen in einer Liste unter dem Input mit `✕`-Remove

**GK/LK pro Fach:** Chip antippen → wird sofort als GK hinzugefügt und in der Fach-Liste darunter angezeigt. In der Liste kann man GK/LK per Toggle umschalten. Freitext-Fächer haben das GK/LK-Dropdown direkt neben dem Input-Feld.

**Speicherung:** Fächer werden **direkt beim Hinzufügen** über die bestehende `addFach` Action in die DB geschrieben (kein Batch am Ende — so sind die Fächer auch da wenn der User auf Screen 3 "Überspringen" gedrückt hat und danach abbricht).

---

## Screen 3 — Eingabe-Modus + Done

**Eingabe-Modus (bereits existiert in Onboarding):**
- Punkte (0–15) — Default, großer ausgewählter Card-Style
- Noten (1+ bis 6) — Alternative

**Mini-Summary (read-only):**
- Name: `<name>`
- Klasse: `<klasse>`
- Fächer: kommagetrennte Liste (oder "Keine" wenn übersprungen)

**"Los geht's"-Button:**
Ruft erweiterte `completeOnboarding(name, klasse, eingabeModus)` Action auf → speichert `name`, `klasse`, `eingabe_modus` + setzt `onboarding_abgeschlossen: true` → Redirect zu `/dashboard`.

---

## Technische Änderungen

### 1. `completeOnboarding` Action erweitern (`lib/actions/schule.ts`)

```ts
// Vorher
completeOnboarding(eingabeModus: string)

// Nachher
completeOnboarding(name: string, klasse: number, eingabeModus: string)
```

Speichert: `name`, `klasse`, `eingabe_modus`, `onboarding_abgeschlossen: true`

### 2. `/app/onboarding/page.tsx` — komplettes Rewrite

- State: `step` (1/2/3), `name`, `klasse`, `eingabeModus`
- Progress-Balken: 3 Segmente statt 2
- Screen 1: Name-Input + Klasse-Buttons
- Screen 2: Chip-Grid + Freitext-Zeile + Liste angelegter Fächer + Überspringen
- Screen 3: Modus-Cards + Summary + Los geht's

### 3. Chip-Fächer mit GK/LK

Jeder angelegte Fach-Chip hält lokal `{ name: string, kursart: "GK" | "LK" }`. Beim Anlegen (Chip-Klick oder `+`-Button) wird sofort `addFach` gerufen.

### 4. Kein DB-Migration nötig

Alle benötigten Spalten (`name`, `klasse`, `eingabe_modus`, `onboarding_abgeschlossen`) existieren bereits in `nutzer_profil`.

---

## Was nicht reinkommt (bewusst)

- `bundesland` — kein Feature nutzt es aktuell, Migration unnötig
- `nachname`, `geburtsdatum`, `schulform` — optional, erreichbar über `/einstellungen/profil`
- Halbjahr-Auswahl — Auto-Detect läuft bereits, kein Onboarding-Schritt nötig

---

## Design-Vorgaben

- Dark Mode, gleicher Look wie restliche App
- Progress: 3 blaue Balken (`bg-brand`) oben, inaktive grau
- Klasse-Buttons: große Cards mit `border-brand bg-brand/10` für aktiven State
- Chip-Farbe aktiv: `bg-brand text-black`
- Chip-Farbe inaktiv: `bg-surface-2 border-border text-brand`
- Animationen: `animate-fade-up` beim Step-Wechsel
- Mobile-first, `max-w-md`
