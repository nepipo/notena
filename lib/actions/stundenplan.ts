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

// ── Halbjahr-Actions ──────────────────────────────────────────────────────────

export async function createHalbjahr(
  bezeichnung: string,
  kopierenVonId?: string,
): Promise<ActionResult & { id?: string }> {
  if (!bezeichnung.trim()) return { ok: false, error: "Bezeichnung darf nicht leer sein." };
  try {
    const userId = await requireUserId();
    const supabase = await createClient();

    // Alle anderen auf inaktiv setzen
    await supabase
      .from("stundenplan_halbjahr")
      .update({ aktiv: false })
      .eq("user_id", userId);

    const { data: neues, error: hjErr } = await supabase
      .from("stundenplan_halbjahr")
      .insert({ user_id: userId, bezeichnung: bezeichnung.trim(), aktiv: true })
      .select("id")
      .single();
    if (hjErr || !neues) return { ok: false, error: hjErr?.message ?? "Fehler beim Erstellen." };

    // Optional: Stunden aus einem anderen Halbjahr kopieren (ohne Entfälle)
    if (kopierenVonId) {
      const { data: altStunden } = await supabase
        .from("stundenplan_stunde")
        .select("*")
        .eq("user_id", userId)
        .eq("halbjahr_id", kopierenVonId);
      if (altStunden?.length) {
        const kopien = altStunden.map(({ id: _id, created_at: _ca, ...rest }: Record<string, unknown>) => ({
          ...rest,
          halbjahr_id: neues.id,
        }));
        const { error: copyErr } = await supabase.from("stundenplan_stunde").insert(kopien);
        if (copyErr) return { ok: false, error: copyErr.message };
      }
    }

    revalidatePath("/stundenplan");
    return { ok: true, id: neues.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler." };
  }
}

export async function setAktivesHalbjahr(id: string): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const supabase = await createClient();
    await supabase
      .from("stundenplan_halbjahr")
      .update({ aktiv: false })
      .eq("user_id", userId);
    const { error } = await supabase
      .from("stundenplan_halbjahr")
      .update({ aktiv: true })
      .eq("id", id)
      .eq("user_id", userId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/stundenplan");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler." };
  }
}

// ── Stunden-Actions ───────────────────────────────────────────────────────────

export async function addStunde(params: {
  fachId: string | null;
  bezeichnung: string | null;
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

    // Aktives Halbjahr ermitteln oder bei Bedarf neu anlegen
    let { data: aktiv } = await supabase
      .from("stundenplan_halbjahr")
      .select("id")
      .eq("user_id", userId)
      .eq("aktiv", true)
      .single();

    if (!aktiv) {
      const { data: neues, error: hjErr } = await supabase
        .from("stundenplan_halbjahr")
        .insert({ user_id: userId, bezeichnung: "Aktuell", aktiv: true })
        .select("id")
        .single();
      if (hjErr || !neues) return { ok: false, error: hjErr?.message ?? "Kein aktives Halbjahr." };
      aktiv = neues;
    }

    const { error } = await supabase.from("stundenplan_stunde").insert({
      user_id: userId,
      halbjahr_id: aktiv.id,
      fach_id: params.fachId,
      bezeichnung: params.bezeichnung || null,
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

export async function updateStunde(
  id: string,
  params: {
    fachId: string | null;
    bezeichnung: string | null;
    wochentag: number;
    zeitStart: string;
    zeitEnd: string;
    raum: string | null;
    lehrer: string | null;
    wocheTyp: "A" | "B" | null;
  },
): Promise<ActionResult> {
  if (params.wochentag < 1 || params.wochentag > 7) {
    return { ok: false, error: "Ungültiger Wochentag." };
  }
  if (!params.zeitStart || !params.zeitEnd) {
    return { ok: false, error: "Start- und Endzeit sind Pflicht." };
  }
  try {
    const userId = await requireUserId();
    const supabase = await createClient();
    const { error } = await supabase
      .from("stundenplan_stunde")
      .update({
        fach_id: params.fachId,
        bezeichnung: params.bezeichnung || null,
        wochentag: params.wochentag,
        zeit_start: params.zeitStart,
        zeit_end: params.zeitEnd,
        raum: params.raum || null,
        lehrer: params.lehrer || null,
        woche_typ: params.wocheTyp,
      })
      .eq("id", id)
      .eq("user_id", userId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/stundenplan");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler." };
  }
}

export async function addEntfall(
  stundeId: string,
  datum: string,
  typ: "entfall" | "krank" = "entfall",
  begruendung: string | null = null,
): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const supabase = await createClient();
    const { data: stunde } = await supabase
      .from("stundenplan_stunde")
      .select("id")
      .eq("id", stundeId)
      .eq("user_id", userId)
      .single();
    if (!stunde) return { ok: false, error: "Stunde nicht gefunden." };
    const grund = begruendung?.trim().slice(0, 280) || null;
    const { error } = await supabase
      .from("stundenplan_entfall")
      .upsert({ user_id: userId, stunde_id: stundeId, datum, typ, begruendung: grund }, { onConflict: "stunde_id,datum" });
    if (error) return { ok: false, error: error.message };
    revalidatePath("/stundenplan");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler." };
  }
}

export async function removeEntfall(stundeId: string, datum: string): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const supabase = await createClient();
    const { error } = await supabase
      .from("stundenplan_entfall")
      .delete()
      .eq("user_id", userId)
      .eq("stunde_id", stundeId)
      .eq("datum", datum);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/stundenplan");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler." };
  }
}

export async function addTagEntfall(
  datum: string,
  typ: "entfall" | "krank" = "entfall",
  begruendung: string | null = null,
): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const supabase = await createClient();
    const d = new Date(datum + "T12:00:00");
    const js = d.getDay();
    const wochentag = js === 0 ? 7 : js;
    const { data: stundenHeute } = await supabase
      .from("stundenplan_stunde")
      .select("id")
      .eq("user_id", userId)
      .eq("wochentag", wochentag);
    if (!stundenHeute?.length) return { ok: true };
    const grund = begruendung?.trim().slice(0, 280) || null;
    const rows = stundenHeute.map((s) => ({ user_id: userId, stunde_id: s.id, datum, typ, begruendung: grund }));
    const { error } = await supabase
      .from("stundenplan_entfall")
      .upsert(rows, { onConflict: "stunde_id,datum" });
    if (error) return { ok: false, error: error.message };
    revalidatePath("/stundenplan");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler." };
  }
}

export async function removeTagEntfall(datum: string): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const supabase = await createClient();
    const { error } = await supabase
      .from("stundenplan_entfall")
      .delete()
      .eq("user_id", userId)
      .eq("datum", datum);
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
