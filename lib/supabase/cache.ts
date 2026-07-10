import { cache } from "react";
import { createClient } from "./server";
import { aktuellesHalbjahr } from "@/lib/grades/halbjahr";

// Dedupliziert getClaims zwischen Layout und Pages innerhalb desselben Requests.
export const getCachedClaims = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims ?? null;
});

// Dedupliziert den Profil-Fetch zwischen Layout, Dashboard, Noten und Stundenplan.
// React.cache() garantiert: innerhalb eines Requests wird die DB nur einmal abgefragt.
export const getCachedProfil = cache(async () => {
  const claims = await getCachedClaims();
  if (!claims?.sub) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("nutzer_profil")
    .select("name, onboarding_abgeschlossen, notensystem, aktuelles_halbjahr, bundesland, custom_kategorien, plan_tier, plan_bis")
    .eq("id", claims.sub)
    .single();
  return data;
});

// Alle Halbjahre, in denen der User Fächer hat — plus das aktive (auch wenn noch leer).
// React.cache() dedupliziert zwischen Layout (Header-Picker) und /noten: nur eine DB-Query.
// RLS filtert auf den eingeloggten User, deshalb kein explizites .eq("user_id", ...).
export const getCachedHalbjahre = cache(async (): Promise<string[]> => {
  const profil = await getCachedProfil();
  if (!profil) return [];
  const aktiv = profil.aktuelles_halbjahr ?? aktuellesHalbjahr();
  const supabase = await createClient();
  const { data, error } = await supabase.from("schule_fach").select("halbjahr");
  if (error) console.error("[cache] halbjahre fetch error:", error);
  const alle = new Set<string>([aktiv]);
  for (const row of data ?? []) {
    if (row.halbjahr) alle.add(row.halbjahr);
  }
  // Lexikographisch = chronologisch, weil das Startjahr 4-stellig vorne steht.
  return Array.from(alle).sort();
});
