"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { CustomKategorie } from "@/lib/grades/types";

const KategorieSchema = z.object({
  name: z.string().min(1).max(40).trim(),
  kurzname: z.string().min(1).max(5).trim(),
});

export async function getCustomKategorien(): Promise<CustomKategorie[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("nutzer_profil")
    .select("custom_kategorien")
    .single();
  const raw = data?.custom_kategorien;
  if (!Array.isArray(raw)) return [];
  return raw as CustomKategorie[];
}

export async function addCustomKategorie(
  name: string,
  kurzname: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = KategorieSchema.safeParse({ name, kurzname });
  if (!parsed.success) return { ok: false, error: "Ungültige Eingabe." };

  const supabase = await createClient();
  const { data: profil } = await supabase
    .from("nutzer_profil")
    .select("custom_kategorien")
    .single();

  const existing = (Array.isArray(profil?.custom_kategorien) ? profil.custom_kategorien : []) as CustomKategorie[];
  if (existing.length >= 20) return { ok: false, error: "Maximal 20 eigene Kategorien." };

  const newEntry: CustomKategorie = {
    id: `custom_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`,
    name: parsed.data.name,
    kurzname: parsed.data.kurzname,
  };

  const { error } = await supabase
    .from("nutzer_profil")
    .update({ custom_kategorien: [...existing, newEntry] });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function removeCustomKategorie(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data: profil } = await supabase
    .from("nutzer_profil")
    .select("custom_kategorien")
    .single();

  const existing = (Array.isArray(profil?.custom_kategorien) ? profil.custom_kategorien : []) as CustomKategorie[];
  const updated = existing.filter((k) => k.id !== id);

  const { error } = await supabase
    .from("nutzer_profil")
    .update({ custom_kategorien: updated });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}
