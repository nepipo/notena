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

export async function addFach(
  name: string,
  halbjahr: string,
): Promise<ActionResult> {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Bitte einen Fachnamen eingeben." };
  try {
    const userId = await requireUserId();
    const supabase = await createClient();
    const { error } = await supabase
      .from("schule_fach")
      .insert({ user_id: userId, name: trimmed, halbjahr });
    if (error) return { ok: false, error: error.message };
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler." };
  }
}

export async function removeFach(fachId: string): Promise<ActionResult> {
  try {
    await requireUserId();
    const supabase = await createClient();
    const { error } = await supabase
      .from("schule_fach")
      .delete()
      .eq("id", fachId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler." };
  }
}

export async function addNote(
  fachId: string,
  punkte: number,
  kategorie: Kategorie,
): Promise<ActionResult> {
  if (!Number.isFinite(punkte) || punkte < 0 || punkte > 15) {
    return { ok: false, error: "Punkte muessen zwischen 0 und 15 liegen." };
  }
  try {
    const userId = await requireUserId();
    const supabase = await createClient();
    const { error } = await supabase.from("schule_note").insert({
      user_id: userId,
      fach_id: fachId,
      punkte: Math.round(punkte),
      kategorie,
    });
    if (error) return { ok: false, error: error.message };
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler." };
  }
}

export async function removeNote(noteId: string): Promise<ActionResult> {
  try {
    await requireUserId();
    const supabase = await createClient();
    const { error } = await supabase
      .from("schule_note")
      .delete()
      .eq("id", noteId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler." };
  }
}
