import { redirect } from "next/navigation";
import { getCachedClaims, getCachedProfil } from "@/lib/supabase/cache";
import { AppNav } from "@/components/app-nav";
import { FeedbackButton } from "@/components/feedback-button";
import { PwaInstallBanner } from "@/components/pwa-install-banner";
import { NotensystemProvider } from "@/components/notensystem-provider";
import { KategorienProvider } from "@/components/kategorien-provider";
import type { CustomKategorie } from "@/lib/grades/types";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const claims = await getCachedClaims();
  if (!claims) redirect("/login");

  const profil = await getCachedProfil();

  if (profil && profil.onboarding_abgeschlossen === false) {
    redirect("/onboarding");
  }

  const email = typeof claims.email === "string" ? claims.email : "";
  const initiale = (profil?.name?.trim()?.[0] ?? email[0] ?? "?").toUpperCase();
  const notensystem = profil?.notensystem ?? "de_0_15";
  const customKategorien = (Array.isArray((profil as Record<string, unknown> | null)?.custom_kategorien)
    ? (profil as Record<string, unknown>).custom_kategorien
    : []) as CustomKategorie[];

  return (
    <NotensystemProvider systemId={notensystem}>
      <KategorienProvider custom={customKategorien}>
        <div className="min-h-screen">
          <AppNav initiale={initiale} />
          <div className="pb-24 lg:pb-0">{children}</div>
          <FeedbackButton />
          <PwaInstallBanner />
        </div>
      </KategorienProvider>
    </NotensystemProvider>
  );
}
