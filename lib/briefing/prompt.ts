/**
 * Prompt- und Kontext-Bausteine fürs tägliche Morgen-Briefing.
 * Reine Funktionen ohne DB/React — damit alles unit-testbar bleibt.
 * Der eigentliche API-Call lebt in lib/actions/briefing.ts.
 */

import { fachSchnitt, fachSchnittMitUnterfaecher } from "../grades/calc";
import type { Fach } from "../grades/types";
import type { Notensystem } from "../grades/systems";
import type { KlausurRow } from "../grades/db";
import type { HausaufgabeRow, StundeRow } from "../stundenplan/types";
import { FERIEN, type Bundesland } from "../ferien/ferien-data";

export const BRIEFING_ZEITZONE = "Europe/Berlin";

/**
 * Zielsprache des Briefings. Zentral gehalten: sobald das Profil eine
 * Sprach-Einstellung bekommt (i18n vor Beta), wird sie hier durchgereicht —
 * der Prompt ist bereits sprachparametrisiert.
 */
export const BRIEFING_SPRACHE = "Deutsch";

const WOCHENTAGE = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];

// ── Datum (immer Europe/Berlin, unabhängig von Server-Zeitzone) ────────────

export interface BerlinDatum {
  /** ISO "YYYY-MM-DD" des heutigen Tages in Berlin. */
  iso: string;
  /** 1 = Montag … 7 = Sonntag (passend zu stundenplan_stunde.wochentag). */
  wochentagIndex: number;
  wochentagName: string;
}

export function heuteInBerlin(now: Date = new Date()): BerlinDatum {
  // sv-SE formatiert als "YYYY-MM-DD" — stabiler Trick für ISO-Datum in Ziel-Zeitzone
  const iso = now.toLocaleDateString("sv-SE", { timeZone: BRIEFING_ZEITZONE });
  const js = new Date(iso + "T12:00:00Z").getUTCDay(); // 0 = So
  const wochentagIndex = js === 0 ? 7 : js;
  return { iso, wochentagIndex, wochentagName: WOCHENTAGE[wochentagIndex - 1] };
}

/** Ganze Tage zwischen heute und Ziel (negativ = Vergangenheit). Beide ISO. */
export function tageBis(zielIso: string, heuteIso: string): number {
  const ziel = Date.parse(zielIso.slice(0, 10) + "T00:00:00Z");
  const heute = Date.parse(heuteIso + "T00:00:00Z");
  return Math.round((ziel - heute) / 86400000);
}

export function relativerTag(tage: number): string {
  if (tage === 0) return "heute";
  if (tage === 1) return "morgen";
  if (tage === 2) return "übermorgen";
  if (tage === -1) return "gestern";
  if (tage > 2) return `in ${tage} Tagen`;
  return `vor ${-tage} Tagen`;
}

export function alterAusGeburtsdatum(geburtsdatum: string | null, heuteIso: string): number | null {
  if (!geburtsdatum) return null;
  const [gy, gm, gd] = geburtsdatum.slice(0, 10).split("-").map(Number);
  const [hy, hm, hd] = heuteIso.split("-").map(Number);
  if (!gy || !gm || !gd) return null;
  let alter = hy - gy;
  if (hm < gm || (hm === gm && hd < gd)) alter--;
  return alter >= 5 && alter <= 100 ? alter : null;
}

// ── Ferien ─────────────────────────────────────────────────────────────────

/** Gibt true zurück, wenn heute eine Ferienperiode für das Bundesland aktiv ist. */
export function ferienLaeuftGerade(bundesland: string | null, heuteIso: string): boolean {
  const bl = bundesland as Bundesland | null;
  const perioden = bl ? FERIEN[bl] : null;
  if (!perioden) return false;
  const heuteMs = Date.parse(heuteIso + "T00:00:00Z");
  return perioden.some((f) => {
    const von = Date.parse(f.von + "T00:00:00Z");
    const bis = Date.parse(f.bis + "T00:00:00Z") + 86400000;
    return heuteMs >= von && heuteMs < bis;
  });
}

export function ferienHinweis(bundesland: string | null, heuteIso: string): string | null {
  const bl = bundesland as Bundesland | null;
  const perioden = bl ? FERIEN[bl] : null;
  if (!perioden) return null;

  const heuteMs = Date.parse(heuteIso + "T00:00:00Z");

  const aktuell = perioden.find((f) => {
    const von = Date.parse(f.von + "T00:00:00Z");
    const bis = Date.parse(f.bis + "T00:00:00Z") + 86400000;
    return heuteMs >= von && heuteMs < bis;
  });

  if (aktuell) {
    const restTage = Math.ceil((Date.parse(aktuell.bis + "T00:00:00Z") + 86400000 - heuteMs) / 86400000);
    if (restTage <= 2) return `${aktuell.name} enden in ${restTage} Tag(en) — danach geht Schule wieder los.`;
    return `Aktuell ${aktuell.name} (noch ${restTage} Tage bis ${aktuell.bis}).`;
  }

  const naechste = perioden.find((f) => Date.parse(f.von + "T00:00:00Z") > heuteMs);
  if (!naechste) return null;

  const inTagen = Math.ceil((Date.parse(naechste.von + "T00:00:00Z") - heuteMs) / 86400000);
  if (inTagen <= 10) return `${naechste.name} starten in ${inTagen} Tag(en) (${naechste.von}).`;

  // Gelegentlicher Motivator: jeden 7. Tag basierend auf Datums-Hash
  const jahr = Number(heuteIso.slice(0, 4));
  const dayOfYear = Math.floor((heuteMs - Date.UTC(jahr, 0, 0)) / 86400000);
  if (dayOfYear % 7 !== 0) return null;

  return `${naechste.name} kommen in ${inTagen} Tagen (${naechste.von}).`;
}

// ── Fachschnitte (gewichtet, wie überall in der App) ───────────────────────

export function fachSchnitte(faecher: Fach[]): Array<{ name: string; punkte: number }> {
  const unterfachMap = new Map<string, Fach[]>();
  for (const f of faecher) {
    if (f.parentFachId) {
      const list = unterfachMap.get(f.parentFachId) ?? [];
      list.push(f);
      unterfachMap.set(f.parentFachId, list);
    }
  }
  const result: Array<{ name: string; punkte: number }> = [];
  for (const fach of faecher) {
    if (fach.ausgeschlossen || fach.parentFachId) continue;
    const unterfaecher = unterfachMap.get(fach.id) ?? [];
    const schnitt =
      unterfaecher.length > 0
        ? fachSchnittMitUnterfaecher(fach, unterfaecher)
        : fachSchnitt(fach.noten, fach.gewichtungConfig);
    if (schnitt !== null) result.push({ name: fach.name, punkte: schnitt });
  }
  return result;
}

// ── Kontext (die Daten, die das Modell sehen darf) ─────────────────────────

export interface EntfallInfo {
  typ: "entfall" | "krank";
  begruendung: string | null;
}

export interface BriefingKontextDaten {
  heute: BerlinDatum;
  halbjahr: string;
  /** Zielsprache des Briefings — wird als Abschluss-Anweisung an die Daten gehängt. */
  sprache: string;
  system: Notensystem;
  gesamtPunkte: number | null;
  faecher: Fach[];
  klausuren: KlausurRow[];
  hausaufgaben: HausaufgabeRow[];
  stundenHeute: StundeRow[];
  entfallHeute: Map<string, EntfallInfo>;
  fachMap: Map<string, string>;
  ferien: string | null;
  /** Ob heute aktiv Ferien sind — beeinflusst den Stundenplan-Text im Kontext. */
  ferienLaufend: boolean;
}

export function baueKontext(d: BriefingKontextDaten): string {
  const { heute, system, fachMap } = d;

  // Stundenplan heute
  const entfaelle = d.stundenHeute.filter((s) => d.entfallHeute.has(s.id));
  const alleEntfallen = d.stundenHeute.length > 0 && entfaelle.length === d.stundenHeute.length;
  const krankHeute = alleEntfallen && entfaelle.every((s) => d.entfallHeute.get(s.id)?.typ === "krank");
  const ersterGrund = entfaelle.map((s) => d.entfallHeute.get(s.id)?.begruendung).find((g) => g) ?? null;

  let stundenStr: string;
  if (!d.stundenHeute.length) {
    stundenStr = d.ferienLaufend ? "Ferien — kein Unterricht" : "Keine Stunden eingetragen";
  } else if (alleEntfallen) {
    stundenStr = krankHeute
      ? `Ganzer Tag krankgemeldet${ersterGrund ? ` (${ersterGrund})` : ""}`
      : `Heute fällt alles aus${ersterGrund ? ` (${ersterGrund})` : ""}`;
  } else {
    stundenStr = [...d.stundenHeute]
      .sort((a, b) => a.zeit_start.localeCompare(b.zeit_start))
      .map((s) => {
        const fachName = (s.fach_id && fachMap.get(s.fach_id)) || s.bezeichnung || "Stunde";
        const basis = `${s.zeit_start.slice(0, 5)}–${s.zeit_end.slice(0, 5)} ${fachName}`;
        const e = d.entfallHeute.get(s.id);
        if (!e) return basis;
        const tag = e.typ === "krank" ? "krank" : "entfällt";
        return `${basis} [${tag}${e.begruendung ? `: ${e.begruendung}` : ""}]`;
      })
      .join(", ");
  }

  // Klausuren in den nächsten 14 Tagen
  const baldigeKlausuren = d.klausuren
    .map((k) => ({ k, t: tageBis(k.datum, heute.iso) }))
    .filter(({ t }) => t >= 0 && t <= 14)
    .sort((a, b) => a.t - b.t);
  const klausurStr = baldigeKlausuren.length
    ? baldigeKlausuren
        .slice(0, 3)
        .map(({ k, t }) => {
          const fach = k.fach_id ? fachMap.get(k.fach_id) : null;
          return `${k.titel}${fach ? ` (${fach})` : ""} — ${relativerTag(t)}`;
        })
        .join(", ") +
      (baldigeKlausuren.length > 3 ? `, dazu ${baldigeKlausuren.length - 3} weitere` : "")
    : "Keine in den nächsten 14 Tagen";

  // Offene Hausaufgaben, dringendste zuerst
  const offeneHA = d.hausaufgaben
    .filter((h) => !h.erledigt)
    .map((h) => ({ h, t: tageBis(h.faellig_am, heute.iso) }))
    .sort((a, b) => a.t - b.t);
  const haStr = offeneHA.length
    ? offeneHA
        .slice(0, 4)
        .map(({ h, t }) => {
          const fach = h.fach_id ? fachMap.get(h.fach_id) : null;
          const faellig = t < 0 ? `überfällig (war ${relativerTag(t)})` : `fällig ${relativerTag(t)}`;
          return `${h.beschreibung}${fach ? ` (${fach})` : ""} — ${faellig}`;
        })
        .join(", ") + (offeneHA.length > 4 ? `, dazu ${offeneHA.length - 4} weitere` : "")
    : "Keine offenen";

  // Noten
  const schnitte = fachSchnitte(d.faecher);
  const notenStr = schnitte.length
    ? schnitte.map((f) => `${f.name}: ${system.formatSchnitt(f.punkte)}`).join(", ")
    : "Noch keine Noten eingetragen";
  const gesamtStr = d.gesamtPunkte !== null ? system.formatSchnitt(d.gesamtPunkte) : "–";

  return `
Heute: ${heute.wochentagName}, ${heute.iso}
Halbjahr: ${d.halbjahr}
Notensystem: ${system.label}

Stundenplan heute: ${stundenStr}
Nächste Klausuren: ${klausurStr}
Offene Hausaufgaben: ${haStr}
Gesamtschnitt: ${gesamtStr}
Fachschnitte: ${notenStr}${d.ferien ? `\nFerieninfo: ${d.ferien}` : ""}

Schreibe das Briefing jetzt — komplett auf ${d.sprache}.
`.trim();
}

// ── System-Prompt ──────────────────────────────────────────────────────────

export interface BriefingProfil {
  name: string;
  alter: number | null;
  klasse: number | null;
  schulform: string | null;
  halbjahr: string;
  sprache: string;
}

export function baueSystemPrompt(p: BriefingProfil): string {
  const empfaengerTeile = [
    p.name,
    p.alter !== null ? `${p.alter} Jahre` : null,
    p.klasse !== null ? `Klasse ${p.klasse}` : null,
    p.schulform,
    `Halbjahr ${p.halbjahr}`,
  ].filter(Boolean);

  return `Du schreibst das tägliche Morgen-Briefing für einen Schüler. Es erscheint als kurze Text-Karte oben im Dashboard einer Schul-App. Ausgabesprache: ${p.sprache}.

Empfänger: ${empfaengerTeile.join(", ")}.

STIL
- 2 bis 3 lockere Sätze, wie eine Nachricht von einem Kumpel, der den Schulalltag kennt.
- Keine Begrüßung, keine Anrede — direkt zur Sache.
- Natürlich und konkret, nicht wie ein Assistent: keine Floskeln, keine Motivationssprüche, kein Ausrufezeichen-Stakkato.

SPRACHE
- Das gesamte Briefing ist auf ${p.sprache} — auch wenn diese Anweisungen und die Daten auf Deutsch sind.
- Idiomatisch und fehlerfrei in Rechtschreibung, Grammatik und Zeichensetzung. Deutsche Texte: normale Groß- und Kleinschreibung, echte Umlaute (ä, ö, ü, ß). Andere Sprachen: deren korrekte Akzente und Sonderzeichen.
- Fach-, Personen- und Ortsnamen aus den Daten unverändert übernehmen, nicht übersetzen.
- Zeit- und Datumsangaben aus den Daten sinngemäß und natürlich in der Zielsprache formulieren, nicht wörtlich kopieren.

FORMAT
- Nur Fließtext. Kein Markdown, keine Überschriften, keine Aufzählungen, keine Trennlinien, keine Emojis, keine Anführungszeichen um den Text.

DATEN
- Nutze ausschließlich die Daten aus der Nachricht. Erfinde nichts dazu — keine Fächer, Termine, Noten, Uhrzeiten oder Namen.
- Fehlt eine Information, lass den Punkt weg. Nicht erwähnen, dass etwas fehlt, nicht nachfragen.
- Wirken Daten widersprüchlich (z.B. Klausur an einem Tag, an dem alles ausfällt), nenne beides neutral und spekuliere nicht.

PRIORITÄT (nur erwähnen, was wirklich zutrifft)
1. Klausuren in den nächsten 3 Tagen — immer und konkret ("Mathe-Klausur morgen"), nie vage ("bald eine Klausur").
2. Überfällige oder heute/morgen fällige Hausaufgaben.
3. Stundenplan heute — nur wenn ungewöhnlich (kompletter Ausfall, Krankmeldung).
4. Ferieninfo, falls vorhanden — beiläufig einbauen.
5. Gesamtschnitt — nur wenn bemerkenswert.

Wenn nichts ansteht: 1 bis 2 entspannte Sätze, dass gerade Ruhe ist. Nichts aufblähen.

GUT: "Mathe-Klausur übermorgen — sitzen die Formeln? Sonst ist die Woche entspannt."
SCHLECHT: "Guten Morgen! 📚 Heute steht Folgendes an: ..."
(Die Beispiele sind auf Deutsch — übertrage nur den Stil in die Zielsprache.)

WICHTIG: Der Briefing-Text selbst ist ausschließlich auf ${p.sprache}.`;
}

// ── Nachbearbeitung ────────────────────────────────────────────────────────

/** Schneidet abgebrochenen Text an der letzten Satzgrenze ab (Fallback bei max_tokens). */
export function kuerzeAnSatzgrenze(text: string): string {
  const t = text.trim();
  const idx = Math.max(t.lastIndexOf("."), t.lastIndexOf("!"), t.lastIndexOf("?"));
  return idx >= 20 ? t.slice(0, idx + 1) : t;
}
