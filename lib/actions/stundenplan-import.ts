"use server";

import Anthropic from "@anthropic-ai/sdk";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { FachRow } from "@/lib/grades/db";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const FACH_FARBEN = [
  "#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#06b6d4", "#f97316", "#84cc16", "#ec4899", "#1da1ff",
];

const FREIZEIT_NAMEN = new Set(["freizeit", "freistunde", "frei", "free", "pause", "leerstunde"]);

export interface ParsedStunde {
  tempId: string;
  wochentag: number;
  zeitStart: string;
  zeitEnd: string;
  fachName: string;
  bezeichnung: string | null;
  fachId: string | null;
  isNew: boolean;
  lehrer: string;
  raum: string;
  wocheTyp: "A" | "B" | null;
}

export type ParseResult =
  | { ok: true; stunden: ParsedStunde[]; neueFachNamen: string[]; hatAbWochen: boolean }
  | { ok: false; error: string };

const VALID_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);
// 6 MB unkomprimiert → base64 ≈ 8 MB → ~8_000_000 Zeichen
const MAX_BASE64_CHARS = 8_000_000;

export async function parseStundenplanFoto(
  imageBase64: string,
  mimeType: string,
  faecher: FachRow[],
): Promise<ParseResult> {
  if (!VALID_MIME_TYPES.has(mimeType)) {
    return { ok: false, error: "Ungültiger Bildtyp. Erlaubt: JPEG, PNG, GIF, WebP." };
  }
  if (imageBase64.length > MAX_BASE64_CHARS) {
    return { ok: false, error: "Bild zu groß. Bitte ein kleineres oder komprimierteres Foto verwenden." };
  }
  try {
    const fachListe = faecher.length > 0
      ? faecher.map((f) => f.name).join(", ")
      : "noch keine";

    const prompt = `Analysiere dieses Bild eines Schulstundenplans und extrahiere alle Unterrichtsstunden.

Bereits bekannte Fächer des Users: ${fachListe}

Regeln:
- wochentag: 1=Montag, 2=Dienstag, 3=Mittwoch, 4=Donnerstag, 5=Freitag
- zeitStart / zeitEnd: Format "HH:MM" (24h), schätze wenn nicht klar erkennbar
- fachName: Genau wie im Bild (oder erkennbares Vollwort wenn abgekürzt), versuche auf bekannte Fächer zu matchen
- lehrer: Kürzel/Name falls sichtbar, sonst ""
- raum: Raum falls sichtbar, sonst ""
- wocheTyp: Falls der Stundenplan A- und B-Wochen unterscheidet (z.B. Spalten "A"/"B", Beschriftungen "A-Woche"/"B-Woche"): setze "A" oder "B". Sonst null.

Antworte NUR mit einem JSON-Array, keine weiteren Erklärungen:
[{"wochentag":1,"zeitStart":"08:00","zeitEnd":"09:30","fachName":"Mathematik","lehrer":"","raum":"","wocheTyp":null}]`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
                data: imageBase64,
              },
            },
            { type: "text", text: prompt },
          ],
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return { ok: false, error: "Claude hat kein gültiges JSON zurückgegeben. Versuch's mit einem klareren Foto." };
    }

    const raw = JSON.parse(jsonMatch[0]) as Array<{
      wochentag: number;
      zeitStart: string;
      zeitEnd: string;
      fachName: string;
      lehrer: string;
      raum: string;
      wocheTyp?: "A" | "B" | null;
    }>;

    if (!Array.isArray(raw) || raw.length === 0) {
      return { ok: false, error: "Keine Stunden erkannt. Ist das wirklich ein Stundenplan-Foto?" };
    }

    const fachMap = new Map(faecher.map((f) => [f.name.toLowerCase().trim(), f.id]));
    const neueFachNamen = new Set<string>();

    const stunden: ParsedStunde[] = raw
      .filter((s) => s.wochentag >= 1 && s.wochentag <= 5 && s.zeitStart && s.zeitEnd)
      .map((s, i) => {
        const normalisiert = s.fachName.toLowerCase().trim();
        const istFreizeit = FREIZEIT_NAMEN.has(normalisiert);
        const matchedId = istFreizeit ? null : (fachMap.get(normalisiert) ?? null);
        const isNew = !istFreizeit && !matchedId && !!s.fachName.trim();
        if (isNew) neueFachNamen.add(s.fachName.trim());
        const wocheTyp = s.wocheTyp === "A" || s.wocheTyp === "B" ? s.wocheTyp : null;
        return {
          tempId: `t${i}`,
          wochentag: s.wochentag,
          zeitStart: s.zeitStart.slice(0, 5),
          zeitEnd: s.zeitEnd.slice(0, 5),
          fachName: istFreizeit ? "" : (s.fachName.trim() || "Unbekannt"),
          bezeichnung: istFreizeit ? s.fachName.trim() || "Freistunde" : null,
          fachId: matchedId,
          isNew,
          lehrer: s.lehrer ?? "",
          raum: s.raum ?? "",
          wocheTyp,
        };
      });

    const hatAbWochen = stunden.some((s) => s.wocheTyp !== null);

    return { ok: true, stunden, neueFachNamen: Array.from(neueFachNamen), hatAbWochen };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unbekannter Fehler." };
  }
}

const MAX_STUNDEN_IMPORT = 100;

export async function importStunden(
  stunden: ParsedStunde[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (stunden.length === 0) return { ok: false, error: "Keine Stunden zum Importieren." };
  if (stunden.length > MAX_STUNDEN_IMPORT) {
    return { ok: false, error: `Zu viele Stunden (max. ${MAX_STUNDEN_IMPORT}).` };
  }
  try {
    const supabase = await createClient();
    const { data: claimsData } = await supabase.auth.getClaims();
    const userId = claimsData?.claims?.sub;
    if (typeof userId !== "string") throw new Error("Nicht angemeldet.");

    // Neue Fächer anlegen
    const neueFachNamen = [
      ...new Set(stunden.filter((s) => s.isNew && !s.fachId).map((s) => s.fachName)),
    ];
    const neuFachIdMap = new Map<string, string>();

    if (neueFachNamen.length > 0) {
      const rows = neueFachNamen.map((name, i) => ({
        user_id: userId,
        name,
        farbe: FACH_FARBEN[i % FACH_FARBEN.length],
        niveau: "grund",
        halbjahr: null,
        fach_gewicht: 1,
        gewicht_klausur: 50,
        gewicht_muendlich: 50,
        gewicht_sonstige: 0,
        ausgeschlossen: false,
      }));
      const { data, error } = await supabase.from("schule_fach").insert(rows).select("id, name");
      if (error) return { ok: false, error: error.message };
      data?.forEach((f) => neuFachIdMap.set(f.name, f.id));
    }

    // Stunden bulk-eintragen
    const insert = stunden.map((s) => ({
      user_id: userId,
      fach_id: s.fachId ?? (s.fachName ? neuFachIdMap.get(s.fachName) ?? null : null),
      bezeichnung: s.bezeichnung || null,
      wochentag: s.wochentag,
      zeit_start: s.zeitStart + ":00",
      zeit_end: s.zeitEnd + ":00",
      raum: s.raum.trim() || null,
      lehrer: s.lehrer.trim() || null,
      woche_typ: s.wocheTyp,
    }));

    const { error } = await supabase.from("stundenplan_stunde").insert(insert);
    if (error) return { ok: false, error: error.message };

    revalidatePath("/stundenplan");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler." };
  }
}
