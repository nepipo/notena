import { Resend } from "resend";

// Benötigte Env-Variablen (.env.local):
//   RESEND_API_KEY=re_...
//   RESEND_FROM_EMAIL=hallo@deinedomain.de

const APP_URL = "https://project-x-seven-tawny.vercel.app";

const BETREFF = "Dein Account ist bereit.";

const TEXT = `Hey — dein Account ist aktiv.

Trag jetzt deine Fächer ein und dein Notenrechner ist in 2 Minuten einsatzbereit.

→ Zur App: ${APP_URL}/onboarding

Bei Fragen: einfach auf diese Mail antworten.`;

const HTML = `<p>Hey — dein Account ist aktiv.</p>
<p>Trag jetzt deine Fächer ein und dein Notenrechner ist in 2 Minuten einsatzbereit.</p>
<p>→ <a href="${APP_URL}/onboarding">Zur App</a></p>
<p>Bei Fragen: einfach auf diese Mail antworten.</p>`;

/**
 * Schickt die Welcome-Mail nach erfolgreicher E-Mail-Bestätigung.
 * Fehler werden nur geloggt, nie propagiert — die Mail darf den
 * Auth-Flow niemals blockieren oder brechen.
 */
export async function sendWelcomeMail(email: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    console.error(
      "sendWelcomeMail: RESEND_API_KEY oder RESEND_FROM_EMAIL fehlt — Mail übersprungen."
    );
    return;
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: email,
      subject: BETREFF,
      text: TEXT,
      html: HTML,
    });
    if (error) {
      console.error("sendWelcomeMail: Resend-Fehler:", error);
    }
  } catch (err) {
    console.error("sendWelcomeMail: Unerwarteter Fehler:", err);
  }
}
