import { describe, it, expect } from "vitest";
import { schnittFarbe } from "./schnitt-farbe";

describe("schnittFarbe", () => {
  it("gibt text-dim zurück bei null", () => {
    expect(schnittFarbe(null)).toBe("var(--text-dim)");
  });
  it("gibt success bei >= 10", () => {
    expect(schnittFarbe(10)).toBe("var(--success)");
    expect(schnittFarbe(14.5)).toBe("var(--success)");
  });
  it("gibt amber bei 7-9.9", () => {
    expect(schnittFarbe(7)).toBe("#f59e0b");
    expect(schnittFarbe(9.9)).toBe("#f59e0b");
  });
  it("gibt destructive bei < 7", () => {
    expect(schnittFarbe(6.9)).toBe("var(--destructive)");
    expect(schnittFarbe(0)).toBe("var(--destructive)");
  });
});
