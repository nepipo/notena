import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { assembleFaecher, type FachRow, type NoteRow, type KlausurRow } from "@/lib/grades/db";
import { aktuellesHalbjahr } from "@/lib/grades/halbjahr";
import { gesamtSchnittGerundet } from "@/lib/grades/calc";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function tageBis(iso: string): number {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  const ziel = new Date(y, m - 1, d);
  const h = new Date();
  const heute = new Date(h.getFullYear(), h.getMonth(), h.getDate());
  return Math.round((ziel.getTime() - heute.getTime()) / 86400000);
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims?.sub) {
    return new Response("Nicht eingeloggt", { status: 401 });
  }

  const { messages } = await req.json() as {
    messages: Array<{ role: "user" | "assistant"; content: string }>;
  };

  if (!messages?.length) return new Response("Keine Nachrichten", { status: 400 });

  const userId = auth.claims.sub;
  const heute = new Date().toISOString().slice(0, 10);

  // Schuldaten als System-Kontext
  const { data: profil } = await supabase
    .from("nutzer_profil")
    .select("name, aktuelles_halbjahr")
    .eq("id", userId)
    .single();

  const name = profil?.name ?? "Schüler";
  const halbjahr = profil?.aktuelles_halbjahr ?? aktuellesHalbjahr();

  const [{ data: fachRows }, { data: noteRows }, { data: klausurRows }, { data: haRows }] =
    await Promise.all([
      supabase.from("schule_fach").select("*").eq("halbjahr", halbjahr),
      supabase.from("schule_note").select("fach_id, punkte, kategorie, gewicht"),
      supabase.from("schule_klausur").select("*").gte("datum", heute).order("datum").limit(5),
      supabase.from("hausaufgabe").select("*").eq("erledigt", false).order("faellig_am").limit(5),
    ]);

  const faecher = assembleFaecher((fachRows ?? []) as FachRow[], (noteRows ?? []) as NoteRow[]);
  const gesamt = gesamtSchnittGerundet(faecher);
  const fachMap = new Map(faecher.map((f) => [f.id, f.name]));

  const klausurStr = ((klausurRows ?? []) as KlausurRow[])
    .filter((k) => tageBis(k.datum) >= 0)
    .map((k) => `${k.titel}${fachMap.get(k.fach_id ?? "") ? ` (${fachMap.get(k.fach_id ?? "")})` : ""} in ${tageBis(k.datum)}T`)
    .join(", ") || "Keine";

  const haStr = (haRows ?? [])
    .map((h) => `${h.beschreibung} (${h.faellig_am})`)
    .join(", ") || "Keine";

  const notenStr = faecher
    .filter((f) => f.noten.length)
    .map((f) => {
      const s = Math.round(f.noten.reduce((a, n) => a + n.punkte, 0) / f.noten.length * 10) / 10;
      return `${f.name}: ${s}`;
    })
    .join(", ") || "Noch keine";

  const systemPrompt = `Du bist ein älterer Freund von ${name}, der selbst gut in der Schule war und ehrlich antwortet.

Daten von heute (${heute}):
- Gesamtschnitt: ${gesamt ?? "–"}/15
- Fächer: ${notenStr}
- Klausuren: ${klausurStr}
- Hausaufgaben: ${haStr}

Wie du antwortest:
- Normal und direkt, wie man mit einem Freund redet — kein Coach-Ton, keine Motivationsphrasen
- Kurz: 1–3 Sätze reichen fast immer. Nur bei konkreten Erklärungen (z.B. Mathe-Aufgabe) länger.
- Nur auf Basis der echten Daten — nichts erfinden
- Deutsch, du-Form`;

  const stream = await anthropic.messages.stream({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    system: systemPrompt,
    messages: messages.slice(-10),
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          controller.enqueue(encoder.encode(chunk.delta.text));
        }
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
