"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { AddHausaufgabeSchema, UpdateHausaufgabeSchema, dbError } from "@/lib/validation";

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
}): Promise<ActionResult & { id?: string }> {
  const parsed = AddHausaufgabeSchema.safeParse({
    fachId: params.fachId || null,
    beschreibung: params.beschreibung,
    faelligAm: params.faelligAm,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }
  try {
    const userId = await requireUserId();
    const supabase = await createClient();
    const { data: neu, error } = await supabase.from("hausaufgabe").insert({
      user_id: userId,
      fach_id: parsed.data.fachId,
      beschreibung: parsed.data.beschreibung,
      faellig_am: parsed.data.faelligAm,
    }).select("id").single();
    if (error) return { ok: false, error: dbError(error) };
    revalidatePath("/aufgaben");
    revalidatePath("/stundenplan");
    return { ok: true, id: neu.id };
  } catch (e) {
    return { ok: false, error: dbError(e) };
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
    if (error) return { ok: false, error: dbError(error) };
    revalidatePath("/aufgaben");
    revalidatePath("/stundenplan");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: dbError(e) };
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
    if (error) return { ok: false, error: dbError(error) };
    revalidatePath("/aufgaben");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: dbError(e) };
  }
}

export async function updateHausaufgabe(
  id: string,
  updates: { beschreibung?: string; faelligAm?: string },
): Promise<ActionResult> {
  const parsed = UpdateHausaufgabeSchema.safeParse(updates);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }
  try {
    const userId = await requireUserId();
    const supabase = await createClient();
    const patch: Record<string, unknown> = {};
    if (parsed.data.beschreibung !== undefined) patch.beschreibung = parsed.data.beschreibung;
    if (parsed.data.faelligAm !== undefined) patch.faellig_am = parsed.data.faelligAm;
    const { error } = await supabase
      .from("hausaufgabe")
      .update(patch)
      .eq("id", id)
      .eq("user_id", userId);
    if (error) return { ok: false, error: dbError(error) };
    revalidatePath("/aufgaben");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: dbError(e) };
  }
}
