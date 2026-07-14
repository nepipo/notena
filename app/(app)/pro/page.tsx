import { createClient } from "@/lib/supabase/server";
import { checkoutUrl } from "@/lib/pro/checkout";
import { PREISE, INTERVALL_LABEL, type PlanIntervall } from "@/lib/pro/plan";
import { CheckoutButton } from "@/components/pro/checkout-button";
import { cn } from "@/lib/utils";

function euro(cent: number): string {
  return (cent / 100).toFixed(2).replace(".", ",") + " €";
}

const INTERVALLE: PlanIntervall[] = ["woche", "monat", "jahr"];

const PRO_FEATURES = [
  "KI-Coach — Chat mit Claude über deine Noten & Ziele",
  "Tägliches KI-Briefing",
  "Trend-Analyse & Abi-Prognose",
  "Themes & Akzentfarben",
  "PDF-Report deiner Noten",
];

export default async function ProPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub as string | undefined;

  if (!userId) {
    return <p className="p-6">Bitte einloggen, um Pro zu abonnieren.</p>;
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="font-display text-2xl font-bold">Notena Pro</h1>
      <p className="mt-2 text-muted-foreground">
        KI-Coach, tägliches Briefing und mehr. 7 Tage gratis testen, jederzeit kündbar.
      </p>

      <ul className="mt-6 space-y-1.5 text-sm">
        {PRO_FEATURES.map((f) => (
          <li key={f} className="flex gap-2">
            <span className="text-primary">✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {INTERVALLE.map((iv) => {
          let url: string | null = null;
          try {
            url = checkoutUrl(iv, userId);
          } catch {
            // Env-Konfiguration fehlt (z.B. lokal) — Kachel ohne Kauf-Button zeigen
          }
          const hervorgehoben = iv === "jahr";
          return (
            <div
              key={iv}
              className={cn(
                "relative rounded-xl border p-5",
                hervorgehoben ? "border-primary" : "border-border",
              )}
            >
              {hervorgehoben && (
                <span className="absolute -top-2.5 left-5 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                  Spar-Tipp
                </span>
              )}
              <h2 className="font-semibold">{INTERVALL_LABEL[iv]}</h2>
              <p className="mt-1 text-2xl font-bold">{euro(PREISE[iv])}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                7 Tage gratis, danach {euro(PREISE[iv])}/{INTERVALL_LABEL[iv]},
                jederzeit kündbar.
              </p>
              <div className="mt-4">
                {url ? (
                  <CheckoutButton url={url} label="Zahlungspflichtig abonnieren" />
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Checkout gerade nicht verfügbar — bitte später erneut versuchen.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Die Abrechnung erfolgt über Lemon Squeezy. Es gelten unsere{" "}
        <a href="/datenschutz" className="underline">Datenschutzerklärung</a> und das
        gesetzliche Widerrufsrecht.
      </p>
    </div>
  );
}
