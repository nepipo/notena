import { describe, it, expect } from "vitest";
import {
  aktuellesHalbjahr,
  halbjahrLabel,
  naechstesHalbjahr,
  vorherigesHalbjahr,
  baueHalbjahr,
} from "./halbjahr";

describe("aktuellesHalbjahr", () => {
  it("Juni 2026 -> 2025/26-2", () => {
    expect(aktuellesHalbjahr(new Date("2026-06-02"))).toBe("2025/26-2");
  });
  it("September 2026 -> 2026/27-1", () => {
    expect(aktuellesHalbjahr(new Date("2026-09-15"))).toBe("2026/27-1");
  });
  it("Januar 2026 -> 2025/26-1", () => {
    expect(aktuellesHalbjahr(new Date("2026-01-10"))).toBe("2025/26-1");
  });
});

describe("halbjahrLabel", () => {
  it("formatiert HJ-2 lesbar", () => {
    expect(halbjahrLabel("2025/26-2")).toBe("2. Halbjahr · 2025/26");
  });
  it("formatiert HJ-1 lesbar", () => {
    expect(halbjahrLabel("2026/27-1")).toBe("1. Halbjahr · 2026/27");
  });
  it("gibt ungültigen Input unverändert zurück", () => {
    expect(halbjahrLabel("quatsch")).toBe("quatsch");
  });
});

describe("naechstesHalbjahr", () => {
  it("HJ-1 -> HJ-2 im selben Schuljahr", () => {
    expect(naechstesHalbjahr("2025/26-1")).toBe("2025/26-2");
  });
  it("HJ-2 -> HJ-1 im nächsten Schuljahr", () => {
    expect(naechstesHalbjahr("2025/26-2")).toBe("2026/27-1");
  });
  it("Jahrhundertwechsel korrekt (2099/00-2 -> 2100/01-1)", () => {
    expect(naechstesHalbjahr("2099/00-2")).toBe("2100/01-1");
  });
});

describe("vorherigesHalbjahr", () => {
  it("HJ-2 -> HJ-1 im selben Schuljahr", () => {
    expect(vorherigesHalbjahr("2025/26-2")).toBe("2025/26-1");
  });
  it("HJ-1 -> HJ-2 im vorherigen Schuljahr", () => {
    expect(vorherigesHalbjahr("2026/27-1")).toBe("2025/26-2");
  });
  it("ist invers zu naechstesHalbjahr", () => {
    expect(vorherigesHalbjahr(naechstesHalbjahr("2025/26-1"))).toBe("2025/26-1");
    expect(vorherigesHalbjahr(naechstesHalbjahr("2025/26-2"))).toBe("2025/26-2");
  });
});

describe("baueHalbjahr", () => {
  it("baut den String aus Startjahr und Nummer", () => {
    expect(baueHalbjahr(2025, 2)).toBe("2025/26-2");
    expect(baueHalbjahr(2026, 1)).toBe("2026/27-1");
  });
  it("padded das Kurzjahr (2099 -> 00)", () => {
    expect(baueHalbjahr(2099, 1)).toBe("2099/00-1");
  });
});
