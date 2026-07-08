/**
 * Live-Probe gegen die echte Claude API — Qualitätscheck für den Briefing-Prompt.
 * Läuft NUR mit BRIEFING_LIVE=1 (in CI immer geskippt, kein API-Key nötig).
 * Nach jeder Prompt-Änderung ausführen (~1 Cent, 6 Haiku-Calls):
 *   export $(grep "^ANTHROPIC_API_KEY" .env.local | xargs) && BRIEFING_LIVE=1 npx vitest run --disable-console-intercept lib/briefing/live-probe.test.ts
 */
import { describe, it, expect } from "vitest";
import Anthropic from "@anthropic-ai/sdk";
import { baueKontext, baueSystemPrompt, type BriefingKontextDaten } from "./prompt";
import { getNotensystem } from "../grades/systems";
import type { KlausurRow } from "../grades/db";
import type { HausaufgabeRow, StundeRow } from "../stundenplan/types";

const LIVE = process.env.BRIEFING_LIVE === "1";
const anthropic = LIVE ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) : null;

function basisDaten(): BriefingKontextDaten {
  return {
    heute: { iso: "2026-07-08", wochentagIndex: 3, wochentagName: "Mittwoch" },
    halbjahr: "11/2",
    sprache: "Deutsch",
    system: getNotensystem("de_0_15"),
    gesamtPunkte: null,
    faecher: [],
    klausuren: [],
    hausaufgaben: [],
    stundenHeute: [],
    entfallHeute: new Map(),
    fachMap: new Map(),
    ferien: null,
  };
}

function volleDaten(): BriefingKontextDaten {
  const d = basisDaten();
  d.gesamtPunkte = 11.3;
  d.fachMap = new Map([["fm", "Mathe"], ["fd", "Deutsch"], ["fb", "Biologie"]]);
  d.faecher = [
    { id: "fm", name: "Mathe", noten: [{ punkte: 13, kategorie: "klausur" }, { punkte: 10, kategorie: "muendlich" }] },
    { id: "fd", name: "Deutsch", noten: [{ punkte: 9, kategorie: "muendlich" }] },
  ];
  d.klausuren = [
    { id: "k1", fach_id: "fm", titel: "Analysis-Klausur", datum: "2026-07-09" } as KlausurRow,
  ];
  d.hausaufgaben = [
    { id: "h1", user_id: "u", fach_id: "fd", beschreibung: "Faust Kapitel 3 lesen", faellig_am: "2026-07-08", erledigt: false, created_at: "" } as HausaufgabeRow,
  ];
  d.stundenHeute = [
    { id: "s1", user_id: "u", halbjahr_id: null, fach_id: "fm", bezeichnung: null, wochentag: 3, zeit_start: "08:00:00", zeit_end: "09:30:00", raum: null, lehrer: null, woche_typ: null } as StundeRow,
  ];
  return d;
}

async function generiere(daten: BriefingKontextDaten, sprache: string, name = "Nepomuk"): Promise<string> {
  const msg = await anthropic!.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    system: baueSystemPrompt({ name, alter: 17, klasse: 11, schulform: "Gymnasium", halbjahr: daten.halbjahr, sprache }),
    messages: [{ role: "user", content: baueKontext({ ...daten, sprache }) }],
  });
  const block = msg.content.find((b) => b.type === "text");
  return block?.text.trim() ?? "";
}

function pruefeFormat(text: string) {
  expect(text.length).toBeGreaterThan(20);
  // Keine Markdown-/Format-Artefakte
  expect(text).not.toMatch(/[#*_`]|^- |\n- |---|\p{Extended_Pictographic}/u);
  // Kein kaputtes Encoding
  expect(text).not.toMatch(/�|Ã¤|Ã¶|Ã¼|&auml;|\\u00/);
  // Keine Assistenten-Floskeln
  expect(text.toLowerCase()).not.toMatch(/guten morgen|hier ist dein briefing|gerne erstelle/);
}

describe.skipIf(!LIVE)("Briefing Live-Proben (echte API)", () => {
  it("Deutsch, volle Daten", async () => {
    const text = await generiere(volleDaten(), "Deutsch");
    console.log("\n[DE voll]", text);
    pruefeFormat(text);
    expect(text).toMatch(/Analysis|Mathe/); // Klausur morgen muss vorkommen
    expect(text).toMatch(/[äöüÄÖÜß]/); // echte Umlaute
  }, 30000);

  it("Englisch, volle Daten", async () => {
    const text = await generiere(volleDaten(), "Englisch");
    console.log("\n[EN voll]", text);
    pruefeFormat(text);
    expect(text).toMatch(/tomorrow|exam|test/i);
    expect(text).toMatch(/Mathe|Analysis/); // Fachnamen bleiben unübersetzt
  }, 30000);

  it("Französisch (Akzente/Sonderzeichen), volle Daten", async () => {
    const text = await generiere(volleDaten(), "Französisch");
    console.log("\n[FR voll]", text);
    pruefeFormat(text);
    expect(text).toMatch(/demain|contrôle|examen|révis/i);
  }, 30000);

  it("Deutsch, komplett leere Daten — nichts erfinden", async () => {
    const text = await generiere(basisDaten(), "Deutsch");
    console.log("\n[DE leer]", text);
    pruefeFormat(text);
    // Darf keine konkreten Fächer/Termine erfinden
    expect(text).not.toMatch(/Mathe|Deutsch(?!land)|Bio|Klausur am|\d{1,2}:\d{2}/);
  }, 30000);

  it("Deutsch, widersprüchliche Daten (Klausur heute, aber alles fällt aus)", async () => {
    const d = volleDaten();
    d.klausuren = [{ id: "k1", fach_id: "fm", titel: "Analysis-Klausur", datum: "2026-07-08" } as KlausurRow];
    d.entfallHeute = new Map([["s1", { typ: "entfall" as const, begruendung: "Sturmwarnung" }]]);
    const text = await generiere(d, "Deutsch");
    console.log("\n[DE widerspruch]", text);
    pruefeFormat(text);
  }, 30000);

  it("Deutsch, fehlender Name/Teildaten", async () => {
    const d = basisDaten();
    d.hausaufgaben = [
      { id: "h1", user_id: "u", fach_id: null, beschreibung: "Referat vorbereiten", faellig_am: "2026-07-05", erledigt: false, created_at: "" } as HausaufgabeRow,
    ];
    const msg = await anthropic!.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system: baueSystemPrompt({ name: "Schüler", alter: null, klasse: null, schulform: null, halbjahr: "11/2", sprache: "Deutsch" }),
      messages: [{ role: "user", content: baueKontext(d) }],
    });
    const block = msg.content.find((b) => b.type === "text");
    const text = block?.text.trim() ?? "";
    console.log("\n[DE teil]", text);
    pruefeFormat(text);
    expect(text).toMatch(/Referat/); // überfällige HA muss vorkommen
  }, 30000);
});
