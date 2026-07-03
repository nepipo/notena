import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "AGB — Project X",
};

export default function AgbPage() {
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
      <h1 className="font-display text-4xl font-extrabold leading-tight">
        Allgemeine Geschäftsbedingungen
      </h1>
      <p className="mt-3 font-mono text-sm text-text-dim">Stand: Juni 2026</p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-text-dim">

        {/* 1 */}
        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground">
            § 1 Anbieter und Geltungsbereich
          </h2>
          <p className="mb-3">
            (1) Diese Allgemeinen Geschäftsbedingungen (nachfolgend „AGB“) regeln
            die Nutzung der Web-Applikation Project X (nachfolgend „Dienst“),
            angeboten von:
          </p>
          <p className="mb-3 font-mono">
            Moritz-Kolja Polonius
            <br />
            Osterbekstraße 90b, 22083 Hamburg
            <br />
            E-Mail: ne.polonius@gmail.com
            <br />
            (nachfolgend „Anbieter“)
          </p>
          <p className="mb-3">
            (2) Diese AGB gelten gegenüber Verbrauchern im Sinne von § 13 BGB
            sowie gegenüber Unternehmen. Abweichende Bedingungen des Nutzers
            werden nicht anerkannt, es sei denn, der Anbieter stimmt diesen
            ausdrücklich schriftlich zu.
          </p>
          <p>
            (3) Mit der Registrierung und Nutzung des Dienstes erklärt der Nutzer
            sein Einverständnis mit diesen AGB in der jeweils geltenden Fassung.
          </p>
        </section>

        {/* 2 */}
        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground">
            § 2 Leistungsbeschreibung
          </h2>
          <p className="mb-3">
            (1) Project X ist eine Software-as-a-Service-Anwendung (SaaS) für
            Schülerinnen und Schüler mit folgenden Funktionen:
          </p>
          <div className="space-y-2 mb-3">
            <div className="rounded-xl bg-surface-2 px-4 py-3">
              <div className="mb-1 font-semibold text-foreground text-xs uppercase tracking-wider font-mono">Kostenlos (Free)</div>
              <ul className="space-y-1 text-xs">
                {["Notenrechner und -verwaltung", "Stundenplan-Verwaltung", "Klausur-Tracking", "Hausaufgabenverwaltung"].map(f => (
                  <li key={f} className="flex gap-2"><span className="text-brand">·</span>{f}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-brand/30 bg-brand/5 px-4 py-3">
              <div className="mb-1 font-semibold text-brand text-xs uppercase tracking-wider font-mono">Pro (kostenpflichtig)</div>
              <ul className="space-y-1 text-xs">
                {["KI-Coach (Chat mit Claude)", "Tägliches KI-Briefing", "Erweiterte Notenanalyse und Prognosen", "PDF-Notenexport", "Zusätzliche Themes und Personalisierung"].map(f => (
                  <li key={f} className="flex gap-2"><span className="text-brand">·</span>{f}</li>
                ))}
              </ul>
            </div>
          </div>
          <p className="mb-3">
            (2) Der Anbieter ist berechtigt, den Funktionsumfang des Dienstes zu
            erweitern, zu ändern oder einzuschränken, sofern dies dem Nutzer
            zumutbar ist und wesentliche Vertragspflichten nicht beeinträchtigt
            werden. Wesentliche Änderungen werden dem Nutzer mindestens 30 Tage
            vorab per E-Mail angekündigt.
          </p>
          <p>
            (3) Der Anbieter garantiert keine bestimmte Verfügbarkeit des Dienstes.
            Wartungsarbeiten werden nach Möglichkeit außerhalb der
            Hauptnutzungszeiten durchgeführt.
          </p>
        </section>

        {/* 3 */}
        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground">
            § 3 Vertragsschluss und Registrierung
          </h2>
          <p className="mb-3">
            (1) Der Vertrag über die kostenlose Nutzung kommt mit der
            Registrierung durch Bestätigung der E-Mail-Adresse zustande.
          </p>
          <p className="mb-3">
            (2) Der Vertrag über das Pro-Abonnement kommt durch das Anklicken des
            Buttons „Zahlungspflichtig abonnieren“ und die anschließende
            Zahlungsbestätigung durch Lemon Squeezy zustande.
          </p>
          <p className="mb-3">
            (3) Der Nutzer ist verpflichtet, bei der Registrierung wahrheitsgemäße
            und vollständige Angaben zu machen. Er ist ferner verpflichtet, seine
            Zugangsdaten vertraulich zu behandeln und Dritten nicht zugänglich zu
            machen.
          </p>
          <p>
            (4) Eine Registrierung ist nur natürlichen Personen gestattet. Pro
            Person ist ein Account zulässig.
          </p>
        </section>

        {/* 4 */}
        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground">
            § 4 Minderjährige
          </h2>
          <p className="mb-3">
            (1) Die Nutzung des kostenlosen Grundangebots steht Nutzern ab
            13 Jahren offen.
          </p>
          <p className="mb-3">
            (2) Der Abschluss eines kostenpflichtigen Pro-Abonnements ist
            Minderjährigen (Personen unter 18 Jahren) nur mit ausdrücklicher
            Zustimmung eines Erziehungsberechtigten gestattet (§§ 107, 108 BGB).
          </p>
          <p>
            (3) Mit dem Abschluss eines Pro-Abonnements bestätigt der Nutzer
            entweder, das 18. Lebensjahr vollendet zu haben, oder dass die
            erforderliche Einwilligung eines Erziehungsberechtigten vorliegt.
            Der Anbieter behält sich vor, bei begründetem Verdacht einen
            Altersnachweis zu verlangen.
          </p>
        </section>

        {/* 5 */}
        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground">
            § 5 Entgelt und Zahlungsbedingungen
          </h2>
          <p className="mb-3">
            (1) Das Grundangebot (Free) ist dauerhaft kostenlos.
          </p>
          <p className="mb-3">
            (2) Das Pro-Abonnement ist kostenpflichtig. Die aktuellen Preise sind
            auf der Pricing-Seite des Dienstes einsehbar. Alle Preise sind
            Endpreise. Da der Anbieter Kleinunternehmer im Sinne von § 19 UStG
            ist, wird keine Umsatzsteuer ausgewiesen.
          </p>
          <p className="mb-3">
            (3) Die Abrechnung erfolgt über Lemon Squeezy (LLS LLC), der als
            Merchant of Record auftritt und den Zahlungsvorgang abwickelt. Der
            Vertrag über die Zahlungsabwicklung kommt zwischen dem Nutzer und
            Lemon Squeezy zustande. Es gelten ergänzend die Nutzungsbedingungen
            von Lemon Squeezy.
          </p>
          <p className="mb-3">
            (4) Das Abonnement läuft im gewählten Intervall (wöchentlich,
            monatlich oder jährlich) und verlängert sich automatisch, sofern es
            nicht rechtzeitig vor dem Ende des Abrechnungszeitraums gekündigt wird.
          </p>
          <p>
            (5) Der Anbieter ist berechtigt, Preise mit einer Ankündigungsfrist
            von mindestens 30 Tagen vor Wirksamwerden zu ändern.
          </p>
        </section>

        {/* 6 */}
        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground">
            § 6 Widerrufsrecht
          </h2>
          <p className="mb-4">
            Es gilt folgende Widerrufsbelehrung gemäß § 312g i. V. m. §§ 355 ff.
            BGB und Anlage 1 zu § 246a EGBGB:
          </p>

          <div className="rounded-2xl border border-brand/30 bg-brand/5 p-5 font-mono text-xs leading-relaxed text-foreground">
            <div className="mb-4 font-bold uppercase tracking-[.15em] text-brand">
              Widerrufsbelehrung
            </div>

            <p className="mb-3 font-bold">Widerrufsrecht</p>
            <p className="mb-3">
              Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen
              diesen Vertrag zu widerrufen.
            </p>
            <p className="mb-3">
              Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des
              Vertragsabschlusses.
            </p>
            <p className="mb-3">
              Um Ihr Widerrufsrecht auszuüben, müssen Sie uns —
              Moritz-Kolja Polonius, Osterbekstraße 90b, 22083 Hamburg,
              E-Mail: ne.polonius@gmail.com — mittels einer eindeutigen Erklärung
              (z. B. eine per E-Mail versandte Mitteilung) über Ihren Entschluss,
              diesen Vertrag zu widerrufen, informieren. Sie können dafür das
              beigefügte Muster-Widerrufsformular verwenden, das jedoch nicht
              vorgeschrieben ist.
            </p>
            <p className="mb-3">
              Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die
              Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf der
              Widerrufsfrist absenden.
            </p>

            <p className="mb-3 font-bold">Folgen des Widerrufs</p>
            <p className="mb-3">
              Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen,
              die wir von Ihnen erhalten haben, unverzüglich und spätestens binnen
              vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über
              Ihren Widerruf dieses Vertrags bei uns eingegangen ist. Für diese
              Rückzahlung verwenden wir dasselbe Zahlungsmittel, das Sie bei der
              ursprünglichen Transaktion eingesetzt haben, es sei denn, mit Ihnen
              wurde ausdrücklich etwas anderes vereinbart; in keinem Fall werden
              Ihnen wegen dieser Rückzahlung Entgelte berechnet.
            </p>

            <p className="mb-3 font-bold">Vorzeitiges Erlöschen des Widerrufsrechts</p>
            <p>
              Ihr Widerrufsrecht erlischt vorzeitig, wenn Sie ausdrücklich
              zugestimmt haben, dass wir vor Ende der Widerrufsfrist mit der
              Ausführung der Dienstleistung beginnen, und Sie Ihre Kenntnis davon
              bestätigt haben, dass Sie durch Ihre Zustimmung mit Beginn der
              Ausführung des Vertrags Ihr Widerrufsrecht verlieren
              (§ 356 Abs. 5 BGB).
            </p>
          </div>

          <div className="mt-6 rounded-2xl border border-border bg-surface-2 p-5 font-mono text-xs leading-relaxed">
            <div className="mb-4 font-bold uppercase tracking-[.15em] text-text-dim">
              Muster-Widerrufsformular
            </div>
            <p className="mb-3 text-text-mute">
              (Wenn Sie den Vertrag widerrufen wollen, dann füllen Sie dieses
              Formular aus und senden Sie es zurück.)
            </p>
            <p className="mb-2">An:</p>
            <p className="mb-3">
              Moritz-Kolja Polonius
              <br />
              Osterbekstraße 90b, 22083 Hamburg
              <br />
              E-Mail: ne.polonius@gmail.com
            </p>
            <p className="mb-3">
              Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*)
              abgeschlossenen Vertrag über den Kauf der folgenden Waren (*) /
              die Erbringung der folgenden Dienstleistung (*):
            </p>
            <p className="mb-1">Bestellt am (*) / erhalten am (*):</p>
            <p className="mb-1">Name des/der Verbraucher(s):</p>
            <p className="mb-1">Anschrift des/der Verbraucher(s):</p>
            <p className="mb-3">Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier):</p>
            <p>Datum:</p>
            <p className="mt-3 text-text-mute">(*) Unzutreffendes streichen.</p>
          </div>
        </section>

        {/* 7 */}
        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground">
            § 7 Kündigung des Pro-Abonnements
          </h2>
          <p className="mb-3">
            (1) Der Nutzer kann das Pro-Abonnement jederzeit zum Ende des
            laufenden Abrechnungszeitraums kündigen. Die Kündigung erfolgt über
            das Kundenportal von Lemon Squeezy oder per E-Mail an
            ne.polonius@gmail.com.
          </p>
          <p className="mb-3">
            (2) Nach der Kündigung steht das Pro-Abonnement bis zum Ende des
            bereits bezahlten Zeitraums zur Verfügung. Danach wird der Account
            automatisch auf das kostenlose Angebot zurückgestuft.
          </p>
          <p>
            (3) Der Anbieter ist berechtigt, das Pro-Abonnement aus wichtigem
            Grund fristlos zu kündigen, insbesondere bei schwerwiegenden Verstößen
            gegen diese AGB. In diesem Fall werden bereits geleistete Zahlungen
            anteilig erstattet.
          </p>
        </section>

        {/* 8 */}
        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground">
            § 8 Kündigung des kostenlosen Accounts
          </h2>
          <p className="mb-3">
            (1) Der Nutzer kann seinen Account jederzeit ohne Angabe von Gründen
            in den Einstellungen der App löschen. Alle gespeicherten Daten werden
            dabei unwiderruflich entfernt, soweit keine gesetzlichen
            Aufbewahrungspflichten entgegenstehen.
          </p>
          <p>
            (2) Der Anbieter kann den Account eines Nutzers bei schwerwiegenden
            Verstößen gegen diese AGB mit sofortiger Wirkung sperren oder löschen.
          </p>
        </section>

        {/* 9 */}
        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground">
            § 9 Nutzungspflichten und verbotene Handlungen
          </h2>
          <p className="mb-3">Dem Nutzer ist untersagt:</p>
          <ul className="space-y-2 pl-4 mb-3">
            {[
              "Automatisierter Zugriff auf den Dienst (Scraping, Bots, Spider)",
              "Reverse Engineering, Dekompilierung oder Disassemblierung der Anwendung",
              "Weitergabe von Zugangsdaten an Dritte",
              "Umgehung von Sicherheitsmaßnahmen",
              "Einschleusung von Schadsoftware oder schädlichen Inhalten",
              "Nutzung des Dienstes für rechtswidrige Zwecke",
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-0.5 text-brand">·</span>
                {item}
              </li>
            ))}
          </ul>
          <p>
            Bei Verstößen ist der Anbieter berechtigt, den Zugang zum Dienst
            unverzüglich zu sperren und Schadensersatzansprüche geltend zu machen.
          </p>
        </section>

        {/* 10 */}
        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground">
            § 10 Geistiges Eigentum
          </h2>
          <p className="mb-3">
            (1) Der Dienst und alle damit verbundenen Inhalte, Marken, Logos und
            Software sind urheberrechtlich geschützt und Eigentum des Anbieters
            oder lizenzierter Dritter.
          </p>
          <p>
            (2) Dem Nutzer wird ein einfaches, nicht übertragbares Nutzungsrecht
            an der App eingeräumt, das auf die Dauer des Vertragsverhältnisses
            beschränkt ist.
          </p>
        </section>

        {/* 11 */}
        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground">
            § 11 Haftung
          </h2>
          <p className="mb-3">
            (1) Der Anbieter haftet unbeschränkt für Schäden, die auf Vorsatz
            oder grober Fahrlässigkeit beruhen, sowie für Schäden aus der
            Verletzung des Lebens, des Körpers oder der Gesundheit.
          </p>
          <p className="mb-3">
            (2) Bei leichter Fahrlässigkeit haftet der Anbieter nur bei Verletzung
            wesentlicher Vertragspflichten (Kardinalpflichten), die die Erreichung
            des Vertragszwecks ermöglichen. In diesem Fall ist die Haftung auf den
            typischerweise vorhersehbaren Schaden begrenzt.
          </p>
          <p className="mb-3">
            (3) Die Haftung für den Verlust von Daten ist auf den typischen
            Wiederherstellungsaufwand beschränkt, der bei regelmäßiger und
            gefahrentsprechender Datensicherung entstanden wäre.
          </p>
          <p>
            (4) Der Anbieter übernimmt keine Haftung für die Richtigkeit der vom
            Nutzer eingetragenen Daten (Noten, Klausurtermine). Project X ist
            ein Organisationswerkzeug und keine amtliche Datenquelle.
          </p>
        </section>

        {/* 12 */}
        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground">
            § 12 Datenschutz
          </h2>
          <p>
            Die Verarbeitung personenbezogener Daten erfolgt gemäß unserer{" "}
            <Link href="/datenschutz" className="text-brand hover:underline">
              Datenschutzerklärung
            </Link>
            , die Bestandteil dieser AGB ist und unter{" "}
            <Link href="/datenschutz" className="text-brand hover:underline">
              project-x.app/datenschutz
            </Link>{" "}
            abrufbar ist.
          </p>
        </section>

        {/* 13 */}
        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground">
            § 13 Änderungen der AGB
          </h2>
          <p className="mb-3">
            (1) Der Anbieter ist berechtigt, diese AGB zu ändern. Änderungen
            werden dem Nutzer per E-Mail an die hinterlegte Adresse mindestens
            30 Tage vor Inkrafttreten der Änderungen mitgeteilt.
          </p>
          <p className="mb-3">
            (2) Widerspricht der Nutzer den geänderten AGB nicht innerhalb von
            30 Tagen nach Bekanntgabe, gelten die geänderten AGB als
            angenommen. Auf diese Folge des Schweigens wird in der
            Änderungsmitteilung ausdrücklich hingewiesen.
          </p>
          <p>
            (3) Im Falle des Widerspruchs ist der Anbieter berechtigt, den
            Vertrag zum Zeitpunkt des Inkrafttretens der Änderungen zu kündigen.
          </p>
        </section>

        {/* 14 */}
        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground">
            § 14 Schlussbestimmungen
          </h2>
          <p className="mb-3">
            (1) Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss
            des UN-Kaufrechts (CISG). Für Verbraucher gilt dies nur insoweit, als
            nicht zwingende gesetzliche Vorschriften des Staates, in dem der
            Verbraucher seinen gewöhnlichen Aufenthalt hat, entgegenstehen.
          </p>
          <p className="mb-3">
            (2) Für Streitigkeiten mit Kaufleuten, juristischen Personen des
            öffentlichen Rechts oder öffentlich-rechtlichen Sondervermögen ist
            Hamburg ausschließlicher Gerichtsstand.
          </p>
          <p className="mb-3">
            (3) Die EU-Kommission stellt eine Plattform zur
            Online-Streitbeilegung bereit:{" "}
            <a
              href="https://ec.europa.eu/consumers/odr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              https://ec.europa.eu/consumers/odr
            </a>
            . Wir sind nicht verpflichtet und nicht bereit, an einem
            Streitbeilegungsverfahren vor einer
            Verbraucherschlichtungsstelle teilzunehmen.
          </p>
          <p>
            (4) Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder
            werden, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.
            An die Stelle der unwirksamen Bestimmung tritt die gesetzliche
            Regelung.
          </p>
        </section>

      </div>

      <div className="mt-14 border-t border-border/30 pt-6 flex flex-wrap gap-6 font-mono text-xs text-text-mute">
        <Link href="/impressum" className="hover:text-text-dim transition-colors">
          Impressum
        </Link>
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
