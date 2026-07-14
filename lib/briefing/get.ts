import { cache } from "react";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { assembleFaecher, type FachRow, type NoteRow, type KlausurRow } from "@/lib/grades/db";
import { aktuellesHalbjahr } from "@/lib/grades/halbjahr";
import { gesamtSchnitt } from "@/lib/grades/calc";
import { getNotensystem } from "@/lib/grades/systems";
import { istPro } from "@/lib/pro/plan";
import type { HausaufgabeRow, StundeRow } from "@/lib/stundenplan/types";
import {
  BRIEFING_SPRACHE,
  alterAusGeburtsdatum,
  baueKontext,
  baueSystemPrompt,
  ferienHinweis,
  ferienLaeuftGerade,
  heuteInBerlin,
  kuerzeAnSatzgrenze,
  type EntfallInfo,
} from "@/lib/briefing/prompt";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * React.cache() stellt sicher: innerhalb eines Requests wird holeBriefing()
 * nur einmal ausgeführt — auch wenn mehrere Server Components es aufrufen.
 * Verhindert doppelte Claude-API-Calls beim Streaming-Rendering.
 */
export const holeBriefingCached = cache(async (): Promise<string | null> => {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims?.sub) return null;

  const userId = auth.claims.sub;
  const heute = heuteInBerlin();

  const { data: profil } = await supabase
    .from("nutzer_profil")
    .select("plan_tier, plan_bis, briefing_aktiv, name, aktuelles_halbjahr, bundesland, geburtsdatum, klasse, schulform, notensystem")
    .eq("id", userId)
    .single();

  if (!istPro(profil)) return null;
  if (profil?.briefing_aktiv === false) return null;

  const { data: cached } = await supabase
    .from("briefing_cache")
    .select("text")
    .eq("user_id", userId)
    .eq("datum", heute.iso)
    .single();

  if (cached?.text) return cached.text;

  const name = profil?.name ?? "Schüler";
  const halbjahr = profil?.aktuelles_halbjahr ?? aktuellesHalbjahr();
  const system = getNotensystem(profil?.notensystem ?? "de_0_15");

  const [{ data: fachRows }, { data: noteRows }, { data: klausurRows }, { data: haRows }, { data: stundeRows }, { data: entfallRows }] =
    await Promise.all([
      supabase.from("schule_fach").select("*").eq("user_id", userId).eq("halbjahr", halbjahr),
      supabase.from("schule_note").select("fach_id, punkte, kategorie, gewicht").eq("user_id", userId),
      supabase.from("schule_klausur").select("*").eq("user_id", userId).gte("datum", heute.iso).order("datum").limit(10),
      supabase.from("hausaufgabe").select("*").eq("user_id", userId).eq("erledigt", false),
      supabase.from("stundenplan_stunde").select("*").eq("user_id", userId).eq("wochentag", heute.wochentagIndex),
      supabase.from("stundenplan_entfall").select("stunde_id, typ, begruendung").eq("user_id", userId).eq("datum", heute.iso),
    ]);

  const entfallHeute = new Map<string, EntfallInfo>(
    (entfallRows ?? []).map((e) => [
      e.stunde_id as string,
      { typ: e.typ as "entfall" | "krank", begruendung: (e.begruendung as string | null) ?? null },
    ]),
  );

  const faecher = assembleFaecher(
    (fachRows ?? []) as FachRow[],
    (noteRows ?? []) as NoteRow[],
  );
  const fachMap = new Map(faecher.map((f) => [f.id, f.name]));

  const kontext = baueKontext({
    heute,
    halbjahr,
    sprache: BRIEFING_SPRACHE,
    system,
    gesamtPunkte: gesamtSchnitt(faecher),
    faecher,
    klausuren: (klausurRows ?? []) as KlausurRow[],
    hausaufgaben: (haRows ?? []) as HausaufgabeRow[],
    stundenHeute: (stundeRows ?? []) as StundeRow[],
    entfallHeute,
    fachMap,
    ferien: ferienHinweis((profil?.bundesland as string | null) ?? null, heute.iso),
    ferienLaufend: ferienLaeuftGerade((profil?.bundesland as string | null) ?? null, heute.iso),
  });

  const systemPrompt = baueSystemPrompt({
    name,
    alter: alterAusGeburtsdatum((profil?.geburtsdatum as string | null) ?? null, heute.iso),
    klasse: (profil?.klasse as number | null) ?? null,
    schulform: (profil?.schulform as string | null) ?? null,
    halbjahr,
    sprache: BRIEFING_SPRACHE,
  });

  let msg: Anthropic.Message;
  try {
    msg = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: "user", content: kontext }],
    });
  } catch (err) {
    console.error("[briefing] Claude-API-Fehler:", err);
    return null;
  }

  const block = msg.content.find((b) => b.type === "text");
  const roh = block?.text.trim();
  if (!roh) return null;

  const text = msg.stop_reason === "max_tokens" ? kuerzeAnSatzgrenze(roh) : roh;

  await supabase.from("briefing_cache").upsert(
    { user_id: userId, datum: heute.iso, text },
    { onConflict: "user_id,datum" },
  );

  return text;
});
