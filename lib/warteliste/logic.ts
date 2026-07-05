// lib/warteliste/logic.ts
import { z } from "zod";

export function normalisiereEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function normalisiereCode(raw: string): string {
  return raw.trim().toUpperCase();
}

export const WartelisteEmailSchema = z
  .email("Bitte gib eine gültige E-Mail-Adresse ein.")
  .max(254, "E-Mail ist zu lang.");

/** Max. 1 Bestätigungsmail pro 10 Minuten und E-Mail-Adresse. */
export const MAIL_THROTTLE_MS = 10 * 60 * 1000;

export function darfMailSenden(
  letzteMailAm: string | null,
  jetzt: Date = new Date(),
): boolean {
  if (!letzteMailAm) return true;
  return jetzt.getTime() - new Date(letzteMailAm).getTime() >= MAIL_THROTTLE_MS;
}
