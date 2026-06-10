# Coach Agent — Design Spec

**Datum:** 2026-06-10  
**Status:** Approved — ready for implementation

---

## Ziel

Der KI-Coach bekommt echte Schreibrechte auf alle App-Daten via Anthropic Tool Use (Function Calling). User kann natürlichsprachlich Befehle geben ("Füg Mathe-Klausur am 20. Juni hinzu"), Coach zeigt Vorschau, User bestätigt, Coach führt aus. Undo für die letzte Aktion möglich.

---

## Architektur

### API-Flow (3 Phasen)

**Phase 1 — Nachricht senden**
```
POST /api/coach
Body: { messages: ConversationMessage[] }

Response A (Text): { type: "text", content: string }
Response B (Tool Call): { type: "tool_call", name: string, input: object, tool_use_id: string, preview: string }
```

**Phase 2 — Nach Bestätigung**
```
POST /api/coach
Body: { messages: ConversationMessage[], tool_result: { tool_use_id: string, output: string } }

Response: { type: "text", content: string }
```

**Phase 3 — Undo (client-side only)**
```
Kein API-Call. Client hält UndoStack in React State.
User tippt "rückgängig" → wird client-seitig abgefangen → letzte Undo-Funktion ausführen.
```

### Kein Streaming mehr
Haiku 4.5 ist schnell genug für non-streaming. Eliminiert Komplexität bei Tool-Call-Erkennung.

### Execution client-side
Der `/api/coach` Route koordiniert nur Claude. Tatsächliche DB-Mutationen laufen über bestehende Server Actions (bereits per Supabase Auth gesichert), aufgerufen direkt vom Client nach User-Bestätigung.

---

## Tools (15 total)

### Kontext: IDs im System-Prompt
Damit Claude korrekte IDs in Tool-Calls verwendet, enthält der System-Prompt alle relevanten Datensätze mit ID-Prefix: `[id:abc123]`. Format ist kompakt und maschinenlesbar.

```
Fächer:
- [id:abc] Mathematik (LK) · Schnitt 12.3
- [id:def] Deutsch (GK) · Schnitt 11.0

Klausuren (nächste 5):
- [id:ghi] Mathe-Klausur · 20.06.2026 · in 10 Tagen

Hausaufgaben (offen):
- [id:jkl] Hausaufgabe: Aufsatz Deutsch · fällig 15.06.

Stundenplan:
- [id:mno] Mo 08:00–09:30 · Mathematik

Noten (letzte 3 pro Fach):
- Mathematik: [id:pqr] 13P schriftlich, [id:stu] 11P mündlich
```

### Tool-Definitionen

**Noten**
- `note_erstellen` — fach_id, punkte (0–15), kategorie ("muendlich"|"schriftlich"|"sonstig"), bezeichnung?, gewicht?
- `note_bearbeiten` — note_id, punkte?, kategorie?, bezeichnung?, gewicht?
- `note_loeschen` — note_id

**Klausuren**
- `klausur_erstellen` — fach_id?, titel, datum (YYYY-MM-DD)
- `klausur_bearbeiten` — klausur_id, titel?, datum?
- `klausur_loeschen` — klausur_id

**Hausaufgaben**
- `aufgabe_erstellen` — beschreibung, fach_id?, faellig_am (YYYY-MM-DD)
- `aufgabe_erledigt` — aufgabe_id, erledigt (boolean)
- `aufgabe_loeschen` — aufgabe_id

**Stundenplan**
- `stunde_erstellen` — wochentag (1–7), zeit_start ("HH:MM"), zeit_end ("HH:MM"), fach_id?, raum?, lehrer?
- `stunde_bearbeiten` — stunde_id, wochentag?, zeit_start?, zeit_end?, fach_id?, raum?, lehrer?
- `stunde_loeschen` — stunde_id

**Fächer**
- `fach_erstellen` — name, niveau ("grund"|"erhoeht"), halbjahr (aus Profil)
- `fach_bearbeiten` — fach_id, name?, niveau?, farbe?
- `fach_loeschen` — fach_id

---

## Fehlende Server Actions (müssen neu erstellt werden)

Alle anderen Actions existieren bereits in `lib/actions/schule.ts`, `hausaufgaben.ts`, `stundenplan.ts`.

- `updateKlausur(id, { titel?, datum? })` → in `schule.ts` ergänzen
- `updateHausaufgabe(id, { beschreibung?, faelligAm? })` → in `hausaufgaben.ts` ergänzen

---

## UI-Änderungen (coach-chat.tsx)

### Neuer Message-Typ: `tool_call_pending`
```typescript
type Msg =
  | { role: "user" | "assistant"; content: string }
  | { role: "tool_call"; tool_use_id: string; preview: string; tool_name: string; tool_input: object }
  | { role: "tool_result"; success: boolean; summary: string }
```

### Bestätigungs-Karte
Wird als Chat-Bubble angezeigt wenn Coach einen Tool Call zurückgibt:
- Preview-Text (menschenlesbar, vom API generiert): "Klausur 'Mathe' am 20.06.2026 eingetragen."
- Zwei Buttons: **Bestätigen** (grün) / **Abbrechen** (grau)
- Nach Klick: Karte wird durch Ergebnis-Bubble ersetzt

### Undo-Stack
```typescript
type UndoEntry = {
  id: string
  description: string
  undo: () => Promise<void>
}
const [undoStack, setUndoStack] = useState<UndoEntry[]>([])
```

- Max 5 Einträge (LIFO)
- "rückgängig" als Keyword: client-seitig abfangen bevor API-Call, letzten Undo ausführen
- Kleiner Undo-Button erscheint nach jeder erfolgreichen Aktion (5s sichtbar, dann fade)

---

## System-Prompt Update

```
Du bist ein KI-Coach für einen 17-jährigen Gymnasiasten.

WICHTIG: Du hast Tools um Daten zu ändern. Nutze sie wenn der User etwas hinzufügen, ändern oder löschen will.
Frag nicht nach — erkenne aus dem Kontext welche Aktion gemeint ist und rufe das Tool auf.
Wenn du ein Tool aufrufst, antworte NICHT zusätzlich mit Text. Der User sieht eine Bestätigungs-Karte.
Erst nach der Bestätigung (tool_result) gibst du eine kurze Bestätigung auf Deutsch.

Für Fragen: antworte direkt, kurz, ohne Tool-Aufruf.
Sprache: Deutsch, du-Form. Ton: direkter Freund, kein Coach-Speak.
```

---

## Datei-Änderungen

| Datei | Änderung |
|-------|----------|
| `app/api/coach/route.ts` | Komplett umschreiben: Tool Use, non-streaming, JSON response |
| `components/dashboard/coach-chat.tsx` | Neuer Msg-Typ, Bestätigungs-Karte, Undo-Stack, Keyword-Abfang |
| `lib/actions/schule.ts` | `updateKlausur` ergänzen |
| `lib/actions/hausaufgaben.ts` | `updateHausaufgabe` ergänzen |
| `lib/coach/tools.ts` | Neu: Tool-Definitionen als typisiertes Array (DRY — einmal definiert, von Route importiert) |
| `lib/coach/context.ts` | Neu: `baueCoachKontext()` — reichert System-Prompt mit IDs an |

---

## Was NICHT gebaut wird

- Streaming (gespart, reicht für Haiku)
- Undo-History in DB (React State reicht, reset on refresh ist ok)
- Tool-Calls die mehrere Actions auf einmal ausführen (eine Action pro Tool-Call)
- Mehrschrittiger Wizard (alles in einem Tool-Call)
