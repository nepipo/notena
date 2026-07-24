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
    // Eigener dunkler Kontext: aktiviert `.dark .glass-panel` unabhaengig vom App-Theme.
    <div className="dark relative isolate min-h-[calc(100vh-3.5rem)] overflow-hidden bg-[#0b0b0c] text-foreground">
      {/* Ambientes Licht oben */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full opacity-60 blur-[120px]"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--brand) 45%, transparent) 0%, transparent 70%)",
        }}
      />

      {/* Riesiges Wortmark im Hintergrund — scheint verschwommen durchs Glas */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-[16%] z-0 flex justify-center select-none"
      >
        <span className="font-display text-[26vw] font-extrabold leading-none tracking-tighter text-white/[0.06] sm:text-[20vw] lg:text-[16rem]">
          Pro
        </span>
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-6 py-16 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium tracking-wide text-white/70 backdrop-blur">
            Notena Pro
          </span>
          <h1 className="mt-5 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Alles freischalten.
          </h1>
          <p className="mx-auto mt-3 max-w-md text-balance text-muted-foreground">
            KI-Coach, tägliches Briefing und mehr. 7 Tage gratis testen,
            jederzeit kündbar.
          </p>

          <ul className="mx-auto mt-7 grid max-w-md gap-2 text-left text-sm sm:grid-cols-2">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[10px] text-primary">
                  ✓
                </span>
                <span className="text-foreground/80">{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Drei Glas-Preiskacheln — Woche / Monat / Jahr, gleiche Features, andere Abrechnung */}
        <div className="mt-14 grid gap-5 sm:grid-cols-3">
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
                  "glass-panel lift relative flex flex-col p-6",
                  hervorgehoben &&
                    "sm:-translate-y-3 sm:shadow-[0_32px_80px_rgba(0,0,0,0.6)] ring-1 ring-primary/40",
                )}
              >
                {hervorgehoben && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-lg">
                    Spar-Tipp
                  </span>
                )}
                <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                  {INTERVALL_LABEL[iv]}
                </h2>
                <p className="mt-2 font-display text-4xl font-bold tracking-tight">
                  {euro(PREISE[iv])}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  7 Tage gratis, danach {euro(PREISE[iv])} pro{" "}
                  {INTERVALL_LABEL[iv]}, jederzeit kündbar.
                </p>
                <div className="mt-6 flex-1 flex items-end">
                  {url ? (
                    <div className="w-full">
                      <CheckoutButton
                        url={url}
                        label="Zahlungspflichtig abonnieren"
                      />
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Checkout gerade nicht verfügbar — bitte später erneut
                      versuchen.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          Die Abrechnung erfolgt über Lemon Squeezy. Es gelten unsere{" "}
          <a href="/datenschutz" className="underline hover:text-foreground">
            Datenschutzerklärung
          </a>{" "}
          und das gesetzliche Widerrufsrecht.
        </p>
      </div>
    </div>
  );
}
