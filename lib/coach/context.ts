// lib/coach/context.ts
import { createClient } from "@/lib/supabase/server";
import { assembleFaecher, type FachRow, type NoteRow, type KlausurRow } from "@/lib/grades/db";
import { aktuellesHalbjahr } from "@/lib/grades/halbjahr";
import { gesamtSchnittGerundet } from "@/lib/grades/calc";
import type { HausaufgabeRow, StundeRow } from "@/lib/stundenplan/types";
import { FERIEN, BUNDESLAND_LABEL, type Bundesland } from "@/lib/ferien/ferien-data";

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

function ferienKontext(bundesland: string | null, heute: string): string {
  const bl = (bundesland as Bundesland | null);
  const perioden = bl && FERIEN[bl] ? FERIEN[bl] : null;
  if (!perioden) return "Keine Ferien-Daten verfügbar";

  const blName = bl ? (BUNDESLAND_LABEL[bl] ?? bl) : "unbekannt";
  const heuteMs = new Date(heute).getTime();

  const aktuell = perioden.find(f => {
    const von = new Date(f.von).getTime();
    const bis = new Date(f.bis).getTime() + 86400000;
    return heuteMs >= von && heuteMs < bis;
  });

  const kommend = perioden
    .filter(f => new Date(f.von).getTime() > heuteMs)
    .slice(0, 4);

  const lines: string[] = [`Bundesland: ${blName}`];
  if (aktuell) {
    const restTage = Math.ceil((new Date(aktuell.bis).getTime() + 86400000 - heuteMs) / 86400000);
    lines.push(`AKTUELL IN FERIEN: ${aktuell.name} (bis ${aktuell.bis}, noch ${restTage} Tage)`);
  } else {
    lines.push("Aktuell: Schule (kein Ferienzeitraum)");
  }
  for (const f of kommend) {
    const inTagen = Math.ceil((new Date(f.von).getTime() - heuteMs) / 86400000);
    lines.push(`Nächste: ${f.name} ${f.von} bis ${f.bis} (in ${inTagen} Tagen)`);
  }
  return lines.join("\n");
}

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
    .select("name, aktuelles_halbjahr, bundesland")
    .eq("id", userId)
    .single();

  const name = profil?.name ?? "Schüler";
  const halbjahr = profil?.aktuelles_halbjahr ?? aktuellesHalbjahr();
  const bundesland = (profil?.bundesland as string | null) ?? null;
  const heute = new Date().toISOString().slice(0, 10);

  // Fächer zuerst — brauchen wir die IDs für den Noten-Filter
  const { data: fachRows } = await supabase
    .from("schule_fach")
    .select("id, user_id, name, farbe, niveau, halbjahr, fach_gewicht, gewicht_klausur, gewicht_muendlich, gewicht_sonstige, gewichtung_config, ausgeschlossen, created_at")
    .eq("user_id", userId)
    .eq("halbjahr", halbjahr)
    .order("created_at");

  const fachIds = (fachRows ?? []).map((f) => f.id);

  const nextWeek = (() => { const d = new Date(heute); d.setDate(d.getDate() + 7); return d.toISOString().slice(0, 10); })();

  const [
    { data: noteRows },
    { data: klausurRows },
    { data: haRows },
    { data: stundeRows },
    { data: entfallRows },
  ] = await Promise.all([
    fachIds.length
      ? supabase.from("schule_note")
          .select("id, user_id, fach_id, punkte, kategorie, gewicht, bezeichnung, datum, created_at")
          .in("fach_id", fachIds)
      : Promise.resolve({ data: [] as NoteRow[], error: null }),
    supabase.from("schule_klausur")
      .select("id, user_id, fach_id, titel, datum, vorbereitung_prozent, notiz, created_at")
      .eq("user_id", userId)
      .gte("datum", heute)
      .order("datum")
      .limit(10),
    supabase.from("hausaufgabe")
      .select("id, user_id, fach_id, beschreibung, faellig_am, erledigt, created_at")
      .eq("user_id", userId)
      .eq("erledigt", false)
      .order("faellig_am")
      .limit(20),
    supabase.from("stundenplan_stunde")
      .select("id, user_id, fach_id, bezeichnung, wochentag, zeit_start, zeit_end, raum, lehrer, woche_typ")
      .eq("user_id", userId)
      .order("wochentag")
      .order("zeit_start"),
    supabase.from("stundenplan_entfall")
      .select("stunde_id")
      .eq("user_id", userId)
      .gte("datum", heute)
      .lte("datum", nextWeek),
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

  const entfallTypMap = new Map((entfallRows ?? []).map((e: { stunde_id: string; typ?: string }) => [e.stunde_id, e.typ ?? "entfall"]));

  const stundenStr = (stundeRows ?? []).length
    ? (stundeRows as StundeRow[])
        .map(
          (s) => {
            const eTyp = entfallTypMap.get(s.id);
            const entfallHinweis = eTyp === "krank" ? " 🤒 KRANK diese Woche" : eTyp === "entfall" ? " ⚠️ ENTFALL diese Woche" : "";
            const fachName = s.fach_id ? fachMap.get(s.fach_id) : (s.bezeichnung ?? null);
            return `- [id:${s.id}] ${wochentagName(s.wochentag)} ${s.zeit_start.slice(0, 5)}–${s.zeit_end.slice(0, 5)}${fachName ? ` · ${fachName}` : ""}${s.raum ? ` · Raum ${s.raum}` : ""}${s.lehrer ? ` · ${s.lehrer}` : ""}${entfallHinweis}`;
          },
        )
        .join("\n")
    : "Kein Stundenplan";

  const ferienStr = ferienKontext(bundesland, heute);

  const systemPrompt = `Du bist der Coach in Project X — einer Schul-App für ${name} (17, Gymnasium, ${halbjahr}).

── STIMME & TON ───────────────────────────────────────────────────────
Du klingst wie ein 20-jähriger der selbst Gymnasium durchgezogen hat und jetzt studiert. Kennt die Situation, sagt direkt was Sache ist.

Du-Form. Schreib fließend wie jemand der tippt — keine Aufzählungszeichen, keine Bindestriche als Trenner, keine "—" als Füllzeichen in deinen Antworten. Einfache Sätze hintereinander, kein Aufsatzstil.

Wenn ${name} etwas Emotionales schreibt ("ich pack das nicht", "hab wieder versagt"): einen kurzen Satz Verständnis, dann direkt auf die Daten eingehen. Beispiel: "Kenn ich. Dein Mathe-Schnitt liegt bei 9, was war die letzte Klausur?" — NICHT: "Das verstehe ich total! Es ist wichtig, dass du dir keine Vorwürfe machst..."

Wenn ${name} einfach redet ("hey", "wie geht's", "was machst du", "langweilig"): normal menschlich antworten, kurz und locker, kein Daten-Fokus. Wenn Ferien sind dann gerne darauf eingehen.

Länge: Bestätigung nach Dateneintrag = 1 Satz. Einfache Frage = 1 bis 2 Sätze. Komplexe Situation = maximal 4 Sätze, nie mehr.

Nur auf das eingehen was ${name} gerade angesprochen hat.

VERBOTEN: "Es gilt" / "Fokus liegt auf" / "Ich würde empfehlen" / "Großartig!" / "Super!" / "Weiter so!" / "Als dein KI-Coach" / Bullet-Point-Listen / mehr als 4 Sätze / Sonderzeichen wie "·" oder "──" in Antworten

── TOOL-REGELN ────────────────────────────────────────────────────────
Du MUSST bei JEDER Antwort genau ein Tool aufrufen — ohne Ausnahme.
Für Text-Antworten (Fragen beantworten, erklären, kommentieren): "respond_to_user".
Für Daten schreiben (eintragen, löschen, ändern): das passende Mutations-Tool.

Mutations-Tools sind echte Datenbankaufrufe, keine Simulation. Du hast Schreibrecht.
"Trag ein / lösch / ändere" = sofort das passende Tool, nicht respond_to_user.
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

SCHULFERIEN:
${ferienStr}

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
