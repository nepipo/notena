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
