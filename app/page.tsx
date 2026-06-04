import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Calculator, CalendarDays, Sparkles } from "lucide-react";

const FEATURES = [
  {
    icon: Calculator,
    title: "Notenrechner",
    desc: "0–15 Punkte, alle Fächer, Halbjahres-Schnitt live.",
  },
  {
    icon: CalendarDays,
    title: "Klausur-Countdown",
    desc: "Sieh auf einen Blick wann die nächste kommt.",
  },
  {
    icon: Sparkles,
    title: "What-If Rechner",
    desc: "Spiel durch was du für deinen Ziel-Schnitt brauchst.",
  },
];

const STATS = [
  { label: "Schnitt", value: "12,4", color: "text-brand" },
  { label: "Klausuren", value: "3", color: "text-foreground" },
  { label: "Fächer", value: "6", color: "text-indigo" },
];

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims) redirect("/dashboard");

  return (
    <main className="relative z-[5] mx-auto flex min-h-screen w-full max-w-[680px] flex-col items-center justify-center px-5 py-16 text-center sm:px-8">

      {/* Eyebrow */}
      <div className="animate-fade-up mb-5 flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-brand">
        <span className="inline-block size-1.5 animate-[pulse-dot_2s_ease-in-out_infinite] rounded-full bg-success" />
        Project X · Beta
      </div>

      {/* Headline */}
      <h1
        className="animate-fade-up font-display text-5xl font-extrabold leading-[0.95] tracking-[-0.03em] sm:text-6xl"
        style={{ animationDelay: "0.05s" }}
      >
        Dein Schul-Cockpit.
      </h1>
      <p
        className="animate-fade-up mt-4 max-w-md text-base text-text-dim"
        style={{ animationDelay: "0.1s" }}
      >
        Notenrechner, Klausuren-Countdown und Halbjahres-Überblick — gebaut von
        einem Schüler für ambitionierte Oberstufen-Schüler.
      </p>

      {/* CTAs */}
      <div
        className="animate-fade-up mt-7 flex w-full max-w-xs flex-col gap-3"
        style={{ animationDelay: "0.15s" }}
      >
        <Button
          render={<Link href="/signup" />}
          className="w-full font-display text-base font-extrabold"
        >
          Kostenlos starten
        </Button>
        <Button
          render={<Link href="/login" />}
          variant="outline"
          className="w-full border-border bg-surface-2 font-sans hover:bg-surface-3"
        >
          Ich habe schon einen Account
        </Button>
      </div>

      {/* Dashboard-Preview */}
      <section
        className="animate-fade-up lift relative mt-10 w-full overflow-hidden rounded-[24px] border-2 p-6"
        style={{
          background: "var(--hero-grad)",
          borderColor: "color-mix(in srgb, var(--brand) 25%, transparent)",
          animationDelay: "0.2s",
        }}
      >
        <div
          className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full opacity-40"
          style={{ background: "radial-gradient(circle, var(--brand) 0%, transparent 65%)" }}
        />
        <div className="relative z-[2]">
          <p className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-widest text-text-mute">
            Live-Vorschau
          </p>
          <div className="grid grid-cols-3 gap-3">
            {STATS.map(({ label, value, color }) => (
              <div
                key={label}
                className="rounded-xl border p-4"
                style={{
                  background: "var(--surface-2)",
                  borderColor: "color-mix(in srgb, var(--brand) 15%, transparent)",
                }}
              >
                <div className={`font-display text-2xl font-extrabold ${color}`}>
                  {value}
                </div>
                <div className="mt-0.5 font-mono text-[10px] text-text-mute">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <div
        className="animate-fade-up mt-8 w-full"
        style={{ animationDelay: "0.25s" }}
      >
        <div className="flex flex-col divide-y divide-border/40">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-center gap-4 py-4 text-left">
              <div
                className="flex size-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: "color-mix(in srgb, var(--brand) 12%, transparent)" }}
              >
                <Icon className="size-5 text-brand" />
              </div>
              <div>
                <div className="font-display text-sm font-bold">{title}</div>
                <div className="text-sm text-text-dim">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </main>
  );
}
