import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Impressum — Project X",
};

export default function ImpressumPage() {
  return (
    <main className="mx-auto max-w-[680px] px-5 py-16 sm:px-8">
      <Link
        href="/"
        className="mb-10 flex items-center gap-2 font-mono text-xs text-text-mute transition-colors hover:text-text-dim"
      >
        <ArrowLeft className="size-3.5" />
        Zurück
      </Link>

      <div className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.3em] text-brand">
        Rechtliches
      </div>
      <h1 className="font-display text-4xl font-extrabold leading-tight">Impressum</h1>
      <p className="mt-3 font-mono text-sm text-text-dim">
        Angaben gemäß § 5 TMG
      </p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-text-dim">
        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground">
            Verantwortlich
          </h2>
          <p className="font-mono">
            [DEIN VOLLSTÄNDIGER NAME]
            <br />
            [STRAßE UND HAUSNUMMER]
            <br />
            [PLZ] Hamburg
            <br />
            Deutschland
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground">
            Kontakt
          </h2>
          <p className="font-mono">
            E-Mail:{" "}
            <a
              href="mailto:ne.polonius@gmail.com"
              className="text-brand hover:underline"
            >
              ne.polonius@gmail.com
            </a>
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground">
            Hinweis
          </h2>
          <p>
            Project X befindet sich in der geschlossenen Beta-Phase. Die Nutzung
            ist nur auf persönliche Einladung möglich. Kein kommerzielles Angebot.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground">
            Haftungsausschluss
          </h2>
          <p>
            Trotz sorgfältiger inhaltlicher Kontrolle übernehme ich keine Haftung
            für die Inhalte externer Links. Für den Inhalt der verlinkten Seiten
            sind ausschließlich deren Betreiber verantwortlich.
          </p>
        </section>
      </div>

      <div className="mt-14 border-t border-border/30 pt-6 flex gap-6 font-mono text-xs text-text-mute">
        <Link href="/datenschutz" className="hover:text-text-dim transition-colors">
          Datenschutz
        </Link>
        <Link href="/" className="hover:text-text-dim transition-colors">
          Startseite
        </Link>
      </div>
    </main>
  );
}
