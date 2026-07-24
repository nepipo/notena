// DB-backed sliding-window rate limiter für den KI-Coach.
// Nutzt eine Postgres-RPC mit atomic INSERT ... ON CONFLICT — race-condition-sicher
// über alle Vercel-Instanzen hinweg (im Gegensatz zu in-memory Maps).
//
// Fail-open: wenn die DB nicht erreichbar ist, wird der Request durchgelassen
// damit ein DB-Ausfall die Coaching-Funktion nicht vollständig blockiert.

import type { SupabaseClient } from "@supabase/supabase-js";

const LIMIT = 20;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

type RpcResult = {
  allowed: boolean;
  count: number;
  remaining: number;
  reset_at: string;
};

export async function checkRateLimit(supabase: SupabaseClient): Promise<RateLimitResult> {
  const { data, error } = await supabase.rpc("check_coach_rate_limit");

  if (error) {
    console.error("[rate-limiter] RPC-Fehler — fail open:", error.message);
    return {
      allowed: true,
      remaining: 1,
      resetAt: new Date(Date.now() + 3_600_000),
    };
  }

  const r = data as RpcResult;
  return {
    allowed: r.allowed,
    remaining: r.remaining,
    resetAt: new Date(r.reset_at),
  };
}
