// lib/email/warteliste.ts
import { Resend } from "resend";

// Benötigte Env-Variablen (.env.local + Vercel):
//   RESEND_API_KEY=re_...
//   RESEND_FROM_EMAIL=hallo@deinedomain.de

const APP_URL = "https://project-x-seven-tawny.vercel.app";

const BETREFF = "Ein Klick fehlt noch — dann bist du auf der Liste.";

/**
 * Schickt die Double-Opt-in-Mail für die Warteliste.
 * Rückgabe { ok: false } statt Exception — der Aufrufer entscheidet,
 * wie er den Fehler dem User zeigt. NICHT verschlucken wie bei welcome.ts:
 * ohne diese Mail gibt es kein Opt-in.
 */
export async function sendWartelisteBestaetigungsMail(
  email: string,
  token: string,
): Promise<{ ok: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    console.error(
      "sendWartelisteBestaetigungsMail: RESEND_API_KEY oder RESEND_FROM_EMAIL fehlt.",
    );
    return { ok: false };
  }

  const link = `${APP_URL}/warteliste/bestaetigen?token=${token}`;

  const text = `Hey — ein Klick fehlt noch.

Bestätige deine E-Mail und du bist auf der Warteliste für die geschlossene Beta:

→ ${link}

Wir melden uns, sobald dein Invite-Code bereit ist. Kein Spam, versprochen.

Falls du dich nicht eingetragen hast, kannst du diese Mail einfach ignorieren.`;

  const html = `<p>Hey — ein Klick fehlt noch.</p>
<p>Bestätige deine E-Mail und du bist auf der Warteliste für die geschlossene Beta:</p>
<p>→ <a href="${link}">E-Mail bestätigen</a></p>
<p>Wir melden uns, sobald dein Invite-Code bereit ist. Kein Spam, versprochen.</p>
<p>Falls du dich nicht eingetragen hast, kannst du diese Mail einfach ignorieren.</p>`;

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: email,
      subject: BETREFF,
      text,
      html,
    });
    if (error) {
      console.error("sendWartelisteBestaetigungsMail: Resend-Fehler:", error);
      return { ok: false };
    }
    return { ok: true };
  } catch (err) {
    console.error("sendWartelisteBestaetigungsMail: Unerwarteter Fehler:", err);
    return { ok: false };
  }
}
