import { Button } from "@/components/ui/button";
import { AnimatedNumber } from "@/components/animated-number";

const sparks = [40, 50, 45, 55, 60, 65, 70, 75, 72, 80, 85, 88];

export default function Home() {
  return (
    <main className="relative z-[5] mx-auto w-full max-w-[1100px] px-5 py-10 sm:px-8">
      {/* Header */}
      <header className="animate-fade-up mb-8 flex items-start justify-between">
        <div>
          <div className="mb-1.5 flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-brand">
            <span className="inline-block size-1.5 animate-[pulse-dot_2s_ease-in-out_infinite] rounded-full bg-success" />
            Project X · Beta
          </div>
          <h1 className="text-4xl font-extrabold leading-none sm:text-5xl">
            Hey Nepomuk.
          </h1>
          <p className="mt-2 text-sm text-text-dim">
            Dein Schul-Cockpit. Notenrechner, Klausuren, KI-Briefing.
          </p>
        </div>
        <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand-2 font-display text-sm font-extrabold text-white shadow-[0_12px_32px_color-mix(in_srgb,var(--brand)_55%,transparent)]">
          NP
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* Hero — Schnitt */}
        <section
          className="lift animate-fade-up relative overflow-hidden rounded-[28px] border-2 p-8"
          style={{
            background: "var(--hero-grad)",
            borderColor: "color-mix(in srgb, var(--brand) 30%, transparent)",
            animationDelay: "0.1s",
          }}
        >
          <div
            className="pointer-events-none absolute -right-24 -top-28 size-80 rounded-full opacity-50"
            style={{
              background: "radial-gradient(circle, var(--brand) 0%, transparent 65%)",
            }}
          />
          <div className="relative z-[2]">
            <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-brand">
              Schnitt · 2. HJ 25/26
            </div>
            <div className="mt-3 flex items-end">
              <AnimatedNumber
                value={10.2}
                decimals={1}
                className="font-display text-[120px] font-extrabold leading-[0.85] tracking-[-0.06em]"
                style={{
                  background: "var(--num-grad)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              />
              <span className="mb-3 ml-1 text-3xl font-medium text-text-mute">/15</span>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/15 px-3 py-1.5 font-mono text-[11px] font-semibold text-success">
                ↑ 0,4
              </span>
              <span className="text-sm text-text-dim">Top 18% deiner Stufe</span>
            </div>
            {/* Sparkline */}
            <div className="mt-6 flex h-14 items-end gap-1.5">
              {sparks.map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-[3px]"
                  style={{
                    height: `${h}%`,
                    background:
                      "linear-gradient(180deg, var(--brand) 0%, color-mix(in srgb, var(--brand) 20%, transparent) 100%)",
                    boxShadow: "0 0 12px color-mix(in srgb, var(--brand) 40%, transparent)",
                    animation: "spark-grow 1.2s ease-out both",
                    animationDelay: `${0.6 + i * 0.05}s`,
                  }}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Rechte Spalte */}
        <div className="grid gap-4">
          {/* Nächste Klausur */}
          <section
            className="lift animate-fade-up relative overflow-hidden rounded-3xl border-2 p-6"
            style={{
              background:
                "linear-gradient(135deg, color-mix(in srgb, var(--destructive) 22%, var(--surface-2)) 0%, color-mix(in srgb, var(--destructive) 10%, var(--surface-1)) 100%)",
              borderColor: "color-mix(in srgb, var(--destructive) 42%, transparent)",
              animationDelay: "0.2s",
            }}
          >
            <div className="flex items-center gap-4">
              <div className="flex size-16 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-destructive to-[#b8132e] text-white">
                <span className="font-display text-2xl font-extrabold leading-none">2</span>
                <span className="mt-0.5 font-mono text-[8px] tracking-[0.2em] text-white/70">TAGE</span>
              </div>
              <div>
                <div className="font-display text-lg font-bold">Mathe-Klausur</div>
                <div className="mt-0.5 font-mono text-xs tracking-wide text-destructive">
                  Freitag 09:45 · Vorbereitung 40%
                </div>
              </div>
            </div>
          </section>

          {/* Stat-Card */}
          <section
            className="lift animate-fade-up rounded-3xl border border-border p-6"
            style={{ background: "var(--card-grad)", animationDelay: "0.3s" }}
          >
            <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-text-dim">
              Diese Woche
            </div>
            <div className="mt-3 font-display text-4xl font-extrabold tracking-[-0.03em]">
              3 Klausuren
            </div>
            <div className="mt-1 font-mono text-xs text-text-dim">Mathe · Deutsch · Bio</div>
          </section>
        </div>
      </div>

      {/* CTA */}
      <div
        className="animate-fade-up mt-8 flex flex-wrap items-center gap-3"
        style={{ animationDelay: "0.4s" }}
      >
        <Button size="lg" className="font-display font-bold">
          Los geht&apos;s
        </Button>
        <span className="font-mono text-xs text-text-mute">
          Theme-Showcase · Coral / Indigo · Dark Default
        </span>
      </div>
    </main>
  );
}
