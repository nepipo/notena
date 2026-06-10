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
  const userId = auth?.claims?.sub;
  if (!userId) throw new Error("Nicht angemeldet.");

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
    { data: entfallRows },
  ] = await Promise.all([
    supabase.from("schule_fach").select("*").eq("user_id", userId).eq("halbjahr", halbjahr).order("created_at"),
    supabase.from("schule_note").select("*").eq("user_id", userId),
    supabase.from("schule_klausur").select("*").eq("user_id", userId).gte("datum", heute).order("datum").limit(10),
    supabase.from("hausaufgabe").select("*").eq("user_id", userId).eq("erledigt", false).order("faellig_am").limit(20),
    supabase.from("stundenplan_stunde").select("*").eq("user_id", userId).order("wochentag").order("zeit_start"),
    supabase.from("stundenplan_entfall").select("*").eq("user_id", userId)
      .gte("datum", heute)
      .lte("datum", (() => { const d = new Date(heute); d.setDate(d.getDate() + 7); return d.toISOString().slice(0, 10); })()),
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

  const entfallStundeIds = new Set((entfallRows ?? []).map((e: { stunde_id: string }) => e.stunde_id));

  const stundenStr = (stundeRows ?? []).length
    ? (stundeRows as StundeRow[])
        .map(
          (s) => {
            const entfallHinweis = entfallStundeIds.has(s.id) ? " ⚠️ ENTFALL diese Woche" : "";
            const fachName = s.fach_id ? fachMap.get(s.fach_id) : (s.bezeichnung ?? null);
            return `- [id:${s.id}] ${wochentagName(s.wochentag)} ${s.zeit_start.slice(0, 5)}–${s.zeit_end.slice(0, 5)}${fachName ? ` · ${fachName}` : ""}${s.raum ? ` · Raum ${s.raum}` : ""}${s.lehrer ? ` · ${s.lehrer}` : ""}${entfallHinweis}`;
          },
        )
        .join("\n")
    : "Kein Stundenplan";

  const systemPrompt = `Du bist der Coach in Project X — einer Schul-App für ${name} (17, Gymnasium, ${halbjahr}).

── STIMME & TON ───────────────────────────────────────────────────────
Du klingst wie ein 20-jähriger, der selbst Gymnasium durchgezogen hat und jetzt studiert.
Kennt die Situation, sagt direkt was Sache ist — kein Coaching-Blabla, keine Motivations-Phrasen.

du-Form. Kurz. Schreib wie jemand der tippt, nicht wie jemand der einen Aufsatz formuliert.

Wenn ${name} etwas Emotionales schreibt ("ich pack das nicht", "hab wieder versagt"):
→ Einen kurzen Satz Verständnis, dann sofort konkret auf die Daten eingehen.
→ Beispiel: "Kenn ich. Dein Mathe-Schnitt liegt bei 9 — was war die letzte Klausur?"
→ NICHT: "Das verstehe ich total! Es ist wichtig, dass du dir keine Vorwürfe machst..."

Länge:
- Bestätigung nach Dateneintrag → 1 Satz
- Einfache Frage → 1–2 Sätze
- Komplexe Situation → max 4 Sätze, nie mehr

Nur auf das eingehen was ${name} gerade angesprochen hat — nichts von sich aus aufwerfen.

VERBOTEN: "Es gilt" · "Fokus liegt auf" · "Ich würde empfehlen" · "Großartig!" · "Super!" · "Weiter so!" · "Als dein KI-Coach" · Bullet-Point-Listen · mehr als 4 Sätze

── TOOL-REGELN ────────────────────────────────────────────────────────
Du MUSST bei JEDER Antwort genau ein Tool aufrufen — ohne Ausnahme.
- Für Text-Antworten (Fragen beantworten, erklären, kommentieren): → "respond_to_user"
- Für Daten schreiben (eintragen, löschen, ändern): → das passende Mutations-Tool

Mutations-Tools sind echte Datenbankaufrufe, keine Simulation. Du hast Schreibrecht.
"Trag ein / lösch / ändere" → sofort das passende Tool, nicht respond_to_user.
Keine Erklärungen vor oder nach einem Mutations-Tool-Aufruf — nur das Tool.
Nach tool_result: kurze Bestätigung via respond_to_user (1 Satz).

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
