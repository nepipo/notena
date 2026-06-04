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

export async function addStunde(params: {
  fachId: string | null;
  wochentag: number;
  zeitStart: string;
  zeitEnd: string;
  raum: string | null;
  lehrer: string | null;
  wocheTyp: "A" | "B" | null;
}): Promise<ActionResult> {
  if (params.wochentag < 1 || params.wochentag > 7) {
    return { ok: false, error: "Ungültiger Wochentag." };
  }
  if (!params.zeitStart || !params.zeitEnd) {
    return { ok: false, error: "Start- und Endzeit sind Pflicht." };
  }
  try {
    const userId = await requireUserId();
    const supabase = await createClient();
    const { error } = await supabase.from("stundenplan_stunde").insert({
      user_id: userId,
      fach_id: params.fachId,
      wochentag: params.wochentag,
      zeit_start: params.zeitStart,
      zeit_end: params.zeitEnd,
      raum: params.raum || null,
      lehrer: params.lehrer || null,
      woche_typ: params.wocheTyp,
    });
    if (error) return { ok: false, error: error.message };
    revalidatePath("/stundenplan");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler." };
  }
}

export async function removeStunde(id: string): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const supabase = await createClient();
    const { error } = await supabase
      .from("stundenplan_stunde")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/stundenplan");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler." };
  }
}

export async function setAktuelleWoche(
  woche: "A" | "B",
): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const supabase = await createClient();
    const { error } = await supabase
      .from("nutzer_profil")
      .update({ aktuelle_woche: woche })
      .eq("id", userId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/stundenplan");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler." };
  }
}
