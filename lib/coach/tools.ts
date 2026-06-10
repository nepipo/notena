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
