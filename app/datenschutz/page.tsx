import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Datenschutz — Project X",
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
            1. Verantwortlicher
          </h2>
          <p className="font-mono">
            [DEIN VOLLSTÄNDIGER NAME]
            <br />
            [STRAßE UND HAUSNUMMER]
            <br />
            [PLZ] Hamburg
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
            2. Welche Daten werden erhoben?
          </h2>
          <p className="mb-3">
            Project X verarbeitet ausschließlich Daten, die du selbst aktiv einträgst:
          </p>
          <ul className="space-y-2 pl-4">
            {[
              "E-Mail-Adresse (für Account und Login)",
              "Vorname (für die persönliche Ansprache in der App)",
              "Klasse und Schuljahr (für die Berechnung deines Schnitts)",
              "Schulnoten und Klausurergebnisse (Kernfunktion der App)",
              "Klausurtermine (für den Countdown und das Briefing)",
              "Stundenplan (optional, für die Stundenplan-Ansicht)",
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-0.5 text-brand">·</span>
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-3">
            Es werden keine Tracking-Cookies, Werbe-Pixel oder Analysetools von
            Drittanbietern eingesetzt.
          </p>
        </section>

        {/* 3 */}
        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground">
            3. Rechtsgrundlage
          </h2>
          <p>
            Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO
            (Vertragserfüllung) — die Daten sind notwendig, um die App-Funktionen
            bereitzustellen — sowie Art. 6 Abs. 1 lit. f DSGVO (berechtigtes
            Interesse an der Weiterentwicklung des Dienstes).
          </p>
        </section>

        {/* 4 */}
        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground">
            4. Dienstleister (Auftragsverarbeiter)
          </h2>
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-surface-2 p-4">
              <div className="mb-1 font-semibold text-foreground">Supabase, Inc.</div>
              <div className="font-mono text-xs text-text-mute">
                Datenbankhosting und Authentifizierung · Serverstandort: Frankfurt, EU
                (AWS eu-central-1)
              </div>
              <p className="mt-2 text-xs">
                Supabase speichert deinen Account und alle eingetragenen Schuldaten.
                Vertrag zur Auftragsverarbeitung (DPA) liegt vor. Weitere Infos:{" "}
                <a
                  href="https://supabase.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand hover:underline"
                >
                  supabase.com/privacy
                </a>
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-surface-2 p-4">
              <div className="mb-1 font-semibold text-foreground">Vercel, Inc.</div>
              <div className="font-mono text-xs text-text-mute">
                Webhosting und CDN · Serverstandort: USA (mit EU-Fallback)
              </div>
              <p className="mt-2 text-xs">
                Vercel liefert die Web-App aus. Bei jedem Seitenaufruf werden
                IP-Adresse und Anfrage-Metadaten kurzzeitig verarbeitet.{" "}
                <a
                  href="https://vercel.com/legal/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand hover:underline"
                >
                  vercel.com/legal/privacy-policy
                </a>
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-surface-2 p-4">
              <div className="mb-1 font-semibold text-foreground">Anthropic, PBC</div>
              <div className="font-mono text-xs text-text-mute">
                KI-Briefing und KI-Coach · Verarbeitung in den USA
              </div>
              <p className="mt-2 text-xs">
                Wenn du das KI-Briefing oder den KI-Coach nutzt, werden deine
                eingetragenen Noten und Klausurtermine anonymisiert an Anthropic
                übermittelt, um das tägliche Briefing zu generieren. Es werden
                keine personenbezogenen Daten (Name, E-Mail) an Anthropic
                weitergegeben.{" "}
                <a
                  href="https://www.anthropic.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand hover:underline"
                >
                  anthropic.com/privacy
                </a>
              </p>
            </div>
          </div>
        </section>

        {/* 5 */}
        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground">
            5. Speicherdauer
          </h2>
          <p>
            Deine Daten werden gespeichert, solange dein Account aktiv ist. Du
            kannst deinen Account jederzeit in den Einstellungen löschen — dabei
            werden alle personenbezogenen Daten vollständig entfernt.
          </p>
        </section>

        {/* 6 */}
        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground">
            6. Deine Rechte
          </h2>
          <p className="mb-3">Du hast jederzeit das Recht auf:</p>
          <ul className="space-y-2 pl-4">
            {[
              "Auskunft über deine gespeicherten Daten (Art. 15 DSGVO)",
              "Berichtigung unrichtiger Daten (Art. 16 DSGVO)",
              "Löschung deiner Daten (Art. 17 DSGVO)",
              "Einschränkung der Verarbeitung (Art. 18 DSGVO)",
              "Datenübertragbarkeit (Art. 20 DSGVO)",
              "Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)",
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-0.5 text-brand">·</span>
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-3">
            Wende dich dafür per E-Mail an{" "}
            <a href="mailto:ne.polonius@gmail.com" className="text-brand hover:underline">
              ne.polonius@gmail.com
            </a>
            .
          </p>
        </section>

        {/* 7 */}
        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground">
            7. Beschwerderecht
          </h2>
          <p>
            Du hast das Recht, dich bei der zuständigen Datenschutzaufsichtsbehörde
            zu beschweren. Für Hamburg ist das:{" "}
            <strong className="text-foreground">
              Der Hamburgische Beauftragte für Datenschutz und Informationsfreiheit
            </strong>{" "}
            (
            <a
              href="https://datenschutz.hamburg.de"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              datenschutz.hamburg.de
            </a>
            ).
          </p>
        </section>

        {/* 8 */}
        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground">
            8. Minderjährige
          </h2>
          <p>
            Project X richtet sich an Schülerinnen und Schüler ab 15 Jahren. Für
            Nutzer unter 16 Jahren ist die Zustimmung eines Erziehungsberechtigten
            erforderlich (Art. 8 DSGVO).
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
