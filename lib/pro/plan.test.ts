import { describe, it, expect } from "vitest";
import { istPro, type PlanProfil } from "./plan";

const basis: PlanProfil = {
  plan_tier: "free",
  plan_bis: null,
};

describe("istPro", () => {
  it("free ohne plan_bis ist nicht Pro", () => {
    expect(istPro(basis)).toBe(false);
  });

  it("pro mit plan_bis in der Zukunft ist Pro", () => {
    const morgen = new Date(Date.now() + 86_400_000).toISOString();
    expect(istPro({ plan_tier: "pro", plan_bis: morgen })).toBe(true);
  });

  it("pro mit abgelaufenem plan_bis ist nicht Pro", () => {
    const gestern = new Date(Date.now() - 86_400_000).toISOString();
    expect(istPro({ plan_tier: "pro", plan_bis: gestern })).toBe(false);
  });

  it("pro ohne plan_bis ist nicht Pro (defensiv)", () => {
    expect(istPro({ plan_tier: "pro", plan_bis: null })).toBe(false);
  });

  it("null-Profil ist nicht Pro", () => {
    expect(istPro(null)).toBe(false);
  });
});
