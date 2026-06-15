import { describe, it, expect } from "vitest";
import { schnittFarbe } from "./schnitt-farbe";
import { DE_0_15, AT_1_5 } from "./systems";

describe("schnittFarbe", () => {
  it("null -> dim", () => {
    expect(schnittFarbe(null)).toBe("var(--text-dim)");
  });
  it("DE default: hohe Punkte = gut", () => {
    expect(schnittFarbe(11)).toBe("var(--success)");
    expect(schnittFarbe(8)).toBe("#f59e0b");
    expect(schnittFarbe(3)).toBe("var(--destructive)");
  });
  it("kanonisch punktebasiert — für ALLE Systeme gleich (auch AT)", () => {
    // Schnitt ist immer in kanonischen 0–15 Punkten; hohe Punkte = gut,
    // unabhängig davon, wie das System die Zahl anzeigt.
    expect(schnittFarbe(11, AT_1_5)).toBe("var(--success)");
    expect(schnittFarbe(3, AT_1_5)).toBe("var(--destructive)");
    expect(schnittFarbe(11, DE_0_15)).toBe("var(--success)");
  });
});
