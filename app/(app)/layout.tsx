import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/app-nav";
import { FeedbackButton } from "@/components/feedback-button";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) redirect("/login");

  const { data: profil } = await supabase
    .from("nutzer_profil")
    .select("name, onboarding_abgeschlossen")
    .eq("id", claims.sub)
    .single();

  if (profil && profil.onboarding_abgeschlossen === false) {
    redirect("/onboarding");
  }

  const email = typeof claims.email === "string" ? claims.email : "";
  const initiale = (profil?.name?.trim()?.[0] ?? email[0] ?? "?").toUpperCase();

  return (
    <div className="min-h-screen">
      <AppNav initiale={initiale} />
      <div className="pb-24 lg:pb-0">{children}</div>
      <FeedbackButton />
    </div>
  );
}
