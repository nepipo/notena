import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export default async function Home() {
  // Eingeloggte direkt ins Dashboard — die Startseite ist nur für Gäste.
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims) redirect("/dashboard");

  return (
    <main className="relative z-[5] mx-auto flex min-h-screen w-full max-w-[760px] flex-col items-center justify-center px-5 py-12 text-center sm:px-8">
      {/* Eyebrow */}
      <div className="animate-fade-up mb-4 flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-brand">
        <span className="inline-block size-1.5 animate-[pulse-dot_2s_ease-in-out_infinite] rounded-full bg-success" />
        Project X · Beta
      </div>

      {/* Hero-Titel */}
      <h1 className="animate-fade-up text-5xl font-extrabold leading-[0.95] tracking-[-0.03em] sm:text-6xl" style={{ animationDelay: "0.05s" }}>
        Dein Schul-Cockpit.
      </h1>
      <p className="animate-fade-up mt-4 max-w-md text-base text-text-dim" style={{ animationDelay: "0.1s" }}>
        Notenrechner, Klausuren-Countdown und Halbjahres-Überblick — gebaut für
        ambitionierte Oberstufen-Schüler. Trag deine Noten ein, sieh deinen
        Schnitt live, spiel durch was du brauchst.
      </p>

      {/* Glow-Karte mit CTA */}
      <section
        className="animate-fade-up lift relative mt-10 w-full max-w-sm overflow-hidden rounded-[28px] border-2 p-8"
        style={{
          background: "var(--hero-grad)",
          borderColor: "color-mix(in srgb, var(--brand) 30%, transparent)",
          animationDelay: "0.15s",
        }}
      >
        <div
          className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full opacity-50"
          style={{ background: "radial-gradient(circle, var(--brand) 0%, transparent 65%)" }}
        />
        <div className="relative z-[2] flex flex-col gap-3">
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
      </section>

      {/* Demo-Link (ohne Anmeldung) */}
      <Link
        href="/demo/notenrechner"
        className="animate-fade-up mt-6 font-mono text-xs text-text-mute underline-offset-4 hover:text-text-dim hover:underline"
        style={{ animationDelay: "0.2s" }}
      >
        Erst ausprobieren? → Notenrechner-Demo ohne Anmeldung
      </Link>
    </main>
  );
}
