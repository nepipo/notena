"use server";

import { createClient } from "@/lib/supabase/server";

export async function sendFeedback(
  nachricht: string,
  seite?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const trimmed = nachricht.trim();
  if (!trimmed || trimmed.length > 2000) {
    return { ok: false, error: "Nachricht ungültig." };
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub ?? null;

  const { error } = await supabase.from("feedback").insert({
    user_id: userId,
    nachricht: trimmed,
    seite: seite ?? null,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
