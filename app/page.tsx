import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { LandingCounter } from "@/components/landing-counter";
import { Calculator, CalendarDays, Sparkles, Zap, Target, Brain } from "lucide-react";

const FAECHER = [
  { fach: "Mathe LK", punkte: 13, color: "var(--brand)" },
  { fach: "Englisch", punkte: 11, color: "var(--foreground)" },
  { fach: "Physik", punkte: 12, color: "var(--indigo)" },
];

const SCHRITTE = [
  {
    nr: "01",
    icon: Calculator,
    label: "Noten eintragen",
    desc: "Fächer anlegen, Punkte eintragen — fertig. Keine Tabelle, kein Excel, kein Chaos.",
  },
  {
    nr: "02",
    icon: Target,
    label: "Schnitt live sehen",
    desc: "Dein Halbjahres- und Jahresschnitt wird sofort berechnet. Du siehst genau wo du stehst.",
  },
  {
    nr: "03",
    icon: Sparkles,
    label: "Was-wäre-wenn",
    desc: "Trag eine fiktive Note ein und sieh wie sie deinen Schnitt verschiebt. Klausur-Planung, endlich smart.",
  },
];

const FEATURES = [
  { icon: Calculator, label: "Notenrechner", desc: "0–15 Punkte, alle Fächer, beide Halbjahre." },
  { icon: CalendarDays, label: "Klausur-Countdown", desc: "Nächste Klausur immer im Blick." },
  { icon: Brain, label: "KI-Briefing", desc: "Jeden Tag ein kurzes Briefing — was ansteht, wo du stehst." },
  { icon: Zap, label: "What-If", desc: "Ziel-Schnitt eingeben, Rechner zeigt was fehlt." },
];

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims) redirect("/dashboard");

  return (
    <main className="relative z-[5] mx-auto w-full max-w-[640px] px-5 py-16 sm:px-8">

      {/* Animated glow blobs */}
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 size-[500px] rounded-full opacity-[0.12] blur-[80px]"
          style={{
            background: "radial-gradient(circle, var(--brand) 0%, transparent 70%)",
            animation: "glow-drift 8s ease-in-out infinite alternate",
          }}
        />
        <div
          className="absolute bottom-0 right-[-100px] size-[350px] rounded-full opacity-[0.08] blur-[80px]"
          style={{
            background: "radial-gradient(circle, var(--indigo) 0%, transparent 70%)",
            animation: "glow-drift 11s ease-in-out infinite alternate-reverse",
          }}
        />
      </div>

      <style>{`
        @keyframes glow-drift {
          from { transform: translateX(-50%) translateY(0px); }
          to   { transform: translateX(-50%) translateY(40px); }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .anim { opacity: 0; animation: fade-up 0.6s ease forwards; }
      `}</style>

      {/* ── HERO ──────────────────────────────────────────── */}
      <div className="flex flex-col items-center text-center">
        {/* Eyebrow */}
        <div
          className="anim mb-6 flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.3em] text-brand"
          style={{ animationDelay: "0ms" }}
        >
          <span className="inline-block size-1.5 animate-pulse rounded-full bg-success" />
          Project X · Geschlossene Beta
        </div>

        {/* Big number */}
        <div className="anim" style={{ animationDelay: "80ms" }}>
          <div
            className="font-display font-black leading-none tracking-[-6px]"
            style={{ fontSize: "clamp(96px, 22vw, 144px)" }}
          >
            <LandingCounter to={12.4} />
          </div>
          <div className="mt-2 font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-text-mute">
            Dein Schnitt · Live
          </div>
        </div>

        {/* Tagline */}
        <p
          className="anim mt-5 max-w-sm text-lg font-semibold leading-snug"
          style={{ animationDelay: "200ms" }}
        >
          Kein Raten mehr. Trag deine Noten ein — sieh sofort wo du stehst.
        </p>
        <p
          className="anim mt-2 max-w-xs text-sm text-text-dim"
          style={{ animationDelay: "260ms" }}
        >
          Gebaut von einem Hamburger Schüler. Für ambitionierte Oberstufen-Schüler.
        </p>

        {/* CTAs */}
        <div
          className="anim mt-8 flex w-full max-w-xs flex-col gap-3"
          style={{ animationDelay: "320ms" }}
        >
          <Button render={<Link href="/signup" />} className="w-full font-display text-base font-extrabold">
            Kostenlos starten →
          </Button>
          <Button
            render={<Link href="/login" />}
            variant="outline"
            className="w-full border-border bg-surface-2 font-sans hover:bg-surface-3"
          >
            Ich habe schon einen Account
          </Button>
        </div>

        {/* Fach cards */}
        <div
          className="anim mt-10 grid w-full grid-cols-3 gap-3"
          style={{ animationDelay: "400ms" }}
        >
          {FAECHER.map(({ fach, punkte, color }) => (
            <div
              key={fach}
              className="group relative overflow-hidden rounded-2xl border p-4 text-left transition-transform duration-200 hover:-translate-y-1"
              style={{
                background: "var(--surface-2)",
                borderColor: "color-mix(in srgb, var(--brand) 15%, transparent)",
              }}
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                  background:
                    "radial-gradient(circle at 50% 0%, color-mix(in srgb, var(--brand) 8%, transparent), transparent 70%)",
                }}
              />
              <div className="font-mono text-[9px] font-semibold uppercase tracking-widest text-text-mute">
                {fach}
              </div>
              <div className="mt-1 font-display text-3xl font-black leading-none" style={{ color }}>
                {punkte}
              </div>
              <div className="mt-1 font-mono text-[9px] text-text-mute">Punkte</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SO FUNKTIONIERT'S ─────────────────────────────── */}
      <div className="anim mt-16 w-full" style={{ animationDelay: "480ms" }}>
        <div className="mb-6 text-center">
          <div className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.3em] text-brand">
            Wie es funktioniert
          </div>
          <h2 className="font-display text-2xl font-extrabold leading-tight">
            In 60 Sekunden einsatzbereit.
          </h2>
        </div>

        <div className="flex flex-col gap-3">
          {SCHRITTE.map(({ nr, icon: Icon, label, desc }) => (
            <div
              key={nr}
              className="group flex gap-4 rounded-2xl border border-border p-5 text-left transition-all duration-200 hover:border-brand/30"
              style={{ background: "var(--surface-2)" }}
            >
              <div className="flex shrink-0 flex-col items-center gap-2">
                <div
                  className="flex size-10 items-center justify-center rounded-xl"
                  style={{ background: "color-mix(in srgb, var(--brand) 12%, transparent)" }}
                >
                  <Icon className="size-4 text-brand" />
                </div>
                <span className="font-mono text-[10px] font-bold text-brand">{nr}</span>
              </div>
              <div className="pt-1">
                <div className="font-display text-base font-extrabold leading-tight">{label}</div>
                <div className="mt-1 text-sm leading-relaxed text-text-dim">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FÜR WEN? ──────────────────────────────────────── */}
      <div className="anim mt-16 w-full" style={{ animationDelay: "540ms" }}>
        <div
          className="relative overflow-hidden rounded-3xl border p-7"
          style={{
            background: "var(--surface-2)",
            borderColor: "color-mix(in srgb, var(--brand) 20%, transparent)",
          }}
        >
          <div
            className="pointer-events-none absolute -top-20 -right-20 size-[240px] rounded-full opacity-[0.07] blur-[60px]"
            style={{ background: "var(--brand)" }}
          />
          <div className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-brand">
            Für dich, wenn
          </div>
          <ul className="space-y-3">
            {[
              "du in der Oberstufe bist und deinen Schnitt wirklich kennst — nicht erst beim Zeugnis.",
              "du aufhören willst Excel-Tabellen und Zettel rumzuschleppen.",
              "du wissen willst was du in der nächsten Klausur brauchst, um deinen Ziel-Schnitt zu halten.",
              "du ein Werkzeug willst das für Schüler gebaut ist — nicht für irgendwelche 30-Jährigen.",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm">
                <span
                  className="mt-0.5 shrink-0 font-mono text-base font-bold leading-none text-brand"
                >
                  ✓
                </span>
                <span className="text-text-dim leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── FEATURE GRID ──────────────────────────────────── */}
      <div className="anim mt-16 w-full" style={{ animationDelay: "580ms" }}>
        <div className="mb-6 text-center">
          <div className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.3em] text-brand">
            Was du bekommst
          </div>
          <h2 className="font-display text-2xl font-extrabold">Alles drin. Nichts zu viel.</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {FEATURES.map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="group rounded-2xl border border-border p-5 text-left transition-all hover:border-brand/30"
              style={{ background: "var(--surface-2)" }}
            >
              <div
                className="mb-3 flex size-9 items-center justify-center rounded-xl"
                style={{ background: "color-mix(in srgb, var(--brand) 10%, transparent)" }}
              >
                <Icon className="size-4 text-brand" />
              </div>
              <div className="font-display text-sm font-extrabold">{label}</div>
              <div className="mt-1 text-xs leading-relaxed text-text-dim">{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── BETA CTA ──────────────────────────────────────── */}
      <div className="anim mt-16 w-full" style={{ animationDelay: "620ms" }}>
        <div
          className="relative overflow-hidden rounded-3xl border-2 p-8 text-center"
          style={{
            background: "linear-gradient(135deg, color-mix(in srgb, var(--brand) 8%, var(--surface-1)), color-mix(in srgb, var(--indigo) 6%, var(--surface-1)))",
            borderColor: "color-mix(in srgb, var(--brand) 30%, transparent)",
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(circle at 50% -20%, color-mix(in srgb, var(--brand) 15%, transparent), transparent 60%)",
            }}
          />
          <div className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.3em] text-brand">
            Geschlossene Beta · Kostenlos
          </div>
          <h2 className="font-display text-3xl font-extrabold leading-tight">
            Sei dabei, bevor<br />alle anderen starten.
          </h2>
          <p className="mx-auto mt-3 max-w-xs text-sm text-text-dim">
            Project X ist noch in der Beta. Kein Abo, keine Kreditkarte. Einfach ausprobieren.
          </p>
          <div className="mt-7 flex flex-col items-center gap-3">
            <Button
              render={<Link href="/signup" />}
              className="w-full max-w-xs font-display text-base font-extrabold"
            >
              Jetzt kostenlos starten →
            </Button>
            <span className="font-mono text-[11px] text-text-mute">
              Kein Abo, keine Kreditkarte — einfach loslegen
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        className="anim mt-12 flex items-center justify-center gap-5 font-mono text-[11px] text-text-mute"
        style={{ animationDelay: "660ms" }}
      >
        <Link href="/impressum" className="hover:text-text-dim transition-colors">
          Impressum
        </Link>
        <span className="text-border">·</span>
        <Link href="/datenschutz" className="hover:text-text-dim transition-colors">
          Datenschutz
        </Link>
      </div>

    </main>
  );
}
