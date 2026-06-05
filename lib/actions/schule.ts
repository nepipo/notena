"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Kategorie } from "@/lib/grades/types";

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
  niveau: "GK" | "LK" = "GK",
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
    if (error) return { ok: false, error: error.message };
    revalidatePath("/dashboard");
    revalidatePath("/noten");
    return { ok: true, id: data.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler." };
  }
}

export async function removeFach(fachId: string): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const supabase = await createClient();
    const { error } = await supabase
      .from("schule_fach")
      .delete()
      .eq("id", fachId)
      .eq("user_id", userId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/dashboard");
    revalidatePath("/noten");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler." };
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
    if (error) return { ok: false, error: error.message };
    revalidatePath("/dashboard");
    revalidatePath("/noten");
    return { ok: true, id: data.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler." };
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
    if (error) return { ok: false, error: error.message };
    revalidatePath("/dashboard");
    revalidatePath("/noten");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler." };
  }
}

export async function updateFach(
  fachId: string,
  updates: {
    niveau?: string;
    farbe?: string | null;
    gewicht_klausur?: number;
    gewicht_muendlich?: number;
    fach_gewicht?: number;
    ausgeschlossen?: boolean;
  },
): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const supabase = await createClient();
    const { error } = await supabase
      .from("schule_fach")
      .update(updates)
      .eq("id", fachId)
      .eq("user_id", userId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler." };
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
    if (error) return { ok: false, error: error.message };
    revalidatePath("/dashboard");
    revalidatePath("/aufgaben");
    revalidatePath("/stundenplan");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler." };
  }
}

export async function removeKlausur(klausurId: string): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const supabase = await createClient();
    const { error } = await supabase
      .from("schule_klausur")
      .delete()
      .eq("id", klausurId)
      .eq("user_id", userId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/dashboard");
    revalidatePath("/aufgaben");
    revalidatePath("/stundenplan");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler." };
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
    if (error) return { ok: false, error: error.message };
    revalidatePath("/dashboard");
    revalidatePath("/einstellungen");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler." };
  }
}

export async function completeOnboarding(
  eingabeModus: "punkte" | "note",
  name?: string,
  klasse?: number | null,
): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const supabase = await createClient();
    const { error } = await supabase
      .from("nutzer_profil")
      .update({
        ...(name !== undefined ? { name: name.trim() || null } : {}),
        ...(klasse !== undefined ? { klasse } : {}),
        eingabe_modus: eingabeModus,
        onboarding_abgeschlossen: true,
      })
      .eq("id", userId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler." };
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
    if (error) return { ok: false, error: error.message };
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler." };
  }
}

export interface NeuesFachInput {
  name: string;
  niveau: string;
  farbe: string | null;
  gewicht_klausur: number;
  gewicht_muendlich: number;
  fach_gewicht: number;
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
        halbjahr: neuesHj,
      }));
      const { error } = await supabase.from("schule_fach").insert(rows);
      if (error) return { ok: false, error: error.message };
    }

    const { error: profilError } = await supabase
      .from("nutzer_profil")
      .update({ aktuelles_halbjahr: neuesHj })
      .eq("id", userId);
    if (profilError) return { ok: false, error: profilError.message };

    revalidatePath("/dashboard");
    revalidatePath("/noten");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler." };
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
    if (error) return { ok: false, error: error.message };
    revalidatePath("/profil");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler." };
  }
}
