// lib/actions/warteliste.ts
"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWartelisteBestaetigungsMail } from "@/lib/email/warteliste";
import {
  normalisiereEmail,
  WartelisteEmailSchema,
  darfMailSenden,
} from "@/lib/warteliste/logic";

export type WartelisteState = { error?: string; success?: string } | null;

// Immer dieselbe Erfolgsmeldung — niemand kann abfragen, welche
// E-Mails auf der Liste stehen (keine Enumeration).
const ERFOLG =
  "Check dein Postfach — bestätige deine E-Mail und du bist auf der Liste.";
const GENERISCHER_FEHLER =
  "Etwas ist schiefgelaufen. Versuch es gleich nochmal.";

export async function wartelisteEintragen(
  _prevState: WartelisteState,
  formData: FormData,
): Promise<WartelisteState> {
  const email = normalisiereEmail(String(formData.get("email") ?? ""));
  const parsed = WartelisteEmailSchema.safeParse(email);
  if (!parsed.success) {
    return { error: "Bitte gib eine gültige E-Mail-Adresse ein." };
  }

  const supabase = createAdminClient();

  const { data: vorhanden, error: selectError } = await supabase
    .from("warteliste")
    .select("token, bestaetigt_am, letzte_mail_am")
    .eq("email", email)
    .maybeSingle();

  if (selectError) return { error: GENERISCHER_FEHLER };

  if (vorhanden?.bestaetigt_am) return { success: ERFOLG };
  if (vorhanden && !darfMailSenden(vorhanden.letzte_mail_am)) {
    return { success: ERFOLG };
  }

  let token: string | undefined = vorhanden?.token;
  if (!token) {
    const { data: neu, error: insertError } = await supabase
      .from("warteliste")
      .insert({ email })
      .select("token")
      .single();
    if (insertError || !neu) return { error: GENERISCHER_FEHLER };
    token = neu.token;
  }

  const { ok } = await sendWartelisteBestaetigungsMail(email, token!);
  if (!ok) {
    return {
      error:
        "Die Mail konnte gerade nicht gesendet werden. Versuch es in ein paar Minuten nochmal.",
    };
  }

  await supabase
    .from("warteliste")
    .update({ letzte_mail_am: new Date().toISOString() })
    .eq("email", email);

  return { success: ERFOLG };
}

/**
 * Löst den Bestätigungs-Token ein. true auch, wenn schon vorher
 * bestätigt (idempotent — Doppelklick auf den Mail-Link ist ok).
 */
export async function wartelisteBestaetigen(token: string): Promise<boolean> {
  if (!z.uuid().safeParse(token).success) return false;

  const supabase = createAdminClient();

  const { data } = await supabase
    .from("warteliste")
    .update({ bestaetigt_am: new Date().toISOString() })
    .eq("token", token)
    .is("bestaetigt_am", null)
    .select("id");

  if (data?.length) return true;

  const { data: schonBestaetigt } = await supabase
    .from("warteliste")
    .select("id")
    .eq("token", token)
    .not("bestaetigt_am", "is", null)
    .maybeSingle();

  return Boolean(schonBestaetigt);
}
