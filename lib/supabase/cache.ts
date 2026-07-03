import { cache } from "react";
import { createClient } from "./server";

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
