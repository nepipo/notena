import type { PlanIntervall } from "./plan";

const VARIANT_ENV: Record<PlanIntervall, string> = {
  woche: "LEMONSQUEEZY_VARIANT_WOCHE",
  monat: "LEMONSQUEEZY_VARIANT_MONAT",
  jahr: "LEMONSQUEEZY_VARIANT_JAHR",
};

/**
 * Baut eine LemonSqueezy-Hosted-Checkout-URL für ein Intervall.
 * user_id wird als custom_data mitgegeben → kommt im Webhook zurück.
 * Nur server-seitig aufrufen (liest Server-Env).
 */
export function checkoutUrl(intervall: PlanIntervall, userId: string): string {
  const sub = process.env.LEMONSQUEEZY_STORE_SUBDOMAIN;
  const variant = process.env[VARIANT_ENV[intervall]];
  if (!sub || !variant) {
    throw new Error(`Checkout-Konfiguration fehlt für Intervall '${intervall}'.`);
  }
  const u = new URL(`https://${sub}.lemonsqueezy.com/buy/${variant}`);
  u.searchParams.set("checkout[custom][user_id]", userId);
  return u.toString();
}
