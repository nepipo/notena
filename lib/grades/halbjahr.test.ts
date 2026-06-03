import { describe, it, expect } from "vitest";
import { aktuellesHalbjahr } from "./halbjahr";

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
