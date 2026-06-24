import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Datenschutzerklärung — Project X",
};

export default function DatenschutzPage() {
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
        Datenschutzerklärung
      </h1>
      <p className="mt-3 font-mono text-sm text-text-dim">Stand: Juni 2026</p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-text-dim">

        {/* 1 */}
        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground">
            1. Verantwortlicher (Art. 13 Abs. 1 lit. a DSGVO)
          </h2>
          <p className="font-mono">
            Moritz-Kolja Polonius
            <br />
            Osterbekstraße 90b
            <br />
            22083 Hamburg
            <br />
            Deutschland
            <br />
            E-Mail:{" "}
            <a href="mailto:ne.polonius@gmail.com" className="text-brand hover:underline">
              ne.polonius@gmail.com
            </a>
          </p>
        </section>

        {/* 2 */}
        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground">
            2. Arten der verarbeiteten Daten
          </h2>
          <p className="mb-3">
            Im Rahmen der Nutzung von Project X werden folgende
            personenbezogene Daten verarbeitet:
          </p>
          <div className="space-y-3">
            <div className="rounded-2xl border border-border bg-surface-2 p-4">
              <div className="mb-1 font-semibold text-foreground">Kontodaten</div>
              <p className="text-xs">
                E-Mail-Adresse (für Account, Login und Kommunikation), verschlüsseltes
                Passwort (nur als Hash gespeichert, nie im Klartext).
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-surface-2 p-4">
              <div className="mb-1 font-semibold text-foreground">Profildaten</div>
              <p className="text-xs">
                Vorname, optionaler Nachname, Klasse, Bundesland, Schulform,
                Schulname, optionales Geburtsdatum. Diese Daten gibst du freiwillig
                beim Onboarding an.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-surface-2 p-4">
              <div className="mb-1 font-semibold text-foreground">Schuldaten</div>
              <p className="text-xs">
                Schulnoten, Klausurtermine und -ergebnisse, Hausaufgaben,
                Stundenplan. Diese Daten sind der Kernzweck der App und werden
                ausschließlich zur Bereitstellung der App-Funktionen verwendet.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-surface-2 p-4">
              <div className="mb-1 font-semibold text-foreground">Nutzungsdaten</div>
              <p className="text-xs">
                IP-Adresse (nur bei Vercel-Anfragen, kurzfristig), Zeitpunkt des
                letzten Logins, Gerätedaten (nur für Push-Benachrichtigungen).
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-surface-2 p-4">
              <div className="mb-1 font-semibold text-foreground">Zahlungsdaten (nur Pro)</div>
              <p className="text-xs">
                Zahlungsdaten werden ausschließlich von Lemon Squeezy (Merchant of
                Record) verarbeitet. Project X speichert keine Kreditkartendaten
                oder Bankverbindungen. Wir erhalten lediglich eine Bestätigung des
                Abonnementstatus.
              </p>
            </div>
          </div>
        </section>

        {/* 3 */}
        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground">
            3. Zwecke und Rechtsgrundlagen der Verarbeitung
          </h2>
          <div className="space-y-3 text-sm">
            <div>
              <span className="font-semibold text-foreground">Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO):</span>{" "}
              Bereitstellung der App-Funktionen (Notenrechner, Stundenplan,
              Klausurverwaltung, KI-Briefing). Ohne diese Daten kann die App
              nicht genutzt werden.
            </div>
            <div>
              <span className="font-semibold text-foreground">Berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO):</span>{" "}
              Sicherheit und Stabilität des Dienstes, Betrugsprävention,
              Fehleranalyse.
            </div>
            <div>
              <span className="font-semibold text-foreground">Einwilligung (Art. 6 Abs. 1 lit. a DSGVO):</span>{" "}
              Push-Benachrichtigungen — nur mit deiner ausdrücklichen
              Browser-Erlaubnis.
            </div>
          </div>
        </section>

        {/* 4 */}
        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground">
            4. Auftragsverarbeiter (Art. 28 DSGVO)
          </h2>
          <p className="mb-3">
            Wir setzen folgende sorgfältig ausgewählte Dienstleister ein, mit
            denen Verträge zur Auftragsverarbeitung (AVV) geschlossen wurden oder
            die über geeignete Standardvertragsklauseln verfügen:
          </p>
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-surface-2 p-4">
              <div className="mb-1 font-semibold text-foreground">Supabase, Inc.</div>
              <div className="mb-2 font-mono text-xs text-text-mute">
                Zweck: Datenbankhosting und Authentifizierung · Serverstandort: Frankfurt, Deutschland (AWS eu-central-1)
              </div>
              <p className="text-xs">
                Supabase speichert Account-, Profil- und Schuldaten. Der Serverstandort
                liegt in der EU (Frankfurt). Weitere Informationen:{" "}
                <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
                  supabase.com/privacy
                </a>
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-surface-2 p-4">
              <div className="mb-1 font-semibold text-foreground">Vercel, Inc.</div>
              <div className="mb-2 font-mono text-xs text-text-mute">
                Zweck: Webhosting und CDN · Hauptstandort: USA (mit EU-Edge-Nodes)
              </div>
              <p className="text-xs">
                Vercel liefert die Web-App aus. Bei jedem Seitenaufruf werden
                IP-Adresse und Anfrage-Metadaten kurzfristig verarbeitet. Der
                Datentransfer in die USA erfolgt auf Basis der EU-Standardvertragsklauseln
                (SCC). Weitere Informationen:{" "}
                <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
                  vercel.com/legal/privacy-policy
                </a>
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-surface-2 p-4">
              <div className="mb-1 font-semibold text-foreground">Anthropic, PBC</div>
              <div className="mb-2 font-mono text-xs text-text-mute">
                Zweck: KI-Briefing und KI-Coach (nur wenn genutzt) · Verarbeitung in den USA
              </div>
              <p className="text-xs">
                Wenn du das KI-Briefing oder den KI-Coach verwendest, werden
                anonymisierte Schuldaten (Noten, Klausurtermine, Stundenplan) an
                Anthropic übermittelt. Es werden keine direkt identifizierenden
                Daten (Name, E-Mail) übermittelt. Der Datentransfer in die USA
                erfolgt auf Basis der SCC. Weitere Informationen:{" "}
                <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
                  anthropic.com/privacy
                </a>
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-surface-2 p-4">
              <div className="mb-1 font-semibold text-foreground">Lemon Squeezy (LLS LLC)</div>
              <div className="mb-2 font-mono text-xs text-text-mute">
                Zweck: Zahlungsabwicklung für Pro-Abonnements (nur Pro-Nutzer) · USA
              </div>
              <p className="text-xs">
                Lemon Squeezy ist Merchant of Record und verarbeitet alle
                Zahlungsdaten direkt. Project X erhält lediglich eine
                Abonnement-Bestätigung (Plan-Status). Der Datentransfer in die
                USA erfolgt auf Basis der SCC. Weitere Informationen:{" "}
                <a href="https://www.lemonsqueezy.com/privacy" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
                  lemonsqueezy.com/privacy
                </a>
              </p>
            </div>
          </div>
        </section>

        {/* 5 */}
        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground">
            5. Datenweitergabe an Dritte
          </h2>
          <p>
            Eine Weitergabe deiner personenbezogenen Daten an Dritte erfolgt
            ausschließlich an die in Abschnitt 4 genannten Auftragsverarbeiter,
            soweit dies zur Bereitstellung des Dienstes erforderlich ist.
            Eine darüber hinausgehende Weitergabe an Dritte — insbesondere an
            Werbetreibende — findet nicht statt. Es werden keine Tracking-Cookies,
            Werbe-Pixel oder Analysetools von Drittanbietern eingesetzt.
          </p>
        </section>

        {/* 6 */}
        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground">
            6. Speicherdauer
          </h2>
          <p className="mb-3">
            Deine Daten werden gespeichert, solange dein Account aktiv ist:
          </p>
          <ul className="space-y-2 pl-4">
            {[
              "Kontodaten: bis zur Account-Löschung",
              "Schuldaten: bis zur Account-Löschung oder auf Anfrage",
              "Nutzungslogs: maximal 30 Tage (Vercel-Logs)",
              "Zahlungsdaten: gemäß den Aufbewahrungspflichten von Lemon Squeezy und steuerrechtlichen Vorgaben (§ 147 AO: 10 Jahre für Buchungsbelege)",
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-0.5 text-brand">·</span>
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-3">
            Du kannst deinen Account jederzeit in den Einstellungen löschen.
            Alle personenbezogenen Daten werden dabei vollständig entfernt,
            sofern keine gesetzlichen Aufbewahrungspflichten entgegenstehen.
          </p>
        </section>

        {/* 7 */}
        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground">
            7. Deine Rechte (Art. 15–21 DSGVO)
          </h2>
          <p className="mb-3">
            Du hast jederzeit folgende Rechte gegenüber uns:
          </p>
          <div className="space-y-2">
            {[
              { art: "Art. 15 DSGVO", recht: "Auskunft über deine gespeicherten Daten" },
              { art: "Art. 16 DSGVO", recht: "Berichtigung unrichtiger Daten" },
              { art: "Art. 17 DSGVO", recht: "Löschung deiner Daten („Recht auf Vergessenwerden“)" },
              { art: "Art. 18 DSGVO", recht: "Einschränkung der Verarbeitung" },
              { art: "Art. 20 DSGVO", recht: "Datenübertragbarkeit (Export in JSON über die Einstellungen)" },
              { art: "Art. 21 DSGVO", recht: "Widerspruch gegen die Verarbeitung" },
              { art: "Art. 7 Abs. 3 DSGVO", recht: "Widerruf einer erteilten Einwilligung (z. B. Push-Benachrichtigungen)" },
            ].map((item) => (
              <div key={item.art} className="flex gap-3 rounded-xl bg-surface-2 px-3 py-2">
                <span className="shrink-0 font-mono text-xs text-brand">{item.art}</span>
                <span className="text-xs">{item.recht}</span>
              </div>
            ))}
          </div>
          <p className="mt-3">
            Zur Ausübung deiner Rechte wende dich per E-Mail an{" "}
            <a href="mailto:ne.polonius@gmail.com" className="text-brand hover:underline">
              ne.polonius@gmail.com
            </a>
            . Wir antworten innerhalb von 30 Tagen (Art. 12 Abs. 3 DSGVO).
          </p>
        </section>

        {/* 8 */}
        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground">
            8. Beschwerderecht (Art. 77 DSGVO)
          </h2>
          <p>
            Du hast das Recht, dich bei einer Datenschutzaufsichtsbehörde zu
            beschweren. Zuständig für Hamburg ist:{" "}
            <strong className="text-foreground">
              Der Hamburgische Beauftragte für Datenschutz und Informationsfreiheit (HmbBfDI)
            </strong>
            , Ludwig-Erhard-Str. 22, 20459 Hamburg,{" "}
            <a href="https://datenschutz.hamburg.de" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
              datenschutz.hamburg.de
            </a>
            .
          </p>
        </section>

        {/* 9 */}
        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground">
            9. Minderjährige (Art. 8 DSGVO)
          </h2>
          <p>
            Project X richtet sich an Schülerinnen und Schüler. Gemäß Art. 8
            DSGVO i. V. m. § 1 Abs. 4 TTDSG ist die Einwilligung in die
            Datenverarbeitung für Nutzer unter 16 Jahren nur mit Zustimmung der
            Erziehungsberechtigten wirksam. Mit der Registrierung bestätigt der
            Nutzer, entweder das 16. Lebensjahr vollendet zu haben oder dass
            die Einwilligung der Erziehungsberechtigten vorliegt.
          </p>
        </section>

        {/* 10 */}
        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground">
            10. Datensicherheit
          </h2>
          <p>
            Der Dienst wird über eine verschlüsselte HTTPS-Verbindung
            ausgeliefert. Passwörter werden ausschließlich als
            kryptografischer Hash (bcrypt) gespeichert. Der Datenbankzugriff
            ist durch Row-Level Security (RLS) auf Supabase abgesichert —
            jeder Nutzer kann ausschließlich seine eigenen Daten lesen und
            schreiben. API-Zugriffe werden serverseitig validiert.
          </p>
        </section>

        {/* 11 */}
        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground">
            11. Cookies und lokale Speicherung
          </h2>
          <p className="mb-3">
            Project X verwendet keine Tracking-Cookies und keine
            Werbe-Cookies. Folgende technisch notwendige Speicherungen werden verwendet:
          </p>
          <div className="space-y-2">
            {[
              { name: "Session-Cookie (Supabase)", zweck: "Authentifizierung — technisch notwendig, keine Einwilligung erforderlich (§ 25 Abs. 2 TTDSG)" },
              { name: "Theme-Cookie", zweck: "Speicherung der Darstellungseinstellungen (Dark/Light-Mode) — technisch notwendig" },
              { name: "LocalStorage (Onboarding)", zweck: "Zwischenspeicherung der Onboarding-Daten vor der Registrierung — temporär, wird nach Registrierung gelöscht" },
            ].map((item) => (
              <div key={item.name} className="rounded-xl bg-surface-2 px-3 py-2.5">
                <div className="mb-0.5 text-xs font-semibold text-foreground">{item.name}</div>
                <div className="text-xs">{item.zweck}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 12 */}
        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground">
            12. Änderungen dieser Datenschutzerklärung
          </h2>
          <p>
            Wir behalten uns vor, diese Datenschutzerklärung anzupassen, um sie
            an geänderte Rechtslagen oder Änderungen des Dienstes anzupassen. Die
            jeweils aktuelle Version ist unter{" "}
            <Link href="/datenschutz" className="text-brand hover:underline">
              project-x.app/datenschutz
            </Link>{" "}
            abrufbar. Bei wesentlichen Änderungen werden registrierte Nutzer per
            E-Mail informiert.
          </p>
        </section>

      </div>

      <div className="mt-14 border-t border-border/30 pt-6 flex flex-wrap gap-6 font-mono text-xs text-text-mute">
        <Link href="/impressum" className="hover:text-text-dim transition-colors">
          Impressum
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
