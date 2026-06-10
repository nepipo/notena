import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { COACH_TOOLS, type ToolName } from "@/lib/coach/tools";
import { baueCoachKontext } from "@/lib/coach/context";
import type { KlausurRow, NoteRow } from "@/lib/grades/db";
import type { FachRow } from "@/lib/grades/db";
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
      return `Stunde eintragen: ${["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"][(input.wochentag as number) - 1]} ${input.zeit_start}–${input.zeit_end}${fach}`;
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
    faecher: FachRow[];
  },
): Record<string, unknown> | null {
  switch (name) {
    case "note_bearbeiten":
    case "note_loeschen":
      return (raw.noten.find((n) => n.id === input.note_id) as unknown as Record<string, unknown>) ?? null;
    case "klausur_bearbeiten":
    case "klausur_loeschen":
      return (raw.klausuren.find((k) => k.id === input.klausur_id) as unknown as Record<string, unknown>) ?? null;
    case "aufgabe_erledigt":
    case "aufgabe_loeschen":
      return (raw.hausaufgaben.find((h) => h.id === input.aufgabe_id) as unknown as Record<string, unknown>) ?? null;
    case "stunde_bearbeiten":
    case "stunde_loeschen":
      return (raw.stunden.find((s) => s.id === input.stunde_id) as unknown as Record<string, unknown>) ?? null;
    case "fach_bearbeiten":
    case "fach_loeschen":
      return (raw.faecher.find((f) => f.id === input.fach_id) as unknown as Record<string, unknown>) ?? null;
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

  const textBlock = response.content.find((b) => b.type === "text");
  const content = textBlock && textBlock.type === "text" ? textBlock.text : "–";
  const result: CoachApiResponse = { type: "text", content };
  return Response.json(result);
}
