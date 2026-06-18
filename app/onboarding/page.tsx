import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingFlow } from "./onboarding-flow";

/**
 * Onboarding laeuft *vor* der Registrierung (anonym) — die Seite ist daher
 * oeffentlich (siehe lib/supabase/proxy.ts). Drei Faelle:
 *  - anonym            -> Flow ausfuellen, am Ende -> /signup (localStorage-Bridge)
 *  - eingeloggt, offen -> Flush des localStorage ODER Fallback-Durchlauf
 *  - eingeloggt, fertig -> nichts zu tun, ab ins Dashboard
 */
export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (claims) {
    const { data: profil } = await supabase
      .from("nutzer_profil")
      .select("onboarding_abgeschlossen")
      .eq("id", claims.sub)
      .single();
    if (profil?.onboarding_abgeschlossen) {
      redirect("/dashboard");
    }
  }

  return <OnboardingFlow isLoggedIn={Boolean(claims)} />;
}
