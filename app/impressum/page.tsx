import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Impressum — Notena",
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
            Anbieter
          </h2>
          <p className="font-mono">
            Moritz-Kolja Polonius
            <br />
            Osterbekstraße 90b
            <br />
            22083 Hamburg
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
          <p className="mt-2 text-xs text-text-mute">
            Anfragen werden in der Regel innerhalb von 5 Werktagen beantwortet.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground">
            Verantwortlich für den Inhalt (§ 55 Abs. 2 RStV)
          </h2>
          <p className="font-mono">
            Moritz-Kolja Polonius
            <br />
            Osterbekstraße 90b
            <br />
            22083 Hamburg
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground">
            Umsatzsteuer
          </h2>
          <p>
            Der Anbieter erbringt Leistungen als Kleinunternehmer im Sinne von
            § 19 UStG. Es wird daher keine Umsatzsteuer ausgewiesen.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground">
            Streitschlichtung
          </h2>
          <p className="mb-2">
            Die Europäische Kommission stellt eine Plattform zur
            Online-Streitbeilegung (OS) bereit:{" "}
            <a
              href="https://ec.europa.eu/consumers/odr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              https://ec.europa.eu/consumers/odr
            </a>
            .
          </p>
          <p>
            Wir sind nicht verpflichtet und nicht bereit, an einem
            Streitbeilegungsverfahren vor einer
            Verbraucherschlichtungsstelle teilzunehmen.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground">
            Haftung für Inhalte
          </h2>
          <p>
            Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte
            auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach
            §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht
            verpflichtet, übermittelte oder gespeicherte fremde Informationen zu
            überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige
            Tätigkeit hinweisen. Verpflichtungen zur Entfernung oder Sperrung der
            Nutzung von Informationen nach den allgemeinen Gesetzen bleiben
            hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem
            Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei
            Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese
            Inhalte umgehend entfernen.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground">
            Haftung für Links
          </h2>
          <p>
            Unser Angebot enthält Links zu externen Websites Dritter, auf deren
            Inhalte wir keinen Einfluss haben. Deshalb können wir für diese
            fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der
            verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der
            Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der
            Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige
            Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar. Eine
            permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne
            konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei
            Bekanntwerden von Rechtsverletzungen werden wir derartige Links
            umgehend entfernen.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground">
            Urheberrecht
          </h2>
          <p>
            Die durch den Anbieter erstellten Inhalte und Werke auf diesen Seiten
            unterliegen dem deutschen Urheberrecht. Die Vervielfältigung,
            Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der
            Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des
            jeweiligen Autors bzw. Erstellers.
          </p>
        </section>

      </div>

      <div className="mt-14 border-t border-border/30 pt-6 flex flex-wrap gap-6 font-mono text-xs text-text-mute">
        <Link href="/datenschutz" className="hover:text-text-dim transition-colors">
          Datenschutz
        </Link>
        <Link href="/agb" className="hover:text-text-dim transition-colors">
          AGB
        </Link>
        <Link href="/" className="hover:text-text-dim transition-colors">
          Startseite
        </Link>
      </div>
    </main>
  );
}
