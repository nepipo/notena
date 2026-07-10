import { describe, it, expect } from "vitest";
import {
  heuteInBerlin,
  tageBis,
  relativerTag,
  alterAusGeburtsdatum,
  fachSchnitte,
  baueKontext,
  baueSystemPrompt,
  ferienLaeuftGerade,
  kuerzeAnSatzgrenze,
  type BriefingKontextDaten,
} from "./prompt";
import { getNotensystem } from "../grades/systems";
import type { Fach } from "../grades/types";
import type { KlausurRow } from "../grades/db";
import type { HausaufgabeRow, StundeRow } from "../stundenplan/types";

// ── Datum / Zeitzone ───────────────────────────────────────────────────────

describe("heuteInBerlin", () => {
  it("liefert das Berliner Datum, nicht das UTC-Datum (Mitternachts-Fall)", () => {
    // 22:30 UTC am 7.7. = 00:30 am 8.7. in Berlin (CEST)
    const d = heuteInBerlin(new Date("2026-07-07T22:30:00Z"));
    expect(d.iso).toBe("2026-07-08");
    expect(d.wochentagName).toBe("Mittwoch");
    expect(d.wochentagIndex).toBe(3);
  });

  it("mappt Sonntag auf Index 7", () => {
    const d = heuteInBerlin(new Date("2026-07-05T10:00:00Z"));
    expect(d.wochentagIndex).toBe(7);
    expect(d.wochentagName).toBe("Sonntag");
  });

  it("funktioniert auch im Winter (CET)", () => {
    // 23:30 UTC am 31.12. = 00:30 am 1.1. in Berlin (CET +1)
    const d = heuteInBerlin(new Date("2026-12-31T23:30:00Z"));
    expect(d.iso).toBe("2027-01-01");
  });
});

describe("tageBis / relativerTag", () => {
  it("rechnet Tagesdifferenzen korrekt", () => {
    expect(tageBis("2026-07-08", "2026-07-08")).toBe(0);
    expect(tageBis("2026-07-09", "2026-07-08")).toBe(1);
    expect(tageBis("2026-07-06", "2026-07-08")).toBe(-2);
    expect(tageBis("2026-07-09T00:00:00+02:00", "2026-07-08")).toBe(1); // Timestamp-Format
  });

  it("formuliert relative Tage", () => {
    expect(relativerTag(0)).toBe("heute");
    expect(relativerTag(1)).toBe("morgen");
    expect(relativerTag(2)).toBe("übermorgen");
    expect(relativerTag(5)).toBe("in 5 Tagen");
    expect(relativerTag(-1)).toBe("gestern");
    expect(relativerTag(-3)).toBe("vor 3 Tagen");
  });
});

describe("alterAusGeburtsdatum", () => {
  it("berechnet das Alter unter Berücksichtigung des Geburtstags", () => {
    expect(alterAusGeburtsdatum("2009-07-10", "2026-07-08")).toBe(16); // Geburtstag steht noch aus
    expect(alterAusGeburtsdatum("2009-07-08", "2026-07-08")).toBe(17); // heute Geburtstag
    expect(alterAusGeburtsdatum(null, "2026-07-08")).toBeNull();
    expect(alterAusGeburtsdatum("2026-01-01", "2026-07-08")).toBeNull(); // unplausibel (< 5)
  });
});

// ── Fachschnitte ───────────────────────────────────────────────────────────

describe("fachSchnitte", () => {
  it("nutzt die Gewichtungs-Config statt eines naiven Mittelwerts", () => {
    const faecher: Fach[] = [
      {
        id: "f1",
        name: "Mathe",
        noten: [
          { punkte: 15, kategorie: "klausur" },
          { punkte: 5, kategorie: "muendlich" },
        ],
        // Klausur zählt 100% → Schnitt muss 15 sein, nicht 10
        gewichtungConfig: {
          klausur: 1, test: 0, muendlich: 0, referat: 0, hausaufgabe: 0, sonstige: 0,
          klausurDynamisch: false, klausurPro: 0.2, klausurMax: 2,
        },
      },
    ];
    expect(fachSchnitte(faecher)).toEqual([{ name: "Mathe", punkte: 15 }]);
  });

  it("überspringt ausgeschlossene Fächer und Unterfächer", () => {
    const faecher: Fach[] = [
      { id: "f1", name: "Sport", noten: [{ punkte: 12, kategorie: "muendlich" }], ausgeschlossen: true },
      { id: "f2", name: "Bio-Teilkurs", noten: [{ punkte: 10, kategorie: "muendlich" }], parentFachId: "f3", subfachGewicht: 0.5 },
    ];
    expect(fachSchnitte(faecher)).toEqual([]);
  });

  it("lässt Fächer ohne Noten weg", () => {
    const faecher: Fach[] = [{ id: "f1", name: "Kunst", noten: [] }];
    expect(fachSchnitte(faecher)).toEqual([]);
  });
});

// ── ferienLaeuftGerade ─────────────────────────────────────────────────────

describe("ferienLaeuftGerade", () => {
  it("gibt true zurück während der Hamburger Sommerferien 2026", () => {
    // Hamburg Sommerferien 2026: 25.06.2026–05.08.2026
    expect(ferienLaeuftGerade("HH", "2026-07-10")).toBe(true);
  });

  it("gibt false zurück außerhalb der Ferien", () => {
    expect(ferienLaeuftGerade("HH", "2026-09-01")).toBe(false);
  });

  it("gibt false zurück wenn kein Bundesland angegeben", () => {
    expect(ferienLaeuftGerade(null, "2026-07-10")).toBe(false);
  });
});

// ── Kontext ────────────────────────────────────────────────────────────────

function leererKontext(): BriefingKontextDaten {
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
    ferienLaufend: false,
  };
}

function ha(teil: Partial<HausaufgabeRow>): HausaufgabeRow {
  return {
    id: "h1", user_id: "u", fach_id: null, beschreibung: "Aufgabe",
    faellig_am: "2026-07-09", erledigt: false, created_at: "",
    ...teil,
  };
}

function stunde(teil: Partial<StundeRow>): StundeRow {
  return {
    id: "s1", user_id: "u", halbjahr_id: null, fach_id: null, bezeichnung: null,
    wochentag: 3, zeit_start: "08:00:00", zeit_end: "09:30:00", raum: null, lehrer: null, woche_typ: null,
    ...teil,
  };
}

describe("baueKontext", () => {
  it("benennt fehlende Daten explizit statt sie offen zu lassen", () => {
    const kontext = baueKontext(leererKontext());
    expect(kontext).toContain("Keine Stunden eingetragen");
    expect(kontext).toContain("Keine in den nächsten 14 Tagen");
    expect(kontext).toContain("Keine offenen");
    expect(kontext).toContain("Noch keine Noten eingetragen");
    expect(kontext).not.toContain("Ferieninfo");
  });

  it("formuliert Klausur-Termine relativ und sortiert nach Nähe", () => {
    const d = leererKontext();
    d.fachMap = new Map([["fm", "Mathe"], ["fe", "Englisch"]]);
    d.klausuren = [
      { id: "k2", fach_id: "fe", titel: "Vokabeltest", datum: "2026-07-15" } as KlausurRow,
      { id: "k1", fach_id: "fm", titel: "Klausur 2", datum: "2026-07-09" } as KlausurRow,
      { id: "k3", fach_id: null, titel: "Weit weg", datum: "2026-09-01" } as KlausurRow, // > 14 Tage
    ];
    const kontext = baueKontext(d);
    expect(kontext).toContain("Klausur 2 (Mathe) — morgen");
    expect(kontext.indexOf("Klausur 2")).toBeLessThan(kontext.indexOf("Vokabeltest"));
    expect(kontext).toContain("Vokabeltest (Englisch) — in 7 Tagen");
    expect(kontext).not.toContain("Weit weg");
  });

  it("markiert überfällige Hausaufgaben und sortiert sie nach vorn", () => {
    const d = leererKontext();
    d.hausaufgaben = [
      ha({ id: "h1", beschreibung: "Lektüre lesen", faellig_am: "2026-07-12" }),
      ha({ id: "h2", beschreibung: "Analysis-Blatt", faellig_am: "2026-07-06" }),
    ];
    const kontext = baueKontext(d);
    expect(kontext).toContain("Analysis-Blatt — überfällig (war vor 2 Tagen)");
    expect(kontext.indexOf("Analysis-Blatt")).toBeLessThan(kontext.indexOf("Lektüre lesen"));
    expect(kontext).toContain("Lektüre lesen — fällig in 4 Tagen");
  });

  it("zeigt 'Ferien — kein Unterricht' wenn ferienLaufend und kein Stundenplan", () => {
    const d = leererKontext();
    d.ferienLaufend = true;
    expect(baueKontext(d)).toContain("Ferien — kein Unterricht");
    expect(baueKontext(d)).not.toContain("Keine Stunden eingetragen");
  });

  it("zeigt 'Keine Stunden eingetragen' außerhalb der Ferien", () => {
    const kontext = baueKontext(leererKontext()); // ferienLaufend: false
    expect(kontext).toContain("Keine Stunden eingetragen");
  });

  it("fasst einen komplett entfallenen Tag zusammen", () => {
    const d = leererKontext();
    d.stundenHeute = [stunde({ id: "s1" }), stunde({ id: "s2", zeit_start: "10:00:00" })];
    d.entfallHeute = new Map([
      ["s1", { typ: "entfall" as const, begruendung: "Hitzefrei" }],
      ["s2", { typ: "entfall" as const, begruendung: null }],
    ]);
    expect(baueKontext(d)).toContain("Heute fällt alles aus (Hitzefrei)");
  });

  it("zeigt Schnitte im Notensystem des Users an", () => {
    const d = leererKontext();
    d.system = getNotensystem("de_1_6");
    d.gesamtPunkte = 12;
    const kontext = baueKontext(d);
    expect(kontext).toContain("Deutschland — Schulnoten (1–6)");
    expect(kontext).not.toContain("Gesamtschnitt: –");
  });
});

// ── System-Prompt ──────────────────────────────────────────────────────────

describe("baueSystemPrompt", () => {
  it("nutzt echte Profildaten statt hartkodierter Annahmen", () => {
    const prompt = baueSystemPrompt({
      name: "Lena", alter: 15, klasse: 10, schulform: "Stadtteilschule",
      halbjahr: "10/2", sprache: "Deutsch",
    });
    expect(prompt).toContain("Lena, 15 Jahre, Klasse 10, Stadtteilschule, Halbjahr 10/2");
    expect(prompt).not.toContain("Gymnasium");
    expect(prompt).not.toContain("17");
  });

  it("lässt unbekannte Profilfelder weg", () => {
    const prompt = baueSystemPrompt({
      name: "Schüler", alter: null, klasse: null, schulform: null,
      halbjahr: "11/1", sprache: "Deutsch",
    });
    expect(prompt).toContain("Empfänger: Schüler, Halbjahr 11/1.");
  });

  it("parametrisiert die Zielsprache", () => {
    const prompt = baueSystemPrompt({
      name: "Sam", alter: null, klasse: null, schulform: null,
      halbjahr: "12/1", sprache: "Englisch",
    });
    expect(prompt).toContain("Ausgabesprache: Englisch");
    expect(prompt).toContain("Das gesamte Briefing ist auf Englisch");
  });

  it("enthält die Kernregeln (Anti-Halluzination, Format, Priorität)", () => {
    const prompt = baueSystemPrompt({
      name: "S", alter: null, klasse: null, schulform: null, halbjahr: "11/1", sprache: "Deutsch",
    });
    expect(prompt).toContain("Erfinde nichts dazu");
    expect(prompt).toContain("Kein Markdown");
    expect(prompt).toContain("keine Emojis");
    expect(prompt).toContain("PRIORITÄT");
  });
});

// ── Nachbearbeitung ────────────────────────────────────────────────────────

describe("kuerzeAnSatzgrenze", () => {
  it("schneidet abgebrochenen Text am letzten Satzende ab", () => {
    expect(kuerzeAnSatzgrenze("Mathe-Klausur morgen, viel Erfolg. Außerdem sol"))
      .toBe("Mathe-Klausur morgen, viel Erfolg.");
  });

  it("lässt vollständige Texte unverändert", () => {
    expect(kuerzeAnSatzgrenze("Alles ruhig heute.")).toBe("Alles ruhig heute.");
  });

  it("kürzt nicht auf unbrauchbar kurze Fragmente", () => {
    expect(kuerzeAnSatzgrenze("Kurz. Und dann ein sehr langer abgebrochener Sa"))
      .toBe("Kurz. Und dann ein sehr langer abgebrochener Sa");
  });
});
