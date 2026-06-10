"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireUserId(): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const sub = data?.claims?.sub;
  if (typeof sub !== "string") throw new Error("Nicht angemeldet.");
  return sub;
}

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function addHausaufgabe(params: {
  fachId: string | null;
  beschreibung: string;
  faelligAm: string; // "YYYY-MM-DD"
}): Promise<ActionResult> {
  if (!params.beschreibung.trim()) {
    return { ok: false, error: "Bitte eine Beschreibung eingeben." };
  }
  if (!params.faelligAm) {
    return { ok: false, error: "Fälligkeitsdatum ist Pflicht." };
  }
  try {
    const userId = await requireUserId();
    const supabase = await createClient();
    const { error } = await supabase.from("hausaufgabe").insert({
      user_id: userId,
      fach_id: params.fachId || null,
      beschreibung: params.beschreibung.trim(),
      faellig_am: params.faelligAm,
    });
    if (error) return { ok: false, error: error.message };
    revalidatePath("/aufgaben");
    revalidatePath("/stundenplan");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler." };
  }
}

export async function removeHausaufgabe(id: string): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const supabase = await createClient();
    const { error } = await supabase
      .from("hausaufgabe")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/aufgaben");
    revalidatePath("/stundenplan");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler." };
  }
}

export async function toggleErledigt(
  id: string,
  erledigt: boolean,
): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const supabase = await createClient();
    const { error } = await supabase
      .from("hausaufgabe")
      .update({ erledigt })
      .eq("id", id)
      .eq("user_id", userId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/aufgaben");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler." };
  }
}

export async function updateHausaufgabe(
  id: string,
  updates: { beschreibung?: string; faelligAm?: string },
): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const supabase = await createClient();
    const patch: Record<string, unknown> = {};
    if (updates.beschreibung !== undefined) {
      const trimmed = updates.beschreibung.trim();
      if (!trimmed) return { ok: false, error: "Beschreibung darf nicht leer sein." };
      patch.beschreibung = trimmed;
    }
    if (updates.faelligAm !== undefined) patch.faellig_am = updates.faelligAm;
    const { error } = await supabase
      .from("hausaufgabe")
      .update(patch)
      .eq("id", id)
      .eq("user_id", userId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/aufgaben");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler." };
  }
}
