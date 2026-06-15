import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { COACH_TOOLS, type ToolName } from "@/lib/coach/tools";
import { baueCoachKontext } from "@/lib/coach/context";
import { checkRateLimit } from "@/lib/coach/rate-limiter";
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

// ── Limits ─────────────────────────────────────────────────────────────
const MAX_BODY_BYTES = 50_000;   // 50 KB — verhindert Payload-Flooding
const MAX_MESSAGES   = 40;       // max. Verlauf — begrenzt Token-Kosten pro Request
const MAX_MSG_LENGTH = 2_000;    // max. Zeichen pro Nachricht

// ── Route Handler ──────────────────────────────────────────────────────

export async function POST(req: Request) {
  // Body-Size-Check vor dem Parsen
  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
    return Response.json({ error: "Anfrage zu groß" }, { status: 413 });
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims?.sub) {
    return Response.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const rateLimit = await checkRateLimit(supabase);
  if (!rateLimit.allowed) {
    const resetIn = Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 60_000);
    return Response.json(
      {
        error: `Du hast das Limit von 20 Nachrichten pro Stunde erreicht. In etwa ${resetIn} Minute${resetIn === 1 ? "" : "n"} kannst du wieder schreiben.`,
        resetAt: rateLimit.resetAt.toISOString(),
      },
      { status: 429 },
    );
  }

  let body: { messages: ClientMessage[] };
  try {
    body = await req.json() as { messages: ClientMessage[] };
  } catch {
    return Response.json({ error: "Ungültiges JSON" }, { status: 400 });
  }
  if (!body.messages?.length) {
    return Response.json({ error: "Keine Nachrichten" }, { status: 400 });
  }

  // Verlauf kappen — nur die letzten MAX_MESSAGES behalten
  if (body.messages.length > MAX_MESSAGES) {
    body.messages = body.messages.slice(-MAX_MESSAGES);
  }

  // Einzelne Nachrichten auf MAX_MSG_LENGTH kürzen
  body.messages = body.messages.map((m) => {
    if (m.role === "user" && typeof m.content === "string" && m.content.length > MAX_MSG_LENGTH) {
      return { ...m, content: m.content.slice(0, MAX_MSG_LENGTH) };
    }
    return m;
  });

  const kontext = await baueCoachKontext();
  const fachMap = new Map(kontext.raw.faecher.map((f) => [f.id, f.name]));
  const fachName = (id: string) => fachMap.get(id) ?? id;

  // Prompt Caching: system-prompt + tools werden bei Anthropic serverseitig gecacht.
  // Cache-Write (erste Msg der Session): 25% des Input-Preises für diese Tokens.
  // Cache-Read (alle weiteren Msgs): 10% — spart ~47% der Coach-Kosten pro Session.
  const cachedTools = COACH_TOOLS.map((tool, i) =>
    i === COACH_TOOLS.length - 1
      ? { ...tool, cache_control: { type: "ephemeral" as const } }
      : tool
  );

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: [
        {
          type: "text",
          text: kontext.systemPrompt,
          cache_control: { type: "ephemeral" },
        },
      ],
      tools: cachedTools,
      tool_choice: { type: "any" },
      messages: toAnthropicMessages(body.messages),
    });

    const toolBlock = response.content.find((b) => b.type === "tool_use");
    if (!toolBlock || toolBlock.type !== "tool_use") {
      return Response.json({ type: "text", content: "–" } satisfies CoachApiResponse);
    }

    const name = toolBlock.name as ToolName;
    const input = toolBlock.input as Record<string, unknown>;

    // respond_to_user = kein Mutations-Tool, direkt als Text zurückgeben
    if (name === "respond_to_user") {
      const result: CoachApiResponse = { type: "text", content: (input.text as string) ?? "–" };
      return Response.json(result);
    }

    const result: CoachApiResponse = {
      type: "tool_call",
      name,
      input,
      tool_use_id: toolBlock.id,
      preview: buildPreview(name, input, fachName),
      snapshot: findSnapshot(name, input, kontext.raw),
    };
    return Response.json(result);
  } catch {
    return Response.json({ error: "KI nicht erreichbar, bitte versuche es gleich nochmal." }, { status: 503 });
  }
}
