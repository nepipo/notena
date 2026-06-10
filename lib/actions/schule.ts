"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { GewichtungConfig, Kategorie } from "@/lib/grades/types";
import { dbError, UpdateFachSchema } from "@/lib/validation";

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

export type ActionResult = { ok: true } | { ok: false; error: string };
export type AddFachResult = { ok: true; id: string } | { ok: false; error: string };
export type AddNoteResult = { ok: true; id: string } | { ok: false; error: string };

export async function addFach(
  name: string,
  halbjahr: string,
  niveau: "grund" | "erhoeht" = "grund",
): Promise<AddFachResult> {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Bitte einen Fachnamen eingeben." };
  try {
    const userId = await requireUserId();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("schule_fach")
      .insert({ user_id: userId, name: trimmed, halbjahr, niveau })
      .select("id")
      .single();
    if (error) return { ok: false, error: dbError(error) };
    revalidatePath("/dashboard");
    revalidatePath("/noten");
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
  if (!Number.isFinite(punkte) || punkte < 0 || punkte > 15) {
    return { ok: false, error: "Punkte muessen zwischen 0 und 15 liegen." };
  }
  try {
    const userId = await requireUserId();
    const supabase = await createClient();
    const { data, error } = await supabase.from("schule_note").insert({
      user_id: userId,
      fach_id: fachId,
      punkte: Math.round(punkte),
      kategorie,
      bezeichnung: bezeichnung?.trim() || null,
      gewicht: gewicht ?? 1,
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
  if (!Number.isFinite(punkte) || punkte < 0 || punkte > 15) {
    return { ok: false, error: "Punkte müssen zwischen 0 und 15 liegen." };
  }
  try {
    const userId = await requireUserId();
    const supabase = await createClient();
    const { error } = await supabase
      .from("schule_note")
      .update({
        punkte: Math.round(punkte),
        kategorie,
        bezeichnung: bezeichnung?.trim() || null,
        gewicht: gewicht ?? 1,
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
  },
): Promise<ActionResult> {
  const parsed = UpdateFachSchema.safeParse(updates);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }
  try {
    const userId = await requireUserId();
    const supabase = await createClient();
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
): Promise<ActionResult> {
  const trimmed = titel.trim();
  if (!trimmed) return { ok: false, error: "Bitte einen Titel eingeben." };
  if (!datum) return { ok: false, error: "Bitte ein Datum angeben." };
  try {
    const userId = await requireUserId();
    const supabase = await createClient();
    const { error } = await supabase.from("schule_klausur").insert({
      user_id: userId,
      titel: trimmed,
      datum,
      fach_id: fachId ?? null,
    });
    if (error) return { ok: false, error: dbError(error) };
    revalidatePath("/dashboard");
    revalidatePath("/aufgaben");
    revalidatePath("/stundenplan");
    return { ok: true };
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

export async function updatePraeferenzen(
  eingabeModus: "punkte" | "note",
): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const supabase = await createClient();
    const { error } = await supabase
      .from("nutzer_profil")
      .update({ eingabe_modus: eingabeModus })
      .eq("id", userId);
    if (error) return { ok: false, error: dbError(error) };
    revalidatePath("/dashboard");
    revalidatePath("/einstellungen");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: dbError(e) };
  }
}

export async function completeOnboarding(
  name: string,
  klasse: number | null,
  eingabeModus: "punkte" | "note",
  bundesland?: string | null,
): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const supabase = await createClient();
    const { error } = await supabase
      .from("nutzer_profil")
      .update({
        name: name.trim() || null,
        klasse,
        eingabe_modus: eingabeModus,
        bundesland: bundesland ?? null,
        onboarding_abgeschlossen: true,
      })
      .eq("id", userId);
    if (error) return { ok: false, error: dbError(error) };
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: dbError(e) };
  }
}

export async function setHalbjahr(hj: string): Promise<ActionResult> {
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
  gewicht_klausur: number;
  gewicht_muendlich: number;
  fach_gewicht: number;
  gewichtung_config?: GewichtungConfig | null;
}

export async function neuesHalbjahr(
  neuesHj: string,
  faecher: NeuesFachInput[],
): Promise<ActionResult> {
  if (!neuesHj.trim()) return { ok: false, error: "Halbjahr fehlt." };
  try {
    const userId = await requireUserId();
    const supabase = await createClient();

    if (faecher.length > 0) {
      const rows = faecher.map((f) => ({
        user_id: userId,
        name: f.name,
        niveau: f.niveau,
        farbe: f.farbe,
        gewicht_klausur: f.gewicht_klausur,
        gewicht_muendlich: f.gewicht_muendlich,
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
