import { z } from "zod";

// ── Gemeinsame Typen ────────────────────────────────────────────────────

export const KategorieSchema = z.enum(["klausur", "muendlich", "sonstig"]);

export const FachIdSchema = z.string().uuid("Ungültige Fach-ID");

export const NoteIdSchema = z.string().uuid("Ungültige Noten-ID");

export const KlausurIdSchema = z.string().uuid("Ungültige Klausur-ID");

// ── Schule ──────────────────────────────────────────────────────────────

export const AddFachSchema = z.object({
  name: z.string().min(1, "Bitte einen Fachnamen eingeben.").max(100),
  halbjahr: z.string().regex(/^\d{2}\/[12]$/, "Ungültiges Halbjahr-Format."),
  niveau: z.enum(["grund", "erhoeht"]).default("grund"),
});

export const AddNoteSchema = z.object({
  fachId: FachIdSchema,
  punkte: z.number().min(0).max(15), // .int() entfällt (CH-Kommas); Per-System-Check in der Action
  kategorie: KategorieSchema,
  bezeichnung: z.string().max(200).optional(),
  gewicht: z.number().positive().max(10).optional(),
});

export const AddKlausurSchema = z.object({
  titel: z.string().min(1, "Bitte einen Titel eingeben.").max(200),
  datum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ungültiges Datum."),
  fachId: FachIdSchema.optional(),
});

export const UpdateFachSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  niveau: z.enum(["grund", "erhoeht"]).optional(),
  farbe: z.string().max(20).nullable().optional(),
  gewicht_klausur: z.number().min(0).max(1).optional(),
  gewicht_muendlich: z.number().min(0).max(1).optional(),
  fach_gewicht: z.number().min(0).max(10).optional(),
  ausgeschlossen: z.boolean().optional(),
  gewichtung_config: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const HalbjahrSchema = z.string().regex(/^\d{2}\/[12]$/, "Ungültiges Halbjahr-Format.");

export const UpdateProfilSchema = z.object({
  name: z.string().max(100),
  klasse: z.number().int().min(5).max(13).nullable(),
  schule: z.string().max(200),
});

// ── Hilfsfunktion: Supabase-Fehler nicht leaken ─────────────────────────

export function dbError(err: unknown): string {
  if (process.env.NODE_ENV === "development") {
    return err instanceof Error ? err.message : "Datenbankfehler.";
  }
  return "Ein interner Fehler ist aufgetreten. Bitte versuche es erneut.";
}
