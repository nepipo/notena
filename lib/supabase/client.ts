import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase-Client für Client-Komponenten (läuft im Browser).
 * Nutzt den öffentlichen Publishable-/Anon-Key (Schutz via RLS).
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
