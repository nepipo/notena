import type { PlanIntervall } from "./plan";

/** Nur die Felder, die wir aus dem LemonSqueezy-Payload brauchen. */
export type LsWebhookPayload = {
  meta: {
    event_name: string;
    custom_data?: { user_id?: string };
  };
  data: {
    id: string;
    attributes: {
      status: string;
      customer_id: number;
      variant_name: string;
      renews_at: string | null;
      ends_at: string | null;
      trial_ends_at: string | null;
    };
  };
};

export type ProfilUpdate = {
  plan_tier: "free" | "pro";
  plan_status: "trial" | "active" | "cancelled" | "expired";
  plan_intervall: PlanIntervall;
  plan_bis: string | null;
  trial_genutzt?: boolean;
  ls_customer_id: string;
  ls_subscription_id: string;
};

export type ProfilUpdateResult = { userId: string; update: ProfilUpdate };

function variantZuIntervall(variantName: string): PlanIntervall {
  const v = variantName.toLowerCase();
  if (v.includes("woche")) return "woche";
  if (v.includes("jahr")) return "jahr";
  return "monat";
}

/**
 * Reine Abbildung: LemonSqueezy-Event → gewünschter Profil-Zustand.
 * Gibt null zurück, wenn das Event ignoriert werden soll oder die user_id fehlt.
 */
export function berechneProfilUpdate(
  payload: LsWebhookPayload,
): ProfilUpdateResult | null {
  const userId = payload.meta.custom_data?.user_id;
  if (!userId) return null;

  const a = payload.data.attributes;
  const basis = {
    plan_intervall: variantZuIntervall(a.variant_name),
    ls_customer_id: String(a.customer_id),
    ls_subscription_id: payload.data.id,
  };

  switch (payload.meta.event_name) {
    case "subscription_created":
      return {
        userId,
        update: {
          ...basis,
          plan_tier: "pro",
          plan_status: a.status === "on_trial" ? "trial" : "active",
          plan_bis: a.trial_ends_at ?? a.renews_at,
          trial_genutzt: true,
        },
      };
    case "subscription_payment_success":
    case "subscription_resumed":
    case "subscription_unpaused":
      return {
        userId,
        update: {
          ...basis,
          plan_tier: "pro",
          plan_status: "active",
          plan_bis: a.renews_at,
        },
      };
    case "subscription_cancelled":
      return {
        userId,
        update: {
          ...basis,
          plan_tier: "pro", // bleibt Pro bis Periodenende
          plan_status: "cancelled",
          plan_bis: a.ends_at ?? a.renews_at,
        },
      };
    case "subscription_expired":
      return {
        userId,
        update: {
          ...basis,
          plan_tier: "free",
          plan_status: "expired",
          plan_bis: a.ends_at,
        },
      };
    default:
      return null;
  }
}
