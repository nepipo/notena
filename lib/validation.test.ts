import { describe, it, expect } from "vitest";
import {
  KategorieSchema,
  HalbjahrSchema,
  AddFachSchema,
  NoteInputSchema,
  AddKlausurSchema,
  ApplyOnboardingSchema,
  DatumSchema,
  UhrzeitSchema,
  AddHausaufgabeSchema,
  StundeSchema,
  HalbjahrBezeichnungSchema,
} from "./validation";
import { istPlausiblesGeburtsdatum, istEchtesKalenderdatum } from "./date/datum";

describe("KategorieSchema", () => {
  it("akzeptiert alle Builtin-Kategorien", () => {
    for (const k of ["klausur", "muendlich", "test", "referat", "hausaufgabe", "sonstige"]) {
      expect(KategorieSchema.safeParse(k).success).toBe(true);
    }
  });
  it("akzeptiert Custom-Kategorie-IDs im Format aus kategorien.ts", () => {
    expect(KategorieSchema.safeParse("custom_abc123def456").success).toBe(true);
  });
  it("lehnt unbekannte Werte ab", () => {
    expect(KategorieSchema.safeParse("sonstig").success).toBe(false); // alter Tippfehler
    expect(KategorieSchema.safeParse("").success).toBe(false);
    expect(KategorieSchema.safeParse("custom_XYZ").success).toBe(false);
    expect(KategorieSchema.safeParse("klausur'; DROP TABLE").success).toBe(false);
  });
});

describe("HalbjahrSchema", () => {
  it("akzeptiert das App-Format JJJJ/JJ-N", () => {
    expect(HalbjahrSchema.safeParse("2025/26-1").success).toBe(true);
    expect(HalbjahrSchema.safeParse("2026/27-2").success).toBe(true);
  });
  it("lehnt andere Formate ab", () => {
    expect(HalbjahrSchema.safeParse("25/1").success).toBe(false);
    expect(HalbjahrSchema.safeParse("2025/26-3").success).toBe(false);
    expect(HalbjahrSchema.safeParse("irgendwas").success).toBe(false);
  });
});

describe("AddFachSchema", () => {
  it("trimmt den Namen und akzeptiert gültige Eingaben", () => {
    const r = AddFachSchema.safeParse({ name: "  Mathe  ", halbjahr: "2025/26-1" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.name).toBe("Mathe");
  });
  it("lehnt leere und überlange Namen ab", () => {
    expect(AddFachSchema.safeParse({ name: "   ", halbjahr: "2025/26-1" }).success).toBe(false);
    expect(AddFachSchema.safeParse({ name: "x".repeat(101), halbjahr: "2025/26-1" }).success).toBe(false);
  });
});

describe("NoteInputSchema", () => {
  const fachId = "9b1c2f34-5678-4abc-9def-0123456789ab";
  it("akzeptiert gültige Noten-Eingaben", () => {
    expect(
      NoteInputSchema.safeParse({ fachId, kategorie: "klausur", bezeichnung: "1. Klausur", gewicht: 2 }).success,
    ).toBe(true);
  });
  it("lehnt Gewicht 0, negatives und überhöhtes Gewicht ab", () => {
    expect(NoteInputSchema.safeParse({ fachId, kategorie: "klausur", gewicht: 0 }).success).toBe(false);
    expect(NoteInputSchema.safeParse({ fachId, kategorie: "klausur", gewicht: -1 }).success).toBe(false);
    expect(NoteInputSchema.safeParse({ fachId, kategorie: "klausur", gewicht: 11 }).success).toBe(false);
  });
  it("lehnt überlange Bezeichnungen und kaputte Fach-IDs ab", () => {
    expect(NoteInputSchema.safeParse({ fachId, kategorie: "klausur", bezeichnung: "x".repeat(201) }).success).toBe(false);
    expect(NoteInputSchema.safeParse({ fachId: "nicht-uuid", kategorie: "klausur" }).success).toBe(false);
  });
});

describe("istPlausiblesGeburtsdatum", () => {
  it("akzeptiert echte Geburtsdaten in der Vergangenheit", () => {
    expect(istPlausiblesGeburtsdatum("2008-05-14")).toBe(true);
    expect(istPlausiblesGeburtsdatum("2000-01-01")).toBe(true);
    expect(istPlausiblesGeburtsdatum("2004-02-29")).toBe(true); // Schaltjahr
  });
  it("lehnt Quatsch-Jahre und Zukunftsdaten ab", () => {
    expect(istPlausiblesGeburtsdatum("9999-12-31")).toBe(false); // Nepomuks Beispiel
    expect(istPlausiblesGeburtsdatum("1200-01-01")).toBe(false); // absurd alt
    const naechstesJahr = new Date().getUTCFullYear() + 1;
    expect(istPlausiblesGeburtsdatum(`${naechstesJahr}-01-01`)).toBe(false); // Zukunft
  });
  it("lehnt unmögliche Kalenderdaten ab", () => {
    expect(istPlausiblesGeburtsdatum("2026-99-99")).toBe(false);
    expect(istPlausiblesGeburtsdatum("2026-02-30")).toBe(false); // 30. Februar
    expect(istPlausiblesGeburtsdatum("2023-02-29")).toBe(false); // kein Schaltjahr
    expect(istPlausiblesGeburtsdatum("2026-13-01")).toBe(false); // Monat 13
    expect(istPlausiblesGeburtsdatum("2026-00-10")).toBe(false); // Monat 0
  });
  it("lehnt falsche Formate ab", () => {
    expect(istPlausiblesGeburtsdatum("14.05.2008")).toBe(false);
    expect(istPlausiblesGeburtsdatum("2008-5-14")).toBe(false);
    expect(istPlausiblesGeburtsdatum("")).toBe(false);
  });
});

describe("istEchtesKalenderdatum", () => {
  it("akzeptiert echte Tage, auch Schaltjahr", () => {
    expect(istEchtesKalenderdatum("2026-07-23")).toBe(true);
    expect(istEchtesKalenderdatum("2024-02-29")).toBe(true);
    expect(istEchtesKalenderdatum("1999-12-31")).toBe(true);
  });
  it("lehnt unmögliche Tage ab (ohne Bereichsgrenzen)", () => {
    expect(istEchtesKalenderdatum("2026-02-30")).toBe(false);
    expect(istEchtesKalenderdatum("2026-13-01")).toBe(false);
    expect(istEchtesKalenderdatum("9999-12-31")).toBe(true); // echtes Datum, nur nicht als Geburtstag plausibel
    expect(istEchtesKalenderdatum("07/23/2026")).toBe(false);
  });
});

describe("DatumSchema", () => {
  it("akzeptiert echte Kalenderdaten", () => {
    expect(DatumSchema.safeParse("2026-09-01").success).toBe(true);
  });
  it("lehnt Format-Müll und unmögliche Tage ab", () => {
    expect(DatumSchema.safeParse("2026-02-30").success).toBe(false);
    expect(DatumSchema.safeParse("2026-99-99").success).toBe(false);
    expect(DatumSchema.safeParse("01.09.2026").success).toBe(false);
  });
});

describe("UhrzeitSchema", () => {
  it("akzeptiert echte Uhrzeiten", () => {
    expect(UhrzeitSchema.safeParse("08:00").success).toBe(true);
    expect(UhrzeitSchema.safeParse("23:59").success).toBe(true);
    expect(UhrzeitSchema.safeParse("08:00:00").success).toBe(true);
  });
  it("lehnt Unsinn ab", () => {
    expect(UhrzeitSchema.safeParse("99:99").success).toBe(false);
    expect(UhrzeitSchema.safeParse("24:00").success).toBe(false);
    expect(UhrzeitSchema.safeParse("8:00").success).toBe(false);
  });
});

describe("AddHausaufgabeSchema", () => {
  const uuid = "9b1c2f34-5678-4abc-9def-0123456789ab";
  it("akzeptiert gültige Eingaben und trimmt", () => {
    const r = AddHausaufgabeSchema.safeParse({ fachId: uuid, beschreibung: "  S. 42  ", faelligAm: "2026-09-01" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.beschreibung).toBe("S. 42");
  });
  it("lehnt leere, überlange Beschreibung und kaputtes Datum ab", () => {
    expect(AddHausaufgabeSchema.safeParse({ fachId: null, beschreibung: "   ", faelligAm: "2026-09-01" }).success).toBe(false);
    expect(AddHausaufgabeSchema.safeParse({ fachId: null, beschreibung: "x".repeat(1001), faelligAm: "2026-09-01" }).success).toBe(false);
    expect(AddHausaufgabeSchema.safeParse({ fachId: null, beschreibung: "ok", faelligAm: "2026-02-30" }).success).toBe(false);
  });
});

describe("StundeSchema", () => {
  const gueltig = {
    fachId: null,
    bezeichnung: "  Doppelstunde ",
    wochentag: 2,
    zeitStart: "08:00",
    zeitEnd: "09:30",
    raum: "  R204 ",
    lehrer: "",
    wocheTyp: "A" as const,
  };
  it("akzeptiert gültige Stunden, trimmt und macht leere Felder zu null", () => {
    const r = StundeSchema.safeParse(gueltig);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.bezeichnung).toBe("Doppelstunde");
      expect(r.data.raum).toBe("R204");
      expect(r.data.lehrer).toBeNull();
    }
  });
  it("lehnt Endzeit vor Startzeit ab", () => {
    expect(StundeSchema.safeParse({ ...gueltig, zeitStart: "10:00", zeitEnd: "09:00" }).success).toBe(false);
  });
  it("lehnt kaputten Wochentag, Uhrzeit und überlange Felder ab", () => {
    expect(StundeSchema.safeParse({ ...gueltig, wochentag: 9 }).success).toBe(false);
    expect(StundeSchema.safeParse({ ...gueltig, zeitStart: "99:99" }).success).toBe(false);
    expect(StundeSchema.safeParse({ ...gueltig, raum: "x".repeat(51) }).success).toBe(false);
  });
});

describe("HalbjahrBezeichnungSchema", () => {
  it("akzeptiert normale Bezeichnungen, lehnt leer/überlang ab", () => {
    expect(HalbjahrBezeichnungSchema.safeParse("11/1").success).toBe(true);
    expect(HalbjahrBezeichnungSchema.safeParse("   ").success).toBe(false);
    expect(HalbjahrBezeichnungSchema.safeParse("x".repeat(61)).success).toBe(false);
  });
});

describe("ApplyOnboardingSchema — Geburtsdatum", () => {
  const basis = { vorname: "Nepomuk", klasse: 11, faecher: [] };
  it("akzeptiert kein/leeres Geburtsdatum (optional)", () => {
    expect(ApplyOnboardingSchema.safeParse(basis).success).toBe(true);
    expect(ApplyOnboardingSchema.safeParse({ ...basis, geburtsdatum: null }).success).toBe(true);
  });
  it("akzeptiert ein plausibles Geburtsdatum", () => {
    expect(ApplyOnboardingSchema.safeParse({ ...basis, geburtsdatum: "2008-05-14" }).success).toBe(true);
  });
  it("lehnt Verarsch-Datum trotz korrektem Format ab", () => {
    expect(ApplyOnboardingSchema.safeParse({ ...basis, geburtsdatum: "9999-12-31" }).success).toBe(false);
    expect(ApplyOnboardingSchema.safeParse({ ...basis, geburtsdatum: "2026-02-30" }).success).toBe(false);
  });
  it("lehnt unbekannte Land-Codes ab", () => {
    expect(ApplyOnboardingSchema.safeParse({ ...basis, land: "de" }).success).toBe(true);
    expect(ApplyOnboardingSchema.safeParse({ ...basis, land: "hackerland" }).success).toBe(false);
  });
  it("lehnt Klasse ausserhalb 5–13 ab", () => {
    expect(ApplyOnboardingSchema.safeParse({ ...basis, klasse: 99 }).success).toBe(false);
    expect(ApplyOnboardingSchema.safeParse({ ...basis, klasse: 0 }).success).toBe(false);
  });
});

describe("AddKlausurSchema", () => {
  it("akzeptiert Titel + ISO-Datum", () => {
    expect(AddKlausurSchema.safeParse({ titel: "Mathe LK", datum: "2026-09-01" }).success).toBe(true);
  });
  it("lehnt leeren Titel und kaputtes Datum ab", () => {
    expect(AddKlausurSchema.safeParse({ titel: "  ", datum: "2026-09-01" }).success).toBe(false);
    expect(AddKlausurSchema.safeParse({ titel: "Test", datum: "01.09.2026" }).success).toBe(false);
  });
});
