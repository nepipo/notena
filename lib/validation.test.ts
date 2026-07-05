import { describe, it, expect } from "vitest";
import {
  KategorieSchema,
  HalbjahrSchema,
  AddFachSchema,
  NoteInputSchema,
  AddKlausurSchema,
} from "./validation";

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

describe("AddKlausurSchema", () => {
  it("akzeptiert Titel + ISO-Datum", () => {
    expect(AddKlausurSchema.safeParse({ titel: "Mathe LK", datum: "2026-09-01" }).success).toBe(true);
  });
  it("lehnt leeren Titel und kaputtes Datum ab", () => {
    expect(AddKlausurSchema.safeParse({ titel: "  ", datum: "2026-09-01" }).success).toBe(false);
    expect(AddKlausurSchema.safeParse({ titel: "Test", datum: "01.09.2026" }).success).toBe(false);
  });
});
