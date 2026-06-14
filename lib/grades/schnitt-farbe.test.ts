import { describe, it, expect } from "vitest";
import { schnittFarbe } from "./schnitt-farbe";
import { DE_0_15, AT_1_5 } from "./systems";

describe("schnittFarbe", () => {
  it("null -> dim", () => {
    expect(schnittFarbe(null)).toBe("var(--text-dim)");
  });
  it("DE default unverändert", () => {
    expect(schnittFarbe(11)).toBe("var(--success)");
    expect(schnittFarbe(3)).toBe("var(--destructive)");
  });
  it("system-aware (AT invertiert)", () => {
    expect(schnittFarbe(1.5, AT_1_5)).toBe("var(--success)");
    expect(schnittFarbe(5, AT_1_5)).toBe("var(--destructive)");
    expect(schnittFarbe(11, DE_0_15)).toBe("var(--success)");
  });
});
