"use server";

import { holeBriefingCached } from "@/lib/briefing/get";

export async function holeBriefing(): Promise<string | null> {
  return holeBriefingCached();
}
