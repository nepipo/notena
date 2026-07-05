import { z } from "zod";
import { BUILTIN_KATEGORIEN } from "./grades/types";

// ── Gemeinsame Typen ────────────────────────────────────────────────────

/** Builtin-Kategorie ODER Custom-Kategorie-ID (Format aus lib/actions/kategorien.ts). */
export const KategorieSchema = z
  .string()
  .refine(
    (k) => (BUILTIN_KATEGORIEN as readonly string[]).includes(k) || /^custom_[0-9a-f]{12}$/.test(k),
    "Unbekannte Bewertungsart.",
  );

export const FachIdSchema = z.string().uuid("Ungültige Fach-ID");

export const NoteIdSchema = z.string().uuid("Ungültige Noten-ID");

export const KlausurIdSchema = z.string().uuid("Ungültige Klausur-ID");

// ── Schule ──────────────────────────────────────────────────────────────

/** Halbjahr-Format wie aus lib/grades/halbjahr.ts: "2025/26-1". */
export const HalbjahrSchema = z
  .string()
  .regex(/^\d{4}\/\d{2}-[12]$/, "Ungültiges Halbjahr-Format.");

export const AddFachSchema = z.object({
  name: z.string().trim().min(1, "Bitte einen Fachnamen eingeben.").max(100, "Fachname ist zu lang (max. 100 Zeichen)."),
  halbjahr: HalbjahrSchema,
  niveau: z.enum(["grund", "erhoeht"]).default("grund"),
});

export const NoteInputSchema = z.object({
  fachId: FachIdSchema,
  // Bereichs-Check der Punkte passiert pro Notensystem in der Action (wertGueltig)
  kategorie: KategorieSchema,
  bezeichnung: z.string().max(200, "Bezeichnung ist zu lang (max. 200 Zeichen).").optional(),
  gewicht: z.number().positive("Gewicht muss größer als 0 sein.").max(10, "Gewicht maximal 10.").optional(),
});

export const AddKlausurSchema = z.object({
  titel: z.string().trim().min(1, "Bitte einen Titel eingeben.").max(200, "Titel ist zu lang (max. 200 Zeichen)."),
  datum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ungültiges Datum."),
  fachId: FachIdSchema.optional(),
});

export const UpdateFachSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  niveau: z.enum(["grund", "erhoeht"]).optional(),
  farbe: z.string().max(20).nullable().optional(),
  gewicht_klausur: z.number().min(0).max(1).optional(),
  gewicht_muendlich: z.number().min(0).optional(),
  fach_gewicht: z.number().min(0).max(10).optional(),
  ausgeschlossen: z.boolean().optional(),
  gewichtung_config: z.record(z.string(), z.unknown()).nullable().optional(),
  parent_fach_id: z.string().uuid().nullable().optional(),
  subfach_gewicht: z.number().min(0).max(1).nullable().optional(),
});

// ── Onboarding ──────────────────────────────────────────────────────────

export const BUNDESLAND_CODES = [
  "BW", "BY", "BE", "BB", "HB", "HH", "HE", "MV",
  "NI", "NW", "RP", "SL", "SN", "ST", "SH", "TH",
] as const;

export const SCHULFORM_CODES = [
  "gymnasium", "berufsschule", "stadtteilschule", "andere",
] as const;

export const ApplyOnboardingSchema = z.object({
  vorname: z.string().trim().min(1, "Bitte deinen Vornamen eingeben.").max(100),
  nachname: z.string().trim().max(100).nullable().optional(),
  geburtsdatum: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Ungültiges Datum.")
    .nullable()
    .optional(),
  klasse: z.number().int().min(5).max(13),
  land: z.string().max(10).nullable().optional(),
  bundesland: z.enum(BUNDESLAND_CODES).nullable().optional(),
  schulform: z.enum(SCHULFORM_CODES).nullable().optional(),
  schule: z.string().trim().max(200).nullable().optional(),
  faecher: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(100),
        niveau: z.enum(["grund", "erhoeht"]),
      }),
    )
    .max(30, "Zu viele Fächer."),
});

// ── Hilfsfunktion: Supabase-Fehler nicht leaken ─────────────────────────

export function dbError(err: unknown): string {
  if (process.env.NODE_ENV === "development") {
    return err instanceof Error ? err.message : "Datenbankfehler.";
  }
  return "Ein interner Fehler ist aufgetreten. Bitte versuche es erneut.";
}
