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
            1. Geltungsbereich
          </h2>
          <p>
            Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für die Nutzung
            der Web-Applikation Project X (nachfolgend „Dienst"), betrieben von
            Moritz-Kolja Polonius, Hamburg (nachfolgend „Anbieter"). Mit der
            Registrierung akzeptierst du diese AGB.
          </p>
        </section>

        {/* 2 */}
        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground">
            2. Leistungsbeschreibung
          </h2>
          <p className="mb-3">
            Project X ist eine Software-as-a-Service-Anwendung für Schülerinnen
            und Schüler. Der Dienst umfasst:
          </p>
          <ul className="space-y-2 pl-4">
            {[
              "Notenrechner und Notenverwaltung (kostenlos)",
              "Stundenplan-Verwaltung (kostenlos)",
              "Klausur-Tracking und Erinnerungen (kostenlos)",
              "KI-Coach und KI-Briefing (nur Pro)",
              "Erweiterte Analyse-Funktionen (nur Pro)",
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-0.5 text-brand">·</span>
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-3">
            Der Anbieter behält sich vor, den Leistungsumfang jederzeit
            anzupassen, zu erweitern oder einzustellen, soweit dies dem Nutzer
            zumutbar ist.
          </p>
        </section>

        {/* 3 */}
        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground">
            3. Registrierung und Account
          </h2>
          <p className="mb-3">
            Für die Nutzung ist eine Registrierung mit einer gültigen
            E-Mail-Adresse erforderlich. Du bist verpflichtet:
          </p>
          <ul className="space-y-2 pl-4">
            {[
              "Wahrheitsgemäße Angaben bei der Registrierung zu machen",
              "Deine Zugangsdaten geheim zu halten",
              "Unbefugte Nutzung deines Accounts unverzüglich zu melden",
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-0.5 text-brand">·</span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* 4 */}
        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground">
            4. Minderjährige
          </h2>
          <p>
            Project X richtet sich an Schülerinnen und Schüler und kann auch von
            Minderjährigen genutzt werden. Die Nutzung des kostenlosen
            Grundangebots bedarf keiner besonderen Einwilligung. Für den Abschluss
            eines kostenpflichtigen Pro-Abonnements ist die Einwilligung eines
            Erziehungsberechtigten erforderlich, sofern der Nutzer das 18.
            Lebensjahr noch nicht vollendet hat (§§ 107, 108 BGB). Mit dem
            Abschluss eines Pro-Abonnements bestätigt der Nutzer, dass die
            erforderliche Zustimmung vorliegt.
          </p>
        </section>

        {/* 5 */}
        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground">
            5. Pro-Abonnement und Preise
          </h2>
          <p className="mb-3">
            Der Dienst ist in einer kostenlosen Basisversion sowie einem
            kostenpflichtigen Pro-Abonnement verfügbar. Die aktuellen Preise sind
            auf der Pricing-Seite einsehbar. Es gelten folgende Konditionen:
          </p>
          <ul className="space-y-2 pl-4">
            {[
              "Das Pro-Abonnement verlängert sich automatisch zum gewählten Intervall (wöchentlich, monatlich oder jährlich)",
              "Die Abrechnung erfolgt über Lemon Squeezy (Merchant of Record)",
              "Preisänderungen werden mindestens 30 Tage im Voraus angekündigt",
              "Alle Preise sind Endpreise inklusive gesetzlicher Mehrwertsteuer",
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-0.5 text-brand">·</span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* 6 */}
        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground">
            6. Widerrufsrecht
          </h2>

          <div
            className="mb-4 rounded-2xl border border-brand/30 bg-brand/5 p-4 font-mono text-xs leading-relaxed text-foreground"
          >
            <div className="mb-2 font-bold uppercase tracking-widest text-brand">
              Widerrufsbelehrung
            </div>
            <p className="mb-2">
              <strong>Widerrufsrecht:</strong> Du hast das Recht, binnen 14 Tagen
              ohne Angabe von Gründen diesen Vertrag zu widerrufen. Die
              Widerrufsfrist beträgt 14 Tage ab dem Tag des Vertragsabschlusses.
            </p>
            <p className="mb-2">
              Um dein Widerrufsrecht auszuüben, musst du uns — Moritz-Kolja
              Polonius, Hamburg, E-Mail:{" "}
              <a href="mailto:ne.polonius@gmail.com" className="text-brand">
                ne.polonius@gmail.com
              </a>{" "}
              — mittels einer eindeutigen Erklärung (z. B. per E-Mail) über deinen
              Entschluss, diesen Vertrag zu widerrufen, informieren.
            </p>
            <p className="mb-2">
              <strong>Folgen des Widerrufs:</strong> Wenn du diesen Vertrag
              widerrufst, haben wir dir alle Zahlungen, die wir von dir erhalten
              haben, unverzüglich und spätestens binnen 14 Tagen ab dem Tag
              zurückzuzahlen, an dem die Mitteilung über deinen Widerruf dieses
              Vertrags bei uns eingegangen ist.
            </p>
            <p>
              <strong>Vorzeitiges Erlöschen:</strong> Dein Widerrufsrecht erlischt
              vorzeitig, wenn du ausdrücklich zugestimmt hast, dass wir vor Ende
              der Widerrufsfrist mit der Ausführung der Dienstleistung beginnen,
              und du bestätigt hast, dass du mit dem Beginn der Ausführung dein
              Widerrufsrecht verlierst (§ 356 Abs. 5 BGB).
            </p>
          </div>

          <p>
            Hinweis: Da Project X eine sofort verfügbare digitale Dienstleistung
            ist, beginnt die Nutzung in der Regel sofort nach Zahlungseingang. Du
            kannst beim Abschluss des Abonnements ausdrücklich zustimmen, dass die
            Leistung sofort beginnt — in diesem Fall erlischt das Widerrufsrecht
            vorzeitig.
          </p>
        </section>

        {/* 7 */}
        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground">
            7. Kündigung
          </h2>
          <p>
            Das Pro-Abonnement kann jederzeit zum Ende des laufenden
            Abrechnungszeitraums über das Lemon Squeezy Kundenportal oder per
            E-Mail an{" "}
            <a href="mailto:ne.polonius@gmail.com" className="text-brand hover:underline">
              ne.polonius@gmail.com
            </a>{" "}
            gekündigt werden. Nach der Kündigung steht das Pro-Abonnement bis zum
            Ende des bezahlten Zeitraums zur Verfügung; danach wird der Account
            automatisch auf die kostenlose Version zurückgestuft.
          </p>
        </section>

        {/* 8 */}
        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground">
            8. Nutzungspflichten
          </h2>
          <p className="mb-3">Folgendes ist verboten:</p>
          <ul className="space-y-2 pl-4">
            {[
              "Automatisierter Zugriff auf den Dienst (Scraping, Bots)",
              "Reverse Engineering der Anwendung",
              "Weitergabe von Zugangsdaten an Dritte",
              "Nutzung des Dienstes für rechtswidrige Zwecke",
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-0.5 text-brand">·</span>
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-3">
            Bei Verstößen behält sich der Anbieter vor, den Account zu sperren
            oder zu löschen.
          </p>
        </section>

        {/* 9 */}
        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground">
            9. Haftung
          </h2>
          <p className="mb-3">
            Der Anbieter haftet unbeschränkt für Vorsatz und grobe Fahrlässigkeit.
            Bei leichter Fahrlässigkeit haftet der Anbieter nur bei Verletzung
            wesentlicher Vertragspflichten (Kardinalpflichten) und nur in Höhe des
            bei Vertragsschluss vorhersehbaren, typischen Schadens.
          </p>
          <p>
            Der Anbieter übernimmt keine Haftung für die Richtigkeit der durch den
            Nutzer eingetragenen Noten und Daten. Project X ist ein
            Organisationswerkzeug, keine offizielle Quelle für Schulnoten.
          </p>
        </section>

        {/* 10 */}
        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground">
            10. Verfügbarkeit
          </h2>
          <p>
            Der Anbieter strebt eine hohe Verfügbarkeit des Dienstes an, garantiert
            aber keine unterbrechungsfreie Nutzung. Wartungsarbeiten werden nach
            Möglichkeit angekündigt und außerhalb der Hauptnutzungszeiten
            durchgeführt.
          </p>
        </section>

        {/* 11 */}
        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground">
            11. Datenschutz
          </h2>
          <p>
            Die Verarbeitung personenbezogener Daten erfolgt gemäß unserer{" "}
            <Link href="/datenschutz" className="text-brand hover:underline">
              Datenschutzerklärung
            </Link>
            , die Bestandteil dieser AGB ist.
          </p>
        </section>

        {/* 12 */}
        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground">
            12. Änderungen dieser AGB
          </h2>
          <p>
            Der Anbieter kann diese AGB jederzeit mit einer Frist von mindestens
            30 Tagen ändern. Du wirst per E-Mail über Änderungen informiert. Wenn
            du den Änderungen nicht widersprichst, gelten sie als akzeptiert.
          </p>
        </section>

        {/* 13 */}
        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground">
            13. Anwendbares Recht und Gerichtsstand
          </h2>
          <p>
            Es gilt deutsches Recht. Gerichtsstand für Kaufleute ist Hamburg.
            Hinweis für Verbraucher: Für Streitigkeiten aus Online-Verträgen
            stellt die EU-Kommission eine Plattform zur Online-Streitbeilegung
            bereit:{" "}
            <a
              href="https://ec.europa.eu/consumers/odr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              ec.europa.eu/consumers/odr
            </a>
            . Wir sind nicht verpflichtet und nicht bereit, an
            Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle
            teilzunehmen.
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
