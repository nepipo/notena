// lib/warteliste/logic.test.ts
import { describe, it, expect } from "vitest";
import {
  normalisiereEmail,
  normalisiereCode,
  WartelisteEmailSchema,
  darfMailSenden,
  MAIL_THROTTLE_MS,
} from "./logic";

describe("normalisiereEmail", () => {
  it("trimmt und lowercased", () => {
    expect(normalisiereEmail("  Max@Beispiel.DE ")).toBe("max@beispiel.de");
  });
});

describe("normalisiereCode", () => {
  it("trimmt und uppercased", () => {
    expect(normalisiereCode("  hochrad26 ")).toBe("HOCHRAD26");
  });
});

describe("WartelisteEmailSchema", () => {
  it("akzeptiert gültige E-Mail", () => {
    expect(WartelisteEmailSchema.safeParse("max@beispiel.de").success).toBe(true);
  });
  it("lehnt Müll ab", () => {
    expect(WartelisteEmailSchema.safeParse("keine-email").success).toBe(false);
    expect(WartelisteEmailSchema.safeParse("").success).toBe(false);
  });
  it("lehnt überlange E-Mail ab", () => {
    expect(WartelisteEmailSchema.safeParse("a".repeat(250) + "@x.de").success).toBe(false);
  });
});

describe("darfMailSenden", () => {
  const jetzt = new Date("2026-07-05T12:00:00Z");

  it("true, wenn noch nie eine Mail rausging", () => {
    expect(darfMailSenden(null, jetzt)).toBe(true);
  });
  it("false, wenn letzte Mail vor 5 Minuten", () => {
    expect(darfMailSenden("2026-07-05T11:55:00Z", jetzt)).toBe(false);
  });
  it("true, wenn letzte Mail vor 15 Minuten", () => {
    expect(darfMailSenden("2026-07-05T11:45:00Z", jetzt)).toBe(true);
  });
  it("true, exakt an der Throttle-Grenze", () => {
    const grenze = new Date(jetzt.getTime() - MAIL_THROTTLE_MS).toISOString();
    expect(darfMailSenden(grenze, jetzt)).toBe(true);
  });
});
