# Coach Agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** KI-Coach bekommt Tool Use (Function Calling) — kann alle App-Daten lesen UND schreiben, zeigt Bestätigungs-Karte vor jeder Mutation, unterstützt Undo.

**Architecture:** `/api/coach` konvertiert Client-Messages zu Anthropic-Format, ruft Claude mit 15 Tools auf, gibt entweder `{ type: "text" }` oder `{ type: "tool_call" }` zurück. Client führt DB-Mutation via Server Actions aus (nach User-Bestätigung), hält Undo-Stack in React State. Kein Streaming — Haiku 4.5 ist schnell genug.

**Tech Stack:** Anthropic SDK (Tool Use), Next.js Server Actions, Supabase, React useState

---

## File Map

| Datei | Aktion | Zweck |
|-------|--------|-------|
| `lib/actions/schule.ts` | Modify | `updateKlausur` ergänzen |
| `lib/actions/hausaufgaben.ts` | Modify | `updateHausaufgabe` ergänzen |
| `lib/coach/tools.ts` | Create | 15 Anthropic Tool-Definitionen + ToolName-Typ |
| `lib/coach/context.ts` | Create | `baueCoachKontext()` — System-Prompt mit IDs + Raw-Daten für Snapshot |
| `app/api/coach/route.ts` | Rewrite | Non-streaming JSON route mit Tool Use |
| `components/dashboard/coach-chat.tsx` | Rewrite | Bestätigungs-Karte, Undo-Stack, Execution-Switch |

---

## Task 1: Fehlende Server Actions ergänzen

**Files:**
- Modify: `lib/actions/schule.ts`
- Modify: `lib/actions/hausaufgaben.ts`

- [ ] **Schritt 1: `updateKlausur` in `lib/actions/schule.ts` ergänzen**

Am Ende der Datei, nach `removeKlausur`, einfügen:

```typescript
export async function updateKlausur(
  klausurId: string,
  updates: { titel?: string; datum?: string },
): Promise<ActionResult> {
  if (updates.titel !== undefined && !updates.titel.trim()) {
    return { ok: false, error: "Titel darf nicht leer sein." };
  }
  try {
    const userId = await requireUserId();
    const supabase = await createClient();
    const patch: Record<string, unknown> = {};
    if (updates.titel !== undefined) patch.titel = updates.titel.trim();
    if (updates.datum !== undefined) patch.datum = updates.datum;
    const { error } = await supabase
      .from("schule_klausur")
      .update(patch)
      .eq("id", klausurId)
      .eq("user_id", userId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/dashboard");
    revalidatePath("/aufgaben");
    revalidatePath("/stundenplan");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler." };
  }
}
```

- [ ] **Schritt 2: `updateHausaufgabe` in `lib/actions/hausaufgaben.ts` ergänzen**

Am Ende der Datei einfügen:

```typescript
export async function updateHausaufgabe(
  id: string,
  updates: { beschreibung?: string; faelligAm?: string },
): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const supabase = await createClient();
    const patch: Record<string, unknown> = {};
    if (updates.beschreibung !== undefined) patch.beschreibung = updates.beschreibung.trim();
    if (updates.faelligAm !== undefined) patch.faellig_am = updates.faelligAm;
    const { error } = await supabase
      .from("hausaufgabe")
      .update(patch)
      .eq("id", id)
      .eq("user_id", userId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/aufgaben");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler." };
  }
}
```

- [ ] **Schritt 3: TypeScript-Check**

```bash
cd ~/project-x && npx tsc --noEmit 2>&1 | head -20
```

Erwartung: keine neuen Fehler.

- [ ] **Schritt 4: Commit**

```bash
git add lib/actions/schule.ts lib/actions/hausaufgaben.ts
git commit -m "feat: updateKlausur + updateHausaufgabe Server Actions für Coach"
```

---

## Task 2: Tool-Definitionen (`lib/coach/tools.ts`)

**Files:**
- Create: `lib/coach/tools.ts`

- [ ] **Schritt 1: `lib/coach/` Verzeichnis + Datei anlegen**

```typescript
// lib/coach/tools.ts
import type Anthropic from "@anthropic-ai/sdk";

export type ToolName =
  | "note_erstellen" | "note_bearbeiten" | "note_loeschen"
  | "klausur_erstellen" | "klausur_bearbeiten" | "klausur_loeschen"
  | "aufgabe_erstellen" | "aufgabe_erledigt" | "aufgabe_loeschen"
  | "stunde_erstellen" | "stunde_bearbeiten" | "stunde_loeschen"
  | "fach_erstellen" | "fach_bearbeiten" | "fach_loeschen";

export const COACH_TOOLS: Anthropic.Tool[] = [
  // ── Noten ──────────────────────────────────────────────────────────
  {
    name: "note_erstellen",
    description: "Erstellt eine neue Note für ein Fach.",
    input_schema: {
      type: "object" as const,
      properties: {
        fach_id: { type: "string", description: "ID des Fachs (aus dem Kontext)" },
        punkte: { type: "number", description: "Punkte 0–15 (ganze Zahl)" },
        kategorie: {
          type: "string",
          enum: ["klausur", "muendlich", "test", "referat", "hausaufgabe", "sonstige"],
          description: "Art der Leistung",
        },
        bezeichnung: { type: "string", description: "Optionaler Titel, z.B. 'Klassenarbeit 2'" },
        gewicht: { type: "number", description: "Gewichtungsfaktor, Standard 1" },
      },
      required: ["fach_id", "punkte", "kategorie"],
    },
  },
  {
    name: "note_bearbeiten",
    description: "Ändert eine bestehende Note.",
    input_schema: {
      type: "object" as const,
      properties: {
        note_id: { type: "string", description: "ID der Note (aus dem Kontext)" },
        punkte: { type: "number", description: "Neue Punkte 0–15" },
        kategorie: { type: "string", enum: ["klausur", "muendlich", "test", "referat", "hausaufgabe", "sonstige"] },
        bezeichnung: { type: "string", description: "Neuer Titel" },
        gewicht: { type: "number", description: "Neuer Gewichtungsfaktor" },
      },
      required: ["note_id"],
    },
  },
  {
    name: "note_loeschen",
    description: "Löscht eine Note dauerhaft.",
    input_schema: {
      type: "object" as const,
      properties: {
        note_id: { type: "string", description: "ID der Note (aus dem Kontext)" },
      },
      required: ["note_id"],
    },
  },

  // ── Klausuren ──────────────────────────────────────────────────────
  {
    name: "klausur_erstellen",
    description: "Trägt eine neue Klausur ein.",
    input_schema: {
      type: "object" as const,
      properties: {
        titel: { type: "string", description: "Bezeichnung der Klausur, z.B. 'Mathe Klausur 2'" },
        datum: { type: "string", description: "Datum im Format YYYY-MM-DD" },
        fach_id: { type: "string", description: "Optional: ID des zugehörigen Fachs" },
      },
      required: ["titel", "datum"],
    },
  },
  {
    name: "klausur_bearbeiten",
    description: "Ändert Titel oder Datum einer bestehenden Klausur.",
    input_schema: {
      type: "object" as const,
      properties: {
        klausur_id: { type: "string", description: "ID der Klausur (aus dem Kontext)" },
        titel: { type: "string", description: "Neuer Titel" },
        datum: { type: "string", description: "Neues Datum YYYY-MM-DD" },
      },
      required: ["klausur_id"],
    },
  },
  {
    name: "klausur_loeschen",
    description: "Löscht eine Klausur dauerhaft.",
    input_schema: {
      type: "object" as const,
      properties: {
        klausur_id: { type: "string", description: "ID der Klausur (aus dem Kontext)" },
      },
      required: ["klausur_id"],
    },
  },

  // ── Hausaufgaben ───────────────────────────────────────────────────
  {
    name: "aufgabe_erstellen",
    description: "Erstellt eine neue Hausaufgabe.",
    input_schema: {
      type: "object" as const,
      properties: {
        beschreibung: { type: "string", description: "Text der Aufgabe" },
        faellig_am: { type: "string", description: "Fälligkeitsdatum YYYY-MM-DD" },
        fach_id: { type: "string", description: "Optional: ID des Fachs" },
      },
      required: ["beschreibung", "faellig_am"],
    },
  },
  {
    name: "aufgabe_erledigt",
    description: "Markiert eine Hausaufgabe als erledigt oder nicht erledigt.",
    input_schema: {
      type: "object" as const,
      properties: {
        aufgabe_id: { type: "string", description: "ID der Hausaufgabe (aus dem Kontext)" },
        erledigt: { type: "boolean", description: "true = erledigt, false = offen" },
      },
      required: ["aufgabe_id", "erledigt"],
    },
  },
  {
    name: "aufgabe_loeschen",
    description: "Löscht eine Hausaufgabe dauerhaft.",
    input_schema: {
      type: "object" as const,
      properties: {
        aufgabe_id: { type: "string", description: "ID der Hausaufgabe (aus dem Kontext)" },
      },
      required: ["aufgabe_id"],
    },
  },

  // ── Stundenplan ────────────────────────────────────────────────────
  {
    name: "stunde_erstellen",
    description: "Fügt eine Stunde zum Stundenplan hinzu.",
    input_schema: {
      type: "object" as const,
      properties: {
        wochentag: { type: "number", description: "1=Montag, 2=Dienstag, ..., 5=Freitag" },
        zeit_start: { type: "string", description: "Startzeit im Format HH:MM" },
        zeit_end: { type: "string", description: "Endzeit im Format HH:MM" },
        fach_id: { type: "string", description: "Optional: ID des Fachs" },
        raum: { type: "string", description: "Optional: Raumbezeichnung" },
        lehrer: { type: "string", description: "Optional: Name des Lehrers" },
      },
      required: ["wochentag", "zeit_start", "zeit_end"],
    },
  },
  {
    name: "stunde_bearbeiten",
    description: "Ändert eine bestehende Stunde im Stundenplan.",
    input_schema: {
      type: "object" as const,
      properties: {
        stunde_id: { type: "string", description: "ID der Stunde (aus dem Kontext)" },
        wochentag: { type: "number", description: "1=Mo … 5=Fr" },
        zeit_start: { type: "string", description: "Neue Startzeit HH:MM" },
        zeit_end: { type: "string", description: "Neue Endzeit HH:MM" },
        fach_id: { type: "string", description: "Neue Fach-ID" },
        raum: { type: "string", description: "Neuer Raum" },
        lehrer: { type: "string", description: "Neuer Lehrer" },
      },
      required: ["stunde_id"],
    },
  },
  {
    name: "stunde_loeschen",
    description: "Entfernt eine Stunde aus dem Stundenplan.",
    input_schema: {
      type: "object" as const,
      properties: {
        stunde_id: { type: "string", description: "ID der Stunde (aus dem Kontext)" },
      },
      required: ["stunde_id"],
    },
  },

  // ── Fächer ─────────────────────────────────────────────────────────
  {
    name: "fach_erstellen",
    description: "Erstellt ein neues Fach für das aktuelle Halbjahr.",
    input_schema: {
      type: "object" as const,
      properties: {
        name: { type: "string", description: "Fachname, z.B. 'Mathematik'" },
        niveau: { type: "string", enum: ["grund", "erhoeht"], description: "GK=grund, LK=erhoeht" },
        halbjahr: { type: "string", description: "Halbjahr, z.B. '11/1'" },
      },
      required: ["name", "niveau", "halbjahr"],
    },
  },
  {
    name: "fach_bearbeiten",
    description: "Ändert Name, Niveau oder Farbe eines Fachs.",
    input_schema: {
      type: "object" as const,
      properties: {
        fach_id: { type: "string", description: "ID des Fachs (aus dem Kontext)" },
        name: { type: "string", description: "Neuer Name" },
        niveau: { type: "string", enum: ["grund", "erhoeht"], description: "Neues Niveau" },
        farbe: { type: "string", description: "Hex-Farbe z.B. '#3b82f6'" },
      },
      required: ["fach_id"],
    },
  },
  {
    name: "fach_loeschen",
    description: "Löscht ein Fach und alle zugehörigen Noten dauerhaft.",
    input_schema: {
      type: "object" as const,
      properties: {
        fach_id: { type: "string", description: "ID des Fachs (aus dem Kontext)" },
      },
      required: ["fach_id"],
    },
  },
];
```

- [ ] **Schritt 2: TypeScript-Check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Erwartung: keine Fehler.

- [ ] **Schritt 3: Commit**

```bash
git add lib/coach/tools.ts
git commit -m "feat: 15 Anthropic Tool-Definitionen für Coach Agent"
```

---

## Task 3: Coach-Kontext (`lib/coach/context.ts`)

**Files:**
- Create: `lib/coach/context.ts`

Die Funktion `baueCoachKontext` lädt alle User-Daten, gibt einen fertig formatierten System-Prompt zurück **und** die Raw-Daten (für Snapshot-Lookup in der Route).

- [ ] **Schritt 1: `lib/coach/context.ts` erstellen**

```typescript
// lib/coach/context.ts
import { createClient } from "@/lib/supabase/server";
import { assembleFaecher, type FachRow, type NoteRow, type KlausurRow } from "@/lib/grades/db";
import { aktuellesHalbjahr } from "@/lib/grades/halbjahr";
import { gesamtSchnittGerundet } from "@/lib/grades/calc";
import type { HausaufgabeRow, StundeRow } from "@/lib/stundenplan/types";

export type CoachRawData = {
  userId: string;
  name: string;
  halbjahr: string;
  faecher: FachRow[];
  noten: NoteRow[];
  klausuren: KlausurRow[];
  hausaufgaben: HausaufgabeRow[];
  stunden: StundeRow[];
};

export type CoachKontext = {
  systemPrompt: string;
  raw: CoachRawData;
};

function wochentagName(n: number): string {
  return ["", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"][n] ?? String(n);
}

function tageBis(iso: string): number {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  const ziel = new Date(y, m - 1, d);
  const h = new Date();
  const heute = new Date(h.getFullYear(), h.getMonth(), h.getDate());
  return Math.round((ziel.getTime() - heute.getTime()) / 86400000);
}

export async function baueCoachKontext(): Promise<CoachKontext> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub ?? "";

  const { data: profil } = await supabase
    .from("nutzer_profil")
    .select("name, aktuelles_halbjahr")
    .eq("id", userId)
    .single();

  const name = profil?.name ?? "Schüler";
  const halbjahr = profil?.aktuelles_halbjahr ?? aktuellesHalbjahr();
  const heute = new Date().toISOString().slice(0, 10);

  const [
    { data: fachRows },
    { data: noteRows },
    { data: klausurRows },
    { data: haRows },
    { data: stundeRows },
  ] = await Promise.all([
    supabase.from("schule_fach").select("*").eq("halbjahr", halbjahr).order("created_at"),
    supabase.from("schule_note").select("*"),
    supabase.from("schule_klausur").select("*").gte("datum", heute).order("datum").limit(10),
    supabase.from("hausaufgabe").select("*").eq("erledigt", false).order("faellig_am").limit(20),
    supabase.from("stundenplan_stunde").select("*").order("wochentag").order("zeit_start"),
  ]);

  const faecher = assembleFaecher(
    (fachRows ?? []) as FachRow[],
    (noteRows ?? []) as NoteRow[],
  );
  const gesamt = gesamtSchnittGerundet(faecher);
  const fachMap = new Map(faecher.map((f) => [f.id, f.name]));

  // ── System-Prompt zusammenbauen ───────────────────────────────────

  const faecherStr = faecher.length
    ? faecher
        .map((f) => {
          const schnitt =
            f.noten.length
              ? (f.noten.reduce((s, n) => s + n.punkte, 0) / f.noten.length).toFixed(1)
              : "–";
          return `- [id:${f.id}] ${f.name} (${f.niveau === "erhoeht" ? "LK" : "GK"}) · Schnitt ${schnitt}`;
        })
        .join("\n")
    : "Keine Fächer";

  const notenStr = faecher.length
    ? faecher
        .map((f) => {
          if (!f.noten.length) return null;
          const letzte = [...f.noten]
            .sort((a, b) => (b.id ?? "").localeCompare(a.id ?? ""))
            .slice(0, 3)
            .map((n) => `[id:${n.id}] ${n.punkte}P ${n.kategorie}${n.bezeichnung ? ` (${n.bezeichnung})` : ""}`)
            .join(", ");
          return `${f.name}: ${letzte}`;
        })
        .filter(Boolean)
        .join("\n")
    : "Noch keine Noten";

  const klausurStr = (klausurRows ?? []).length
    ? (klausurRows as KlausurRow[])
        .map(
          (k) =>
            `- [id:${k.id}] ${k.titel}${k.fach_id && fachMap.get(k.fach_id) ? ` (${fachMap.get(k.fach_id)})` : ""} · ${k.datum.slice(0, 10)} · in ${tageBis(k.datum)} Tagen`,
        )
        .join("\n")
    : "Keine";

  const haStr = (haRows ?? []).length
    ? (haRows as HausaufgabeRow[])
        .map(
          (h) =>
            `- [id:${h.id}] ${h.beschreibung} · fällig ${h.faellig_am}${h.fach_id && fachMap.get(h.fach_id) ? ` · ${fachMap.get(h.fach_id)}` : ""}`,
        )
        .join("\n")
    : "Keine offenen";

  const stundenStr = (stundeRows ?? []).length
    ? (stundeRows as StundeRow[])
        .map(
          (s) =>
            `- [id:${s.id}] ${wochentagName(s.wochentag)} ${s.zeit_start.slice(0, 5)}–${s.zeit_end.slice(0, 5)}${s.fach_id && fachMap.get(s.fach_id) ? ` · ${fachMap.get(s.fach_id)}` : ""}${s.raum ? ` · Raum ${s.raum}` : ""}${s.lehrer ? ` · ${s.lehrer}` : ""}`,
        )
        .join("\n")
    : "Kein Stundenplan";

  const systemPrompt = `Du bist ein KI-Coach für ${name}, einen 17-jährigen Gymnasiasten (${halbjahr}).

WICHTIG — TOOL USE:
Du hast Tools um Daten zu lesen UND zu ändern. Nutze sie aktiv wenn der User etwas hinzufügen, ändern oder löschen will.
Frag nicht nach Bestätigung — erkenne aus dem Kontext die richtige Aktion und rufe sofort das Tool auf.
Wenn du ein Tool aufrufst, antworte NICHT zusätzlich mit Text. Der User sieht eine Vorschau-Karte und bestätigt selbst.
Erst nach Erhalt des tool_result gibst du eine kurze Rückmeldung auf Deutsch.

Für Fragen: antworte direkt und kurz, ohne Tool-Aufruf.
Ton: direkter Freund, kein Coach-Speak, keine Motivationsfloskeln. Deutsch, du-Form.
Kürze: 1–3 Sätze für Antworten. Nur bei Erklärungen (z.B. Mathe-Aufgabe) länger.

── AKTUELLER DATENSTAND (${heute}) ─────────────────
Gesamtschnitt: ${gesamt ?? "–"}/15

FÄCHER (Halbjahr ${halbjahr}):
${faecherStr}

NOTEN (letzte 3 pro Fach, mit IDs):
${notenStr}

KLAUSUREN (nächste 10):
${klausurStr}

HAUSAUFGABEN (offen):
${haStr}

STUNDENPLAN:
${stundenStr}
────────────────────────────────────────────────────
IDs in eckigen Klammern [id:...] sind Datenbankschlüssel — nutze sie direkt in Tool-Aufrufen.`;

  return {
    systemPrompt,
    raw: {
      userId,
      name,
      halbjahr,
      faecher: (fachRows ?? []) as FachRow[],
      noten: (noteRows ?? []) as NoteRow[],
      klausuren: (klausurRows ?? []) as KlausurRow[],
      hausaufgaben: (haRows ?? []) as HausaufgabeRow[],
      stunden: (stundeRows ?? []) as StundeRow[],
    },
  };
}
```

- [ ] **Schritt 2: TypeScript-Check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Erwartung: keine Fehler.

- [ ] **Schritt 3: Commit**

```bash
git add lib/coach/context.ts
git commit -m "feat: baueCoachKontext() — System-Prompt mit IDs + Raw-Daten für Snapshot"
```

---

## Task 4: API Route umschreiben (`app/api/coach/route.ts`)

**Files:**
- Rewrite: `app/api/coach/route.ts`

Die Route nimmt `ClientMessage[]` entgegen, konvertiert sie ins Anthropic-Format, ruft Claude auf und gibt JSON zurück.

- [ ] **Schritt 1: `app/api/coach/route.ts` komplett ersetzen**

```typescript
// app/api/coach/route.ts
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { COACH_TOOLS, type ToolName } from "@/lib/coach/tools";
import { baueCoachKontext } from "@/lib/coach/context";
import type { KlausurRow, NoteRow } from "@/lib/grades/db";
import type { HausaufgabeRow, StundeRow } from "@/lib/stundenplan/types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Typen ──────────────────────────────────────────────────────────────

export type ClientMessage =
  | { role: "user"; content: string }
  | { role: "assistant"; content: string }
  | { role: "tool_call"; tool_use_id: string; name: string; input: Record<string, unknown> }
  | { role: "tool_result"; tool_use_id: string; output: string };

export type CoachApiResponse =
  | { type: "text"; content: string }
  | {
      type: "tool_call";
      name: ToolName;
      input: Record<string, unknown>;
      tool_use_id: string;
      preview: string;
      snapshot: Record<string, unknown> | null;
    };

// ── Client-Messages → Anthropic-Format ────────────────────────────────

function toAnthropicMessages(messages: ClientMessage[]): Anthropic.MessageParam[] {
  return messages.map((m) => {
    if (m.role === "user") return { role: "user" as const, content: m.content };
    if (m.role === "assistant") return { role: "assistant" as const, content: m.content };
    if (m.role === "tool_call") {
      return {
        role: "assistant" as const,
        content: [{ type: "tool_use" as const, id: m.tool_use_id, name: m.name, input: m.input }],
      };
    }
    // tool_result
    return {
      role: "user" as const,
      content: [{ type: "tool_result" as const, tool_use_id: m.tool_use_id, content: m.output }],
    };
  });
}

// ── Menschenlesbarer Preview für jedes Tool ────────────────────────────

function buildPreview(
  name: ToolName,
  input: Record<string, unknown>,
  fachName: (id: string) => string,
): string {
  const fach = input.fach_id ? ` (${fachName(input.fach_id as string)})` : "";
  switch (name) {
    case "note_erstellen":
      return `Note eintragen${fach}: ${input.punkte} Punkte · ${input.kategorie}${input.bezeichnung ? ` · "${input.bezeichnung}"` : ""}`;
    case "note_bearbeiten":
      return `Note bearbeiten: ${[input.punkte && `${input.punkte}P`, input.kategorie, input.bezeichnung && `"${input.bezeichnung}"`].filter(Boolean).join(" · ")}`;
    case "note_loeschen":
      return `Note löschen (nicht rückgängig machbar)`;
    case "klausur_erstellen":
      return `Klausur eintragen: "${input.titel}"${fach} am ${input.datum}`;
    case "klausur_bearbeiten":
      return `Klausur bearbeiten: ${[input.titel && `"${input.titel}"`, input.datum].filter(Boolean).join(" · ")}`;
    case "klausur_loeschen":
      return `Klausur löschen (nicht rückgängig machbar)`;
    case "aufgabe_erstellen":
      return `Hausaufgabe eintragen: "${input.beschreibung}"${fach} · fällig ${input.faellig_am}`;
    case "aufgabe_erledigt":
      return `Hausaufgabe als ${input.erledigt ? "erledigt" : "offen"} markieren`;
    case "aufgabe_loeschen":
      return `Hausaufgabe löschen (nicht rückgängig machbar)`;
    case "stunde_erstellen":
      return `Stunde eintragen: ${["Mo","Di","Mi","Do","Fr","Sa","So"][(input.wochentag as number) - 1]} ${input.zeit_start}–${input.zeit_end}${fach}`;
    case "stunde_bearbeiten":
      return `Stunde bearbeiten`;
    case "stunde_loeschen":
      return `Stunde löschen (nicht rückgängig machbar)`;
    case "fach_erstellen":
      return `Fach anlegen: "${input.name}" · ${input.niveau === "erhoeht" ? "LK" : "GK"}`;
    case "fach_bearbeiten":
      return `Fach bearbeiten`;
    case "fach_loeschen":
      return `Fach löschen — alle Noten dieses Fachs werden ebenfalls gelöscht`;
    default:
      return String(name);
  }
}

// ── Snapshot für Undo ──────────────────────────────────────────────────

function findSnapshot(
  name: ToolName,
  input: Record<string, unknown>,
  raw: {
    noten: NoteRow[];
    klausuren: KlausurRow[];
    hausaufgaben: HausaufgabeRow[];
    stunden: StundeRow[];
    faecher: Array<{ id: string; name: string; niveau: string; farbe: string | null }>;
  },
): Record<string, unknown> | null {
  switch (name) {
    case "note_bearbeiten":
    case "note_loeschen":
      return raw.noten.find((n) => n.id === input.note_id) ?? null;
    case "klausur_bearbeiten":
    case "klausur_loeschen":
      return raw.klausuren.find((k) => k.id === input.klausur_id) ?? null;
    case "aufgabe_erledigt":
    case "aufgabe_loeschen":
      return raw.hausaufgaben.find((h) => h.id === input.aufgabe_id) ?? null;
    case "stunde_bearbeiten":
    case "stunde_loeschen":
      return raw.stunden.find((s) => s.id === input.stunde_id) ?? null;
    case "fach_bearbeiten":
    case "fach_loeschen":
      return raw.faecher.find((f) => f.id === input.fach_id) ?? null;
    default:
      return null;
  }
}

// ── Route Handler ──────────────────────────────────────────────────────

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims?.sub) {
    return Response.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const body = await req.json() as { messages: ClientMessage[] };
  if (!body.messages?.length) {
    return Response.json({ error: "Keine Nachrichten" }, { status: 400 });
  }

  const kontext = await baueCoachKontext();
  const fachMap = new Map(kontext.raw.faecher.map((f) => [f.id, f.name]));
  const fachName = (id: string) => fachMap.get(id) ?? id;

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: kontext.systemPrompt,
    tools: COACH_TOOLS,
    messages: toAnthropicMessages(body.messages),
  });

  // Tool Call zurückgeben
  const toolBlock = response.content.find((b) => b.type === "tool_use");
  if (toolBlock && toolBlock.type === "tool_use") {
    const name = toolBlock.name as ToolName;
    const input = toolBlock.input as Record<string, unknown>;
    const result: CoachApiResponse = {
      type: "tool_call",
      name,
      input,
      tool_use_id: toolBlock.id,
      preview: buildPreview(name, input, fachName),
      snapshot: findSnapshot(name, input, kontext.raw),
    };
    return Response.json(result);
  }

  // Text-Antwort zurückgeben
  const textBlock = response.content.find((b) => b.type === "text");
  const content = textBlock && textBlock.type === "text" ? textBlock.text : "–";
  const result: CoachApiResponse = { type: "text", content };
  return Response.json(result);
}
```

- [ ] **Schritt 2: TypeScript-Check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Erwartung: keine Fehler. Falls `FachRow` nicht `name/niveau/farbe` als Felder hat — den Typ im `findSnapshot`-Argument auf `FachRow` upgraden.

Falls TypeScript-Fehler bei `kontext.raw.faecher` (weil `FachRow` andere Felder hat): `faecher: FachRow[]` im `findSnapshot`-Aufruf verwenden und die Typ-Assertion entsprechend anpassen.

- [ ] **Schritt 3: Commit**

```bash
git add app/api/coach/route.ts
git commit -m "feat: Coach API Route — Tool Use, non-streaming, Snapshot für Undo"
```

---

## Task 5: Coach-Chat UI umschreiben (`components/dashboard/coach-chat.tsx`)

**Files:**
- Rewrite: `components/dashboard/coach-chat.tsx`

Das ist der größte Task. Die Komponente bekommt neue Message-Typen, Bestätigungs-Karte, Undo-Stack und Execution-Switch.

- [ ] **Schritt 1: `components/dashboard/coach-chat.tsx` komplett ersetzen**

```typescript
"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, Check, X, RotateCcw } from "lucide-react";
import {
  addNote, updateNote, removeNote,
  addFach, updateFach, removeFach,
  addKlausur, updateKlausur, removeKlausur,
} from "@/lib/actions/schule";
import {
  addHausaufgabe, updateHausaufgabe, removeHausaufgabe, toggleErledigt,
} from "@/lib/actions/hausaufgaben";
import {
  addStunde, updateStunde, removeStunde,
} from "@/lib/actions/stundenplan";
import type { ClientMessage, CoachApiResponse } from "@/app/api/coach/route";
import type { Kategorie } from "@/lib/grades/types";

// ── Typen ──────────────────────────────────────────────────────────────

type UndoEntry = {
  id: string;
  description: string;
  undo: () => Promise<void>;
};

type UiMsg =
  | { kind: "text"; role: "user" | "assistant"; content: string }
  | { kind: "pending"; tool_use_id: string; preview: string; name: string; input: Record<string, unknown>; snapshot: Record<string, unknown> | null }
  | { kind: "result"; success: boolean; summary: string }
  | { kind: "loading" };

const STARTER = "Was steht heute an — wie kann ich helfen?";

// ── Execution Switch ───────────────────────────────────────────────────

async function executeTool(
  name: string,
  input: Record<string, unknown>,
  snapshot: Record<string, unknown> | null,
): Promise<{ ok: boolean; summary: string; undoFn: (() => Promise<void>) | null }> {
  try {
    switch (name) {
      // ── Noten ──
      case "note_erstellen": {
        const r = await addNote(
          input.fach_id as string,
          input.punkte as number,
          input.kategorie as Kategorie,
          input.bezeichnung as string | undefined,
          input.gewicht as number | undefined,
        );
        if (!r.ok) return { ok: false, summary: r.error, undoFn: null };
        const newId = r.id;
        return {
          ok: true,
          summary: `Note eingetragen (${input.punkte}P ${input.kategorie}).`,
          undoFn: async () => { await removeNote(newId); },
        };
      }
      case "note_bearbeiten": {
        if (!snapshot) return { ok: false, summary: "Note nicht gefunden.", undoFn: null };
        const prev = snapshot as { punkte: number; kategorie: Kategorie; bezeichnung: string | null; gewicht: number };
        const r = await updateNote(
          input.note_id as string,
          (input.punkte as number) ?? prev.punkte,
          (input.kategorie as Kategorie) ?? prev.kategorie,
          (input.bezeichnung as string | undefined) ?? prev.bezeichnung ?? undefined,
          (input.gewicht as number | undefined) ?? prev.gewicht,
        );
        if (!r.ok) return { ok: false, summary: r.error, undoFn: null };
        return {
          ok: true,
          summary: "Note aktualisiert.",
          undoFn: async () => {
            await updateNote(input.note_id as string, prev.punkte, prev.kategorie, prev.bezeichnung ?? undefined, prev.gewicht);
          },
        };
      }
      case "note_loeschen": {
        const r = await removeNote(input.note_id as string);
        if (!r.ok) return { ok: false, summary: r.error, undoFn: null };
        return { ok: true, summary: "Note gelöscht.", undoFn: null };
      }

      // ── Klausuren ──
      case "klausur_erstellen": {
        const r = await addKlausur(
          input.titel as string,
          input.datum as string,
          input.fach_id as string | undefined,
        );
        if (!r.ok) return { ok: false, summary: r.error, undoFn: null };
        return {
          ok: true,
          summary: `Klausur "${input.titel}" am ${input.datum} eingetragen.`,
          undoFn: null,
        };
      }
      case "klausur_bearbeiten": {
        if (!snapshot) return { ok: false, summary: "Klausur nicht gefunden.", undoFn: null };
        const prev = snapshot as { titel: string; datum: string };
        const r = await updateKlausur(input.klausur_id as string, {
          titel: input.titel as string | undefined,
          datum: input.datum as string | undefined,
        });
        if (!r.ok) return { ok: false, summary: r.error, undoFn: null };
        return {
          ok: true,
          summary: "Klausur aktualisiert.",
          undoFn: async () => {
            await updateKlausur(input.klausur_id as string, { titel: prev.titel, datum: prev.datum });
          },
        };
      }
      case "klausur_loeschen": {
        const r = await removeKlausur(input.klausur_id as string);
        if (!r.ok) return { ok: false, summary: r.error, undoFn: null };
        return { ok: true, summary: "Klausur gelöscht.", undoFn: null };
      }

      // ── Hausaufgaben ──
      case "aufgabe_erstellen": {
        const r = await addHausaufgabe({
          fachId: (input.fach_id as string | undefined) ?? null,
          beschreibung: input.beschreibung as string,
          faelligAm: input.faellig_am as string,
        });
        if (!r.ok) return { ok: false, summary: r.error, undoFn: null };
        return {
          ok: true,
          summary: `Hausaufgabe "${input.beschreibung}" eingetragen.`,
          undoFn: null,
        };
      }
      case "aufgabe_erledigt": {
        const prev = snapshot as { erledigt: boolean } | null;
        const r = await toggleErledigt(input.aufgabe_id as string, input.erledigt as boolean);
        if (!r.ok) return { ok: false, summary: r.error, undoFn: null };
        return {
          ok: true,
          summary: `Hausaufgabe als ${input.erledigt ? "erledigt" : "offen"} markiert.`,
          undoFn: prev
            ? async () => { await toggleErledigt(input.aufgabe_id as string, prev.erledigt); }
            : null,
        };
      }
      case "aufgabe_loeschen": {
        const r = await removeHausaufgabe(input.aufgabe_id as string);
        if (!r.ok) return { ok: false, summary: r.error, undoFn: null };
        return { ok: true, summary: "Hausaufgabe gelöscht.", undoFn: null };
      }

      // ── Stundenplan ──
      case "stunde_erstellen": {
        const r = await addStunde({
          fachId: (input.fach_id as string | undefined) ?? null,
          wochentag: input.wochentag as number,
          zeitStart: input.zeit_start as string,
          zeitEnd: input.zeit_end as string,
          raum: (input.raum as string | undefined) ?? null,
          lehrer: (input.lehrer as string | undefined) ?? null,
          wocheTyp: null,
        });
        if (!r.ok) return { ok: false, summary: r.error, undoFn: null };
        return { ok: true, summary: "Stunde eingetragen.", undoFn: null };
      }
      case "stunde_bearbeiten": {
        if (!snapshot) return { ok: false, summary: "Stunde nicht gefunden.", undoFn: null };
        const prev = snapshot as { wochentag: number; zeit_start: string; zeit_end: string; fach_id: string | null; raum: string | null; lehrer: string | null; woche_typ: "A" | "B" | null };
        const r = await updateStunde(input.stunde_id as string, {
          fachId: (input.fach_id as string | undefined) ?? prev.fach_id,
          wochentag: (input.wochentag as number | undefined) ?? prev.wochentag,
          zeitStart: (input.zeit_start as string | undefined) ?? prev.zeit_start.slice(0, 5),
          zeitEnd: (input.zeit_end as string | undefined) ?? prev.zeit_end.slice(0, 5),
          raum: (input.raum as string | undefined) ?? prev.raum,
          lehrer: (input.lehrer as string | undefined) ?? prev.lehrer,
          wocheTyp: prev.woche_typ,
        });
        if (!r.ok) return { ok: false, summary: r.error, undoFn: null };
        return {
          ok: true,
          summary: "Stunde aktualisiert.",
          undoFn: async () => {
            await updateStunde(input.stunde_id as string, {
              fachId: prev.fach_id,
              wochentag: prev.wochentag,
              zeitStart: prev.zeit_start.slice(0, 5),
              zeitEnd: prev.zeit_end.slice(0, 5),
              raum: prev.raum,
              lehrer: prev.lehrer,
              wocheTyp: prev.woche_typ,
            });
          },
        };
      }
      case "stunde_loeschen": {
        const r = await removeStunde(input.stunde_id as string);
        if (!r.ok) return { ok: false, summary: r.error, undoFn: null };
        return { ok: true, summary: "Stunde gelöscht.", undoFn: null };
      }

      // ── Fächer ──
      case "fach_erstellen": {
        const r = await addFach(
          input.name as string,
          input.halbjahr as string,
          (input.niveau as "grund" | "erhoeht") ?? "grund",
        );
        if (!r.ok) return { ok: false, summary: r.error, undoFn: null };
        const newId = r.id;
        return {
          ok: true,
          summary: `Fach "${input.name}" angelegt.`,
          undoFn: async () => { await removeFach(newId); },
        };
      }
      case "fach_bearbeiten": {
        const r = await updateFach(input.fach_id as string, {
          name: input.name as string | undefined,
          niveau: input.niveau as string | undefined,
          farbe: input.farbe as string | undefined,
        });
        if (!r.ok) return { ok: false, summary: r.error, undoFn: null };
        return { ok: true, summary: "Fach aktualisiert.", undoFn: null };
      }
      case "fach_loeschen": {
        const r = await removeFach(input.fach_id as string);
        if (!r.ok) return { ok: false, summary: r.error, undoFn: null };
        return { ok: true, summary: "Fach gelöscht.", undoFn: null };
      }

      default:
        return { ok: false, summary: "Unbekanntes Tool.", undoFn: null };
    }
  } catch (e) {
    return { ok: false, summary: e instanceof Error ? e.message : "Fehler.", undoFn: null };
  }
}

// ── Hauptkomponente ────────────────────────────────────────────────────

export function CoachChat() {
  const [uiMessages, setUiMessages] = useState<UiMsg[]>([
    { kind: "text", role: "assistant", content: STARTER },
  ]);
  const [apiMessages, setApiMessages] = useState<ClientMessage[]>([]);
  const [undoStack, setUndoStack] = useState<UndoEntry[]>([]);
  const [lastUndoVisible, setLastUndoVisible] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [uiMessages]);

  // ── Undo ausführen ──────────────────────────────────────────────────

  async function handleUndo() {
    if (!undoStack.length) return;
    const entry = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setLastUndoVisible(false);
    await entry.undo();
    setUiMessages((prev) => [
      ...prev,
      { kind: "result", success: true, summary: `Rückgängig: ${entry.description}` },
    ]);
  }

  // ── Nachricht senden ────────────────────────────────────────────────

  async function send(overrideInput?: string) {
    const text = (overrideInput ?? input).trim();
    if (!text || loading) return;

    // Undo-Keyword abfangen
    if (/^r[üu]ckg[äa]ngig$/i.test(text)) {
      setInput("");
      if (undoStack.length) {
        await handleUndo();
      } else {
        setUiMessages((prev) => [
          ...prev,
          { kind: "text", role: "user", content: text },
          { kind: "text", role: "assistant", content: "Nichts zum Rückgängigmachen vorhanden." },
        ]);
      }
      return;
    }

    const userMsg: ClientMessage = { role: "user", content: text };
    const nextApiMessages = [...apiMessages, userMsg];

    setUiMessages((prev) => [...prev, { kind: "text", role: "user", content: text }, { kind: "loading" }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextApiMessages }),
      });

      const data: CoachApiResponse = await res.json();
      setLoading(false);
      setUiMessages((prev) => prev.filter((m) => m.kind !== "loading"));

      if (data.type === "text") {
        setApiMessages([...nextApiMessages, { role: "assistant", content: data.content }]);
        setUiMessages((prev) => [...prev, { kind: "text", role: "assistant", content: data.content }]);
      } else {
        // Tool Call → Bestätigungs-Karte zeigen
        setApiMessages([
          ...nextApiMessages,
          { role: "tool_call", tool_use_id: data.tool_use_id, name: data.name, input: data.input },
        ]);
        setUiMessages((prev) => [
          ...prev,
          {
            kind: "pending",
            tool_use_id: data.tool_use_id,
            preview: data.preview,
            name: data.name,
            input: data.input,
            snapshot: data.snapshot,
          },
        ]);
      }
    } catch {
      setLoading(false);
      setUiMessages((prev) => [
        ...prev.filter((m) => m.kind !== "loading"),
        { kind: "text", role: "assistant", content: "Fehler — bitte nochmal versuchen." },
      ]);
    } finally {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  // ── Tool-Call bestätigen ────────────────────────────────────────────

  async function confirmTool(msg: UiMsg & { kind: "pending" }) {
    setUiMessages((prev) => prev.map((m) => (m === msg ? { kind: "loading" as const } : m)));
    setLoading(true);

    const exec = await executeTool(msg.name, msg.input, msg.snapshot);

    const toolResultMsg: ClientMessage = {
      role: "tool_result",
      tool_use_id: msg.tool_use_id,
      output: exec.ok ? `Erfolg: ${exec.summary}` : `Fehler: ${exec.summary}`,
    };
    const nextApiMessages = [...apiMessages, toolResultMsg];
    setApiMessages(nextApiMessages);

    if (exec.ok && exec.undoFn) {
      const entry: UndoEntry = {
        id: crypto.randomUUID(),
        description: exec.summary,
        undo: exec.undoFn,
      };
      setUndoStack((prev) => [...prev.slice(-4), entry]);
      setLastUndoVisible(true);
      setTimeout(() => setLastUndoVisible(false), 5000);
    }

    // Claude nach tool_result befragen
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextApiMessages }),
      });
      const data: CoachApiResponse = await res.json();
      setLoading(false);
      setUiMessages((prev) => prev.filter((m) => m.kind !== "loading"));

      if (data.type === "text") {
        setApiMessages((prev) => [...prev, { role: "assistant", content: data.content }]);
        setUiMessages((prev) => [...prev, { kind: "text", role: "assistant", content: data.content }]);
      }
    } catch {
      setLoading(false);
      setUiMessages((prev) => [
        ...prev.filter((m) => m.kind !== "loading"),
        { kind: "result", success: exec.ok, summary: exec.summary },
      ]);
    }
  }

  // ── Tool-Call abbrechen ─────────────────────────────────────────────

  async function cancelTool(msg: UiMsg & { kind: "pending" }) {
    const toolResultMsg: ClientMessage = {
      role: "tool_result",
      tool_use_id: msg.tool_use_id,
      output: "Abgebrochen — der User hat die Aktion nicht bestätigt.",
    };
    const nextApiMessages = [...apiMessages, toolResultMsg];
    setApiMessages(nextApiMessages);
    setUiMessages((prev) =>
      prev.map((m) =>
        m === msg ? { kind: "result" as const, success: false, summary: "Abgebrochen." } : m,
      ),
    );

    setLoading(true);
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextApiMessages }),
      });
      const data: CoachApiResponse = await res.json();
      if (data.type === "text") {
        setApiMessages((prev) => [...prev, { role: "assistant", content: data.content }]);
        setUiMessages((prev) => [...prev, { kind: "text", role: "assistant", content: data.content }]);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <section
      className="animate-fade-up rounded-[28px] border border-border"
      style={{ background: "var(--card-grad)", animationDelay: "0.08s" }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-5 py-3 sm:px-6">
        <Bot className="size-4 text-brand" />
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-brand">
          KI-Coach
        </span>
        <span className="ml-auto font-mono text-[9px] text-text-mute">Haiku 4.5</span>
      </div>

      {/* Nachrichten */}
      <div className="max-h-80 overflow-y-auto px-5 py-4 sm:px-6">
        <div className="space-y-3">
          {uiMessages.map((m, i) => {
            if (m.kind === "loading") {
              return (
                <div key={i} className="flex justify-start">
                  <div
                    className="rounded-2xl rounded-bl-sm px-4 py-2.5 text-text-mute"
                    style={{ background: "var(--surface-2)" }}
                  >
                    <Loader2 className="size-3 animate-spin" />
                  </div>
                </div>
              );
            }

            if (m.kind === "text") {
              return (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 font-sans text-sm leading-relaxed ${
                      m.role === "user"
                        ? "rounded-br-sm font-medium text-black"
                        : "rounded-bl-sm text-foreground"
                    }`}
                    style={
                      m.role === "user"
                        ? { background: "linear-gradient(135deg, var(--brand), var(--brand-2))" }
                        : { background: "var(--surface-2)" }
                    }
                  >
                    {m.content}
                  </div>
                </div>
              );
            }

            if (m.kind === "pending") {
              return (
                <div key={i} className="flex justify-start">
                  <div
                    className="w-full max-w-[90%] rounded-2xl rounded-bl-sm border px-4 py-3"
                    style={{
                      background: "var(--surface-2)",
                      borderColor: "color-mix(in srgb, var(--brand) 30%, var(--border))",
                    }}
                  >
                    <p className="mb-3 font-sans text-sm text-foreground">{m.preview}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => void confirmTool(m)}
                        className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-mono text-[11px] font-semibold text-black transition-opacity hover:opacity-90"
                        style={{ background: "linear-gradient(135deg, var(--brand), var(--brand-2))" }}
                      >
                        <Check className="size-3" />
                        Bestätigen
                      </button>
                      <button
                        onClick={() => void cancelTool(m)}
                        className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 font-mono text-[11px] font-semibold text-text-mute transition-colors hover:text-foreground"
                        style={{ background: "var(--surface-1)" }}
                      >
                        <X className="size-3" />
                        Abbrechen
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            if (m.kind === "result") {
              return (
                <div key={i} className="flex justify-start">
                  <div
                    className="flex items-center gap-2 rounded-2xl rounded-bl-sm px-4 py-2.5 font-mono text-xs"
                    style={{
                      background: m.success
                        ? "color-mix(in srgb, var(--success) 15%, var(--surface-2))"
                        : "color-mix(in srgb, var(--error, #ef4444) 15%, var(--surface-2))",
                      color: m.success ? "var(--success)" : "var(--error, #ef4444)",
                    }}
                  >
                    {m.success ? <Check className="size-3" /> : <X className="size-3" />}
                    {m.summary}
                  </div>
                </div>
              );
            }

            return null;
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Eingabe + Undo */}
      <div className="border-t border-border px-4 py-3 sm:px-5">
        {lastUndoVisible && undoStack.length > 0 && (
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-[10px] text-text-mute">
              {undoStack[undoStack.length - 1].description}
            </span>
            <button
              onClick={() => void handleUndo()}
              className="flex items-center gap-1 font-mono text-[10px] font-semibold text-brand transition-opacity hover:opacity-70"
            >
              <RotateCcw className="size-3" />
              Rückgängig
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Frag mich was oder gib einen Befehl…"
            rows={1}
            disabled={loading}
            className="flex-1 resize-none rounded-xl border border-border bg-surface-2 px-3 py-2 font-sans text-sm text-foreground placeholder:text-text-mute focus:outline-none focus:ring-1 focus:ring-brand disabled:opacity-50"
            style={{ maxHeight: "96px", overflowY: "auto" }}
          />
          <button
            onClick={() => void send()}
            disabled={!input.trim() || loading}
            className="flex size-9 flex-shrink-0 items-center justify-center rounded-xl transition-all disabled:opacity-40"
            style={{
              background: "linear-gradient(135deg, var(--brand), var(--brand-2))",
              boxShadow: input.trim() ? "0 4px 14px color-mix(in srgb, var(--brand) 40%, transparent)" : "none",
            }}
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin text-black" />
            ) : (
              <Send className="size-4 text-black" />
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Schritt 2: TypeScript-Check**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Erwartung: keine Fehler. Häufige Fehlerquelle: Import von `updateKlausur` aus schule.ts — sicherstellen dass der Export existiert (Task 1 muss fertig sein).

- [ ] **Schritt 3: Build-Check**

```bash
npm run build 2>&1 | tail -20
```

Erwartung: Build erfolgreich ohne Fehler.

- [ ] **Schritt 4: Manuelle Tests**

Alle folgenden Szenarien im Browser testen (Dashboard → KI-Coach):

1. **Frage:** "Wie ist mein Gesamtschnitt?" → Antwort als Text, keine Bestätigungs-Karte
2. **Erstellen:** "Füg eine Mathe-Klausur am 25. Juni hinzu" → Bestätigungs-Karte erscheint → Bestätigen → Ergebnis-Bubble → Dashboard zeigt neue Klausur
3. **Rückgängig-Button:** Erscheint 5 Sekunden nach erfolgreicher Aktion → klicken → Klausur verschwindet wieder
4. **Rückgängig per Text:** "Füg Deutsch-Note 12 Punkte hinzu" → bestätigen → "rückgängig" tippen → Note verschwindet
5. **Abbrechen:** Befehl geben → Bestätigungs-Karte → Abbrechen → Karte zeigt "Abgebrochen."
6. **Stundenplan:** "Trag Mathe Mo 8-9:30 ein" → Bestätigen → Stundenplan-Seite zeigt neue Stunde
7. **Hausaufgabe erledigt:** "Markier meine Deutsch-Hausaufgabe als erledigt" → Bestätigen → Aufgaben-Seite aktualisiert

- [ ] **Schritt 5: Commit**

```bash
git add components/dashboard/coach-chat.tsx
git commit -m "feat: KI-Coach Agent — Tool Use, Bestätigungs-Karte, Undo-Stack"
```

---

## Abschluss

- [ ] **Finaler Build + TypeScript-Check**

```bash
npx tsc --noEmit && npm run build 2>&1 | tail -10
```

Erwartung: 0 TypeScript-Fehler, Build erfolgreich.

- [ ] **Finaler Commit (falls uncommitted changes)**

```bash
git status
git add -A
git commit -m "feat: Coach Agent vollständig — Tool Use, Bestätigung, Undo für alle 5 Bereiche"
```
