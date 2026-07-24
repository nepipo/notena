import { createClient } from "@/lib/supabase/server";
import { checkoutUrl } from "@/lib/pro/checkout";
import { PREISE, INTERVALL_LABEL, type PlanIntervall } from "@/lib/pro/plan";
import { PRO_FEATURES } from "@/lib/pro/features";
import { CheckoutButton } from "@/components/pro/checkout-button";
import { TiltEffect } from "@/components/tilt-card";
import { cn } from "@/lib/utils";

function euro(cent: number): string {
  return (cent / 100).toFixed(2).replace(".", ",") + " €";
}

const INTERVALLE: PlanIntervall[] = ["woche", "monat", "jahr"];

export default async function ProPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub as string | undefined;

  if (!userId) {
    return <p className="p-6">Bitte einloggen, um Pro zu abonnieren.</p>;
  }

  return (
    // Eigener dunkler Kontext: aktiviert dunkles Glas unabhaengig vom App-Theme.
    <div className="dark relative isolate min-h-[calc(100vh-3.5rem)] overflow-hidden bg-black text-white">
      <TiltEffect />

      {/* Farbige Ambient-Glows — geben dem Glas Farbe & Kontrast */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-0">
        <div
          className="absolute left-1/2 top-[30%] h-[40rem] w-[55rem] -translate-x-1/2 rounded-full opacity-60 blur-[120px]"
          style={{
            background:
              "radial-gradient(ellipse, color-mix(in srgb, var(--brand) 45%, transparent) 0%, transparent 70%)",
          }}
        />
        <div className="absolute right-[8%] top-[42%] h-[26rem] w-[26rem] rounded-full bg-indigo-500/25 blur-[110px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-14 lg:py-20">
        {/* Header */}
        <div className="mx-auto max-w-xl text-center">
          <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium tracking-wide text-white/80 backdrop-blur-md">
            Notena Pro
          </span>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Alles freischalten.
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-balance text-sm text-white/55">
            7 Tage gratis testen, jederzeit kündbar.
          </p>
        </div>

        {/* Hero: Wortmark HINTER den Cards — scheint verschwommen durchs Glas */}
        <div className="relative mt-14 [perspective:1600px]">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-1/2 z-0 flex -translate-y-1/2 select-none justify-center font-display text-[34vw] font-extrabold leading-none tracking-tighter lg:text-[22rem]"
            style={{
              backgroundImage:
                "linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.28) 55%, rgba(255,255,255,0.05) 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Pro
          </span>

          {/* Drei 3D-Glas-Preiskacheln */}
          <div className="relative z-10 mx-auto grid max-w-4xl gap-5 sm:grid-cols-3">
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
                    "tilt-card pro-glass flex flex-col p-6",
                    hervorgehoben && "pro-glass-featured sm:-mt-4",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-medium uppercase tracking-wide text-white/60">
                      {INTERVALL_LABEL[iv]}
                    </h2>
                    {hervorgehoben && (
                      <span className="rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
                        Spar-Tipp
                      </span>
                    )}
                  </div>

                  <p className="mt-3 font-display text-4xl font-bold tracking-tight">
                    {euro(PREISE[iv])}
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-white/50">
                    danach {euro(PREISE[iv])} / {INTERVALL_LABEL[iv]}
                  </p>

                  <ul className="mt-5 space-y-2.5 text-sm">
                    {PRO_FEATURES.map((f) => (
                      <li key={f.label} className="flex items-start gap-2.5">
                        <span
                          className={cn(
                            "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px]",
                            f.bald
                              ? "bg-white/10 text-white/40"
                              : hervorgehoben
                                ? "bg-primary text-primary-foreground"
                                : "bg-white/15 text-white/90",
                          )}
                        >
                          ✓
                        </span>
                        <span className={cn(f.bald ? "text-white/45" : "text-white/75")}>
                          {f.label}
                          {f.bald && (
                            <span className="ml-1.5 rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/50">
                              bald
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 flex flex-1 items-end">
                    {url ? (
                      <div className="w-full">
                        <CheckoutButton
                          url={url}
                          label="Zahlungspflichtig abonnieren"
                        />
                      </div>
                    ) : (
                      <p className="text-xs text-white/40">
                        Checkout gerade nicht verfügbar.
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p className="mt-12 text-center text-xs text-white/45">
          Die Abrechnung erfolgt über Lemon Squeezy. Es gelten unsere{" "}
          <a href="/datenschutz" className="underline hover:text-white/80">
            Datenschutzerklärung
          </a>{" "}
          und das gesetzliche Widerrufsrecht.
        </p>
      </div>
    </div>
  );
}
