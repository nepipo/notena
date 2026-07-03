import { describe, it, expect } from "vitest";
import { berechneProfilUpdate, type LsWebhookPayload } from "./webhook";

function payload(
  eventName: string,
  attrs: Partial<LsWebhookPayload["data"]["attributes"]> = {},
): LsWebhookPayload {
  return {
    meta: { event_name: eventName, custom_data: { user_id: "u1" } },
    data: {
      id: "sub_1",
      attributes: {
        status: "active",
        customer_id: 42,
        variant_name: "Monat",
        renews_at: "2026-07-18T00:00:00Z",
        ends_at: null,
        trial_ends_at: null,
        ...attrs,
      },
    },
  };
}

describe("berechneProfilUpdate", () => {
  it("subscription_created (Trial) → pro/trial bis trial_ends_at", () => {
    const u = berechneProfilUpdate(
      payload("subscription_created", {
        status: "on_trial",
        trial_ends_at: "2026-06-25T00:00:00Z",
      }),
    );
    expect(u).toEqual({
      userId: "u1",
      update: {
        plan_tier: "pro",
        plan_status: "trial",
        plan_intervall: "monat",
        plan_bis: "2026-06-25T00:00:00Z",
        trial_genutzt: true,
        ls_customer_id: "42",
        ls_subscription_id: "sub_1",
      },
    });
  });

  it("subscription_payment_success → active bis renews_at", () => {
    const u = berechneProfilUpdate(payload("subscription_payment_success"));
    expect(u?.update.plan_tier).toBe("pro");
    expect(u?.update.plan_status).toBe("active");
    expect(u?.update.plan_bis).toBe("2026-07-18T00:00:00Z");
  });

  it("subscription_cancelled → status cancelled, plan_bis = ends_at (Periodenende)", () => {
    const u = berechneProfilUpdate(
      payload("subscription_cancelled", {
        status: "cancelled",
        ends_at: "2026-07-18T00:00:00Z",
      }),
    );
    expect(u?.update.plan_status).toBe("cancelled");
    expect(u?.update.plan_tier).toBe("pro"); // bleibt Pro bis Periodenende
    expect(u?.update.plan_bis).toBe("2026-07-18T00:00:00Z");
  });

  it("subscription_expired → zurück auf free", () => {
    const u = berechneProfilUpdate(
      payload("subscription_expired", { status: "expired" }),
    );
    expect(u?.update.plan_tier).toBe("free");
    expect(u?.update.plan_status).toBe("expired");
  });

  it("unbekanntes Event → null (ignorieren)", () => {
    expect(berechneProfilUpdate(payload("order_refunded"))).toBeNull();
  });

  it("fehlende user_id → null", () => {
    const p = payload("subscription_created");
    p.meta.custom_data = {} as never;
    expect(berechneProfilUpdate(p)).toBeNull();
  });

  it("Variant-Name 'Jahr' → intervall jahr", () => {
    const u = berechneProfilUpdate(payload("subscription_payment_success", { variant_name: "Jahr" }));
    expect(u?.update.plan_intervall).toBe("jahr");
  });
});
