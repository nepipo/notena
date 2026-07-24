"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { istPro } from "@/lib/pro/plan";

export type Theme = "dark" | "light";
export type AccentColor = "blue" | "violet" | "pink" | "green" | "mint" | "orange" | "red" | "teal" | "indigo" | "mono";

const COOKIE_OPTS = {
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
  sameSite: "lax",
} as const;

export async function setTheme(theme: Theme): Promise<void> {
  // Dark/Light ist gratis für alle.
  const store = await cookies();
  store.set("notena-theme", theme, COOKIE_OPTS);
}

export async function setAccent(accent: AccentColor): Promise<void> {
  // Akzentfarben sind ein Pro-Feature — serverseitig durchsetzen, nie dem Client vertrauen.
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub as string | undefined;
  if (!userId) return;

  const { data: profil } = await supabase
    .from("nutzer_profil")
    .select("plan_tier, plan_bis")
    .eq("id", userId)
    .single();
  if (!istPro(profil)) return;

  const store = await cookies();
  store.set("notena-accent", accent, COOKIE_OPTS);
}
