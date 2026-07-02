"use server";

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { assembleFaecher, type FachRow, type NoteRow, type KlausurRow } from "@/lib/grades/db";
import { aktuellesHalbjahr } from "@/lib/grades/halbjahr";
import { gesamtSchnittGerundet } from "@/lib/grades/calc";
import type { HausaufgabeRow } from "@/lib/stundenplan/types";
import type { StundeRow } from "@/lib/stundenplan/types";
import { FERIEN, type Bundesland } from "@/lib/ferien/ferien-data";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function heuteDatum(): string {
  return new Date().toISOString().slice(0, 10);
}

function wochentagName(): string {
  const tage = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
  return tage[new Date().getDay()];
}

function tageBis(iso: string): number {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  const ziel = new Date(y, m - 1, d);
  const heute = new Date();
  const h = new Date(heute.getFullYear(), heute.getMonth(), heute.getDate());
  return Math.round((ziel.getTime() - h.getTime()) / 86400000);
}

function ferienHinweis(bundesland: string | null, heute: string): string | null {
  const bl = bundesland as Bundesland | null;
  const perioden = bl ? FERIEN[bl] : null;
  if (!perioden) return null;

  const heuteMs = new Date(heute).getTime();

  const aktuell = perioden.find(f => {
    const von = new Date(f.von).getTime();
    const bis = new Date(f.bis).getTime() + 86400000;
    return heuteMs >= von && heuteMs < bis;
  });

  if (aktuell) {
    const restTage = Math.ceil((new Date(aktuell.bis).getTime() + 86400000 - heuteMs) / 86400000);
    if (restTage <= 2) return `${aktuell.name} enden in ${restTage} Tag(en) — danach geht Schule wieder los.`;
    return `Aktuell ${aktuell.name} (noch ${restTage} Tage bis ${aktuell.bis}).`;
  }

  const naechste = perioden.find(f => new Date(f.von).getTime() > heuteMs);
  if (!naechste) return null;

  const inTagen = Math.ceil((new Date(naechste.von).getTime() - heuteMs) / 86400000);

  if (inTagen <= 10) return `${naechste.name} starten in ${inTagen} Tag(en) (${naechste.von}).`;

  // Gelegentlicher Motivator: jeden 7. Tag basierend auf Datums-Hash
  const dayOfYear = Math.floor((heuteMs - new Date(new Date(heute).getFullYear(), 0, 0).getTime()) / 86400000);
  if (dayOfYear % 7 !== 0) return null;

  return `${naechste.name} kommen in ${inTagen} Tagen (${naechste.von}).`;
}

function baueKontext(params: {
  name: string;
  halbjahr: string;
  gesamt: number | null;
  faecher: Array<{ name: string; schnitt: number | null }>;
  klausuren: KlausurRow[];
  hausaufgaben: HausaufgabeRow[];
  stundenHeute: StundeRow[];
  entfallHeute: Map<string, { typ: "entfall" | "krank"; begruendung: string | null }>;
  fachMap: Map<string, string>;
  ferienHinweis: string | null;
}): string {
  const { name, halbjahr, gesamt, faecher, klausuren, hausaufgaben, stundenHeute, entfallHeute, fachMap, ferienHinweis: ferien } = params;

  const entfaelleAmTag = stundenHeute.filter((s) => entfallHeute.has(s.id));
  const alleEntfallen = stundenHeute.length > 0 && entfaelleAmTag.length === stundenHeute.length;
  const krankHeute = entfaelleAmTag.length > 0 && entfaelleAmTag.every((s) => entfallHeute.get(s.id)?.typ === "krank");
  const ersterGrund = entfaelleAmTag.map((s) => entfallHeute.get(s.id)?.begruendung).find((g) => g) ?? null;

  let stundenStr: string;
  if (!stundenHeute.length) {
    stundenStr = "Keine Stunden heute";
  } else if (alleEntfallen) {
    stundenStr = krankHeute
      ? `Ganzer Tag krankgemeldet${ersterGrund ? ` (${ersterGrund})` : ""}`
      : `Heute fällt alles aus${ersterGrund ? ` (${ersterGrund})` : ""}`;
  } else {
    stundenStr = stundenHeute
      .map((s) => {
        const e = entfallHeute.get(s.id);
        const basis = `${s.zeit_start.slice(0, 5)}–${s.zeit_end.slice(0, 5)} ${fachMap.get(s.fach_id ?? "") ?? "Stunde"}`;
        if (!e) return basis;
        const tag = e.typ === "krank" ? "krank" : "entfällt";
        return `${basis} [${tag}${e.begruendung ? `: ${e.begruendung}` : ""}]`;
      })
      .join(", ");
  }

  const baldKlausuren = klausuren
    .filter((k) => tageBis(k.datum) >= 0 && tageBis(k.datum) <= 14)
    .sort((a, b) => tageBis(a.datum) - tageBis(b.datum))
    .slice(0, 3)
    .map((k) => `${k.titel}${fachMap.get(k.fach_id ?? "") ? ` (${fachMap.get(k.fach_id ?? "")})` : ""} in ${tageBis(k.datum)} Tag(en)`)
    .join(", ") || "Keine";

  const offeneHA = hausaufgaben.filter((h) => !h.erledigt);
  const haStr = offeneHA.length
    ? offeneHA
        .slice(0, 3)
        .map((h) => `${h.beschreibung} (fällig ${h.faellig_am})`)
        .join(", ")
    : "Keine offenen";

  const notenStr = faecher
    .filter((f) => f.schnitt !== null)
    .map((f) => `${f.name}: ${f.schnitt}`)
    .join(", ") || "Noch keine Noten";

  return `
Schüler: ${name}
Wochentag: ${wochentagName()}, ${heuteDatum()}
Halbjahr: ${halbjahr}
Gesamtschnitt: ${gesamt ?? "–"}/15

Stundenplan heute: ${stundenStr}
Nächste Klausuren: ${baldKlausuren}
Hausaufgaben: ${haStr}
Aktuelle Fachschnitte: ${notenStr}${ferien ? `\nFerieninfo: ${ferien}` : ""}
`.trim();
}

export async function holeBriefing(): Promise<string | null> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims?.sub) return "Nicht eingeloggt.";

  const userId = auth.claims.sub;
  const heute = heuteDatum();

  // Cached Briefing für heute?
  const { data: cached } = await supabase
    .from("briefing_cache")
    .select("text")
    .eq("user_id", userId)
    .eq("datum", heute)
    .single();

  if (cached?.text) return cached.text;

  // Userdaten laden
  const { data: profil } = await supabase
    .from("nutzer_profil")
    .select("name, aktuelles_halbjahr, briefing_aktiv, bundesland")
    .eq("id", userId)
    .single();

  if (profil?.briefing_aktiv === false) return null;

  const name = profil?.name ?? "Schüler";
  const halbjahr = profil?.aktuelles_halbjahr ?? aktuellesHalbjahr();
  const bundesland = (profil?.bundesland as string | null) ?? null;

  const [{ data: fachRows }, { data: noteRows }, { data: klausurRows }, { data: haRows }, { data: stundeRows }, { data: entfallRows }] =
    await Promise.all([
      supabase.from("schule_fach").select("*").eq("user_id", userId).eq("halbjahr", halbjahr),
      supabase.from("schule_note").select("fach_id, punkte, kategorie, gewicht").eq("user_id", userId),
      supabase.from("schule_klausur").select("*").eq("user_id", userId).gte("datum", heute).order("datum").limit(10),
      supabase.from("hausaufgabe").select("*").eq("user_id", userId).eq("erledigt", false),
      supabase.from("stundenplan_stunde").select("*").eq("user_id", userId).eq("wochentag", new Date().getDay() || 7),
      supabase.from("stundenplan_entfall").select("stunde_id, typ, begruendung").eq("user_id", userId).eq("datum", heute),
    ]);

  const entfallHeute = new Map(
    (entfallRows ?? []).map((e) => [e.stunde_id as string, { typ: e.typ as "entfall" | "krank", begruendung: (e.begruendung as string | null) ?? null }]),
  );

  const faecher = assembleFaecher(
    (fachRows ?? []) as FachRow[],
    (noteRows ?? []) as NoteRow[],
  );
  const gesamt = gesamtSchnittGerundet(faecher);
  const fachMap = new Map(faecher.map((f) => [f.id, f.name]));

  const kontext = baueKontext({
    name,
    halbjahr,
    gesamt,
    faecher: faecher.map((f) => ({
      name: f.name,
      schnitt: f.noten.length ? Math.round(f.noten.reduce((s, n) => s + n.punkte, 0) / f.noten.length * 10) / 10 : null,
    })),
    klausuren: (klausurRows ?? []) as KlausurRow[],
    hausaufgaben: (haRows ?? []) as HausaufgabeRow[],
    stundenHeute: (stundeRows ?? []) as StundeRow[],
    entfallHeute,
    fachMap,
    ferienHinweis: ferienHinweis(bundesland, heute),
  });

  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 200,
    system: `Du schreibst das tägliche Morgen-Briefing für ${name}, 17, Gymnasium ${halbjahr}.

Stil: Wie die ersten 2–3 Sätze einer Morgen-Nachricht von einem Kumpel der deine Schulwoche kennt.
Kein "Guten Morgen!" am Anfang. Keine Aufzählungen. Keine Emojis. Keine Motivationsfloskeln.
Schreib wie jemand der tippt, nicht wie jemand der eine Meldung verfasst.

Priorität was du erwähnst (in dieser Reihenfolge, nur was wirklich zutrifft):
1. Klausuren in ≤ 3 Tagen → immer, konkret ("Mathe morgen" nicht "bald eine Klausur")
2. Hausaufgaben fällig heute oder morgen → nur wenn vorhanden
3. Stundenplan heute → wenn ganzer Tag ausfällt oder krankgemeldet ist, das ruhig erwähnen (kurz, locker). Einzelne ausgefallene Stunden nur wenn relevant. Sonst nur erwähnen wenn ungewöhnlich viel oder wenig.
4. Ferieninfo (wenn im Kontext vorhanden) → locker einbauen. Kurz vor Ferien: als Motivator ("noch 3 Tage, dann Ferien"). In den Ferien: kurz erwähnen, aber kein Schul-Fokus. Ferien enden bald: sanft auf Schulstart hinweisen.
5. Gesamtschnitt → nur wenn bemerkenswert oder sich was verändert hat

Wenn nichts Besonderes ansteht: kurz und entspannt sagen dass gerade Ruhe ist.
Nichts erfinden oder aufbauschen. Nur was aus den Daten hervorgeht.

Länge: 2–3 Sätze, maximal.
Sprache: Deutsch, du-Form.

VERBOTEN: "Es gilt" · "Fokus liegt auf" · "Guten Morgen!" · "Bleib motiviert" · "Heute steht an" · Bullet-Points
GUT: "Mathe-Klausur übermorgen — hast du die Formeln drauf? Ansonsten gerade alles ruhig."
SCHLECHT: "Es gilt heute besonders auf die anstehende Mathematik-Klausur zu achten."`,
    messages: [{ role: "user", content: kontext }],
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text : "Guten Start heute.";

  // Cache speichern (ignoriere Fehler — briefing_cache hat RLS für insert)
  await supabase.from("briefing_cache").upsert(
    { user_id: userId, datum: heute, text },
    { onConflict: "user_id,datum" },
  );

  return text;
}
