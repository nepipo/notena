"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { GewichtungConfig, Kategorie } from "@/lib/grades/types";
import {
  dbError,
  AddFachSchema,
  AddKlausurSchema,
  HalbjahrSchema,
  NoteInputSchema,
  UpdateFachSchema,
  ApplyOnboardingSchema,
} from "@/lib/validation";
import { getNotensystem } from "@/lib/grades/systems";
import { aktuellesHalbjahr } from "@/lib/grades/halbjahr";
import type { OnboardingData } from "@/lib/onboarding/storage";

async function audit(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  aktion: string,
  entityId?: string,
  entityData?: Record<string, unknown>,
): Promise<void> {
  // Fehler beim Logging blockieren nie die eigentliche Operation
  try {
    await supabase.from("audit_log").insert({ user_id: userId, aktion, entity_id: entityId ?? null, entity_data: entityData ?? null });
  } catch {
    // ignorieren
  }
}

async function requireUserId(): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const sub = data?.claims?.sub;
  if (typeof sub !== "string") throw new Error("Nicht angemeldet.");
  return sub;
}

async function userNotensystem(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase
    .from("nutzer_profil")
    .select("notensystem")
    .eq("id", userId)
    .single();
  return getNotensystem(data?.notensystem ?? "de_0_15");
}

function wertGueltig(wert: number, system: ReturnType<typeof getNotensystem>): boolean {
  if (!Number.isFinite(wert) || wert < system.min || wert > system.max) return false;
  const gerundet = Math.round(wert / system.step) * system.step;
  return Math.abs(gerundet - wert) < 1e-6;
}

export type ActionResult = { ok: true } | { ok: false; error: string };
export type AddFachResult = { ok: true; id: string } | { ok: false; error: string };
export type AddNoteResult = { ok: true; id: string } | { ok: false; error: string };

export async function addFach(
  name: string,
  halbjahr: string,
  niveau: "grund" | "erhoeht" = "grund",
): Promise<AddFachResult> {
  const parsed = AddFachSchema.safeParse({ name, halbjahr, niveau });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }
  try {
    const userId = await requireUserId();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("schule_fach")
      .insert({ user_id: userId, name: parsed.data.name, halbjahr: parsed.data.halbjahr, niveau: parsed.data.niveau })
      .select("id")
      .single();
    if (error) return { ok: false, error: dbError(error) };
    revalidatePath("/dashboard");
    revalidatePath("/noten");
    revalidatePath("/stundenplan");
    revalidatePath("/einstellungen");
    return { ok: true, id: data.id };
  } catch (e) {
    return { ok: false, error: dbError(e) };
  }
}

export async function removeFach(fachId: string): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const supabase = await createClient();
    // Snapshot vor dem Löschen (inkl. Name für Audit-Lesbarkeit)
    const { data: snap } = await supabase.from("schule_fach").select("name, halbjahr, niveau").eq("id", fachId).single();
    const { error } = await supabase
      .from("schule_fach")
      .delete()
      .eq("id", fachId)
      .eq("user_id", userId);
    if (error) return { ok: false, error: dbError(error) };
    await audit(supabase, userId, "fach_loeschen", fachId, snap ?? undefined);
    revalidatePath("/dashboard");
    revalidatePath("/noten");
    revalidatePath("/stundenplan");
    revalidatePath("/einstellungen");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: dbError(e) };
  }
}

export async function addNote(
  fachId: string,
  punkte: number,
  kategorie: Kategorie,
  bezeichnung?: string,
  gewicht?: number,
): Promise<AddNoteResult> {
  const parsed = NoteInputSchema.safeParse({ fachId, kategorie, bezeichnung, gewicht });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }
  try {
    const userId = await requireUserId();
    const supabase = await createClient();
    const system = await userNotensystem(supabase, userId);
    if (!wertGueltig(punkte, system)) {
      return { ok: false, error: `Note muss zwischen ${system.min} und ${system.max} liegen.` };
    }
    const { data, error } = await supabase.from("schule_note").insert({
      user_id: userId,
      fach_id: parsed.data.fachId,
      punkte,
      kategorie: parsed.data.kategorie,
      bezeichnung: parsed.data.bezeichnung?.trim() || null,
      gewicht: parsed.data.gewicht ?? 1,
    }).select("id").single();
    if (error) return { ok: false, error: dbError(error) };
    revalidatePath("/dashboard");
    revalidatePath("/noten");
    return { ok: true, id: data.id };
  } catch (e) {
    return { ok: false, error: dbError(e) };
  }
}

export async function updateNote(
  noteId: string,
  punkte: number,
  kategorie: Kategorie,
  bezeichnung?: string,
  gewicht?: number,
): Promise<ActionResult> {
  const parsed = NoteInputSchema.omit({ fachId: true }).safeParse({ kategorie, bezeichnung, gewicht });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }
  try {
    const userId = await requireUserId();
    const supabase = await createClient();
    const system = await userNotensystem(supabase, userId);
    if (!wertGueltig(punkte, system)) {
      return { ok: false, error: `Note muss zwischen ${system.min} und ${system.max} liegen.` };
    }
    const { error } = await supabase
      .from("schule_note")
      .update({
        punkte,
        kategorie: parsed.data.kategorie,
        bezeichnung: parsed.data.bezeichnung?.trim() || null,
        gewicht: parsed.data.gewicht ?? 1,
      })
      .eq("id", noteId)
      .eq("user_id", userId);
    if (error) return { ok: false, error: dbError(error) };
    revalidatePath("/dashboard");
    revalidatePath("/noten");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: dbError(e) };
  }
}

export async function removeNote(noteId: string): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const supabase = await createClient();
    const { error } = await supabase
      .from("schule_note")
      .delete()
      .eq("id", noteId)
      .eq("user_id", userId);
    if (error) return { ok: false, error: dbError(error) };
    revalidatePath("/dashboard");
    revalidatePath("/noten");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: dbError(e) };
  }
}

export async function updateFach(
  fachId: string,
  updates: {
    name?: string;
    niveau?: string;
    farbe?: string | null;
    gewicht_klausur?: number;
    gewicht_muendlich?: number;
    fach_gewicht?: number;
    ausgeschlossen?: boolean;
    gewichtung_config?: GewichtungConfig | null;
    parent_fach_id?: string | null;
    subfach_gewicht?: number | null;
  },
): Promise<ActionResult> {
  const parsed = UpdateFachSchema.safeParse(updates);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }
  try {
    const userId = await requireUserId();
    const supabase = await createClient();

    // Sicherheits-Check: parent_fach_id darf nur auf eigene Fächer zeigen
    if (parsed.data.parent_fach_id) {
      const { data: parentCheck } = await supabase
        .from("schule_fach")
        .select("id")
        .eq("id", parsed.data.parent_fach_id)
        .eq("user_id", userId)
        .single();
      if (!parentCheck) return { ok: false, error: "Übergeordnetes Fach nicht gefunden." };
    }

    const { error } = await supabase
      .from("schule_fach")
      .update(parsed.data)
      .eq("id", fachId)
      .eq("user_id", userId);
    if (error) return { ok: false, error: dbError(error) };
    revalidatePath("/dashboard");
    revalidatePath("/noten");
    revalidatePath("/stundenplan");
    revalidatePath("/einstellungen");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: dbError(e) };
  }
}

export async function addKlausur(
  titel: string,
  datum: string,
  fachId?: string,
): Promise<ActionResult & { id?: string }> {
  const parsed = AddKlausurSchema.safeParse({ titel, datum, fachId });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }
  try {
    const userId = await requireUserId();
    const supabase = await createClient();
    const { data: neu, error } = await supabase.from("schule_klausur").insert({
      user_id: userId,
      titel: parsed.data.titel,
      datum: parsed.data.datum,
      fach_id: parsed.data.fachId ?? null,
    }).select("id").single();
    if (error) return { ok: false, error: dbError(error) };
    revalidatePath("/dashboard");
    revalidatePath("/aufgaben");
    revalidatePath("/stundenplan");
    return { ok: true, id: neu.id };
  } catch (e) {
    return { ok: false, error: dbError(e) };
  }
}

export async function removeKlausur(klausurId: string): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const supabase = await createClient();
    const { data: snap } = await supabase.from("schule_klausur").select("titel, datum, fach_id").eq("id", klausurId).single();
    const { error } = await supabase
      .from("schule_klausur")
      .delete()
      .eq("id", klausurId)
      .eq("user_id", userId);
    if (error) return { ok: false, error: dbError(error) };
    await audit(supabase, userId, "klausur_loeschen", klausurId, snap ?? undefined);
    revalidatePath("/dashboard");
    revalidatePath("/aufgaben");
    revalidatePath("/stundenplan");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: dbError(e) };
  }
}

/**
 * Schreibt die im Onboarding gesammelten Daten in einem Rutsch:
 * Profilfelder + alle Faecher (Batch-Insert, keine N+1-Loop) und setzt
 * onboarding_abgeschlossen=true. Wird nach dem ersten Login aus dem
 * localStorage gespeist (anonymes Onboarding) ODER direkt im eingeloggten
 * Fallback-Durchlauf aufgerufen.
 */
export async function applyOnboarding(
  input: OnboardingData,
): Promise<ActionResult> {
  const parsed = ApplyOnboardingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }
  const data = parsed.data;

  try {
    const userId = await requireUserId();
    const supabase = await createClient();

    // Klasse 5–10 → 1-6 Notensystem, Klasse 11–13 → 0-15 Punkte
    const notensystem = data.klasse <= 10 ? "de_1_6" : "de_0_15";

    const { error: profilError } = await supabase
      .from("nutzer_profil")
      .update({
        name: data.vorname,
        nachname: data.nachname ?? null,
        geburtsdatum: data.geburtsdatum ?? null,
        klasse: data.klasse,
        land: data.land ?? null,
        bundesland: data.bundesland ?? null,
        schulform: data.schulform ?? null,
        schule: data.schule ?? null,
        notensystem,
        onboarding_abgeschlossen: true,
      })
      .eq("id", userId);
    if (profilError) return { ok: false, error: dbError(profilError) };

    if (data.faecher.length > 0) {
      const halbjahr = aktuellesHalbjahr();
      const rows = data.faecher.map((f) => ({
        user_id: userId,
        name: f.name,
        halbjahr,
        niveau: f.niveau,
      }));
      const { error: fachError } = await supabase.from("schule_fach").insert(rows);
      if (fachError) return { ok: false, error: dbError(fachError) };
    }

    revalidatePath("/dashboard");
    revalidatePath("/noten");
    revalidatePath("/stundenplan");
    revalidatePath("/einstellungen");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: dbError(e) };
  }
}

export async function setHalbjahr(hj: string): Promise<ActionResult> {
  if (!HalbjahrSchema.safeParse(hj).success) {
    return { ok: false, error: "Ungültiges Halbjahr-Format." };
  }
  try {
    const userId = await requireUserId();
    const supabase = await createClient();
    const { error } = await supabase
      .from("nutzer_profil")
      .update({ aktuelles_halbjahr: hj })
      .eq("id", userId);
    if (error) return { ok: false, error: dbError(error) };
    revalidatePath("/dashboard");
    revalidatePath("/noten");
    revalidatePath("/stundenplan");
    revalidatePath("/einstellungen");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: dbError(e) };
  }
}

export interface NeuesFachInput {
  name: string;
  niveau: string;
  farbe: string | null;
  fach_gewicht: number;
  gewichtung_config?: GewichtungConfig | null;
}

export async function neuesHalbjahr(
  neuesHj: string,
  faecher: NeuesFachInput[],
): Promise<ActionResult> {
  if (!HalbjahrSchema.safeParse(neuesHj).success) {
    return { ok: false, error: "Ungültiges Halbjahr-Format." };
  }
  try {
    const userId = await requireUserId();
    const supabase = await createClient();

    if (faecher.length > 0) {
      const rows = faecher.map((f) => ({
        user_id: userId,
        name: f.name,
        niveau: f.niveau,
        farbe: f.farbe,
        fach_gewicht: f.fach_gewicht,
        gewichtung_config: f.gewichtung_config ?? null,
        halbjahr: neuesHj,
      }));
      const { error } = await supabase.from("schule_fach").insert(rows);
      if (error) return { ok: false, error: dbError(error) };
    }

    const { error: profilError } = await supabase
      .from("nutzer_profil")
      .update({ aktuelles_halbjahr: neuesHj })
      .eq("id", userId);
    if (profilError) return { ok: false, error: dbError(profilError) };

    revalidatePath("/dashboard");
    revalidatePath("/noten");
    revalidatePath("/stundenplan");
    revalidatePath("/einstellungen");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: dbError(e) };
  }
}

export async function setBriefingAktiv(aktiv: boolean): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const supabase = await createClient();
    const { error } = await supabase
      .from("nutzer_profil")
      .update({ briefing_aktiv: aktiv })
      .eq("id", userId);
    if (error) return { ok: false, error: dbError(error) };
    revalidatePath("/dashboard");
    revalidatePath("/einstellungen");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: dbError(e) };
  }
}

export async function saveDefaultGewichtung(
  config: GewichtungConfig,
): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const supabase = await createClient();
    const { error } = await supabase
      .from("nutzer_profil")
      .update({ default_gewichtung: config })
      .eq("id", userId);
    if (error) return { ok: false, error: dbError(error) };
    revalidatePath("/einstellungen");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: dbError(e) };
  }
}

export async function applyGewichtungAufAlleFaecher(
  config: GewichtungConfig,
  halbjahr: string,
): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const supabase = await createClient();
    const { error } = await supabase
      .from("schule_fach")
      .update({ gewichtung_config: config })
      .eq("user_id", userId)
      .eq("halbjahr", halbjahr);
    if (error) return { ok: false, error: dbError(error) };
    revalidatePath("/noten");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: dbError(e) };
  }
}

export async function updateProfil(
  name: string,
  klasse: number | null,
  schule: string,
): Promise<ActionResult> {
  if (klasse !== null && (klasse < 5 || klasse > 13)) {
    return { ok: false, error: "Klasse muss zwischen 5 und 13 liegen." };
  }
  try {
    const userId = await requireUserId();
    const supabase = await createClient();
    const { error } = await supabase
      .from("nutzer_profil")
      .update({
        name: name.trim() || null,
        klasse,
        schule: schule.trim() || null,
      })
      .eq("id", userId);
    if (error) return { ok: false, error: dbError(error) };
    revalidatePath("/profil");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: dbError(e) };
  }
}

export async function saveBundesland(bundesland: string | null): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const supabase = await createClient();
    const { error } = await supabase
      .from("nutzer_profil")
      .update({ bundesland: bundesland || null })
      .eq("id", userId);
    if (error) return { ok: false, error: dbError(error) };
    revalidatePath("/dashboard");
    revalidatePath("/einstellungen");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: dbError(e) };
  }
}

export async function loescheHalbjahr(hj: string): Promise<ActionResult> {
  if (!hj.trim()) return { ok: false, error: "Halbjahr fehlt." };
  try {
    const userId = await requireUserId();
    const supabase = await createClient();

    // Snapshot: wie viele Fächer/Noten werden gelöscht (für Audit)
    const { data: faecherSnap } = await supabase.from("schule_fach").select("id, name").eq("user_id", userId).eq("halbjahr", hj);
    const { count: noteCount } = await supabase.from("schule_note").select("id", { count: "exact", head: true }).eq("user_id", userId).in("fach_id", (faecherSnap ?? []).map((f) => f.id));

    // Fächer löschen — Noten kaskadieren automatisch (ON DELETE CASCADE)
    const { error: faecherError } = await supabase
      .from("schule_fach")
      .delete()
      .eq("user_id", userId)
      .eq("halbjahr", hj);
    if (faecherError) return { ok: false, error: dbError(faecherError) };
    await audit(supabase, userId, "halbjahr_loeschen", hj, { halbjahr: hj, faecher: faecherSnap?.length ?? 0, noten: noteCount ?? 0 });

    // Falls das gelöschte HJ das aktive war → auf vorheriges wechseln
    const { data: profil } = await supabase
      .from("nutzer_profil")
      .select("aktuelles_halbjahr")
      .eq("id", userId)
      .single();

    if (profil?.aktuelles_halbjahr === hj) {
      const { vorherigesHalbjahr } = await import("@/lib/grades/halbjahr");
      const { error: profilError } = await supabase
        .from("nutzer_profil")
        .update({ aktuelles_halbjahr: vorherigesHalbjahr(hj) })
        .eq("id", userId);
      if (profilError) return { ok: false, error: dbError(profilError) };
    }

    revalidatePath("/dashboard");
    revalidatePath("/noten");
    revalidatePath("/einstellungen");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: dbError(e) };
  }
}

export async function setKlausurErinnerungTage(
  tage: number[],
): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const supabase = await createClient();
    const { error } = await supabase
      .from("nutzer_profil")
      .update({ klausur_erinnerung_tage: tage })
      .eq("id", userId);
    if (error) return { ok: false, error: dbError(error) };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: dbError(e) };
  }
}

export async function updateKlausur(
  klausurId: string,
  updates: { titel?: string; datum?: string },
): Promise<ActionResult> {
  if (updates.titel !== undefined && !updates.titel.trim()) {
    return { ok: false, error: "Titel darf nicht leer sein." };
  }
  try {
    const userId = await requireUserId();
    const supabase = await createClient();
    const patch: Record<string, unknown> = {};
    if (updates.titel !== undefined) patch.titel = updates.titel.trim();
    if (updates.datum !== undefined) patch.datum = updates.datum;
    const { error } = await supabase
      .from("schule_klausur")
      .update(patch)
      .eq("id", klausurId)
      .eq("user_id", userId);
    if (error) return { ok: false, error: dbError(error) };
    revalidatePath("/dashboard");
    revalidatePath("/aufgaben");
    revalidatePath("/stundenplan");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: dbError(e) };
  }
}

export async function noteAnzahl(): Promise<number> {
  const userId = await requireUserId();
  const supabase = await createClient();
  const { count } = await supabase
    .from("schule_note")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  return count ?? 0;
}

const NOTENSYSTEM_IDS = ["de_0_15", "de_1_6", "ch_1_6", "at_1_5", "ib_1_7"] as const;

export async function setNotensystem(id: string): Promise<ActionResult> {
  if (!(NOTENSYSTEM_IDS as readonly string[]).includes(id)) {
    return { ok: false, error: "Unbekanntes Notensystem." };
  }
  try {
    const userId = await requireUserId();
    const supabase = await createClient();
    const { error } = await supabase
      .from("nutzer_profil")
      .update({ notensystem: id })
      .eq("id", userId);
    if (error) return { ok: false, error: dbError(error) };
    revalidatePath("/noten");
    revalidatePath("/dashboard");
    revalidatePath("/einstellungen");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: dbError(e) };
  }
}
