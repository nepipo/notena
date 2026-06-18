import crypto from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { berechneProfilUpdate, type LsWebhookPayload } from "@/lib/pro/webhook";

/** Timing-sichere HMAC-SHA256-Prüfung der LemonSqueezy-Signatur. */
function signaturGueltig(rawBody: string, signature: string | null): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const digest = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(digest, "hex");
  const b = Buffer.from(signature, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-signature");

  if (!signaturGueltig(rawBody, signature)) {
    return Response.json({ error: "Ungültige Signatur" }, { status: 401 });
  }

  let payload: LsWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as LsWebhookPayload;
  } catch {
    return Response.json({ error: "Ungültiges JSON" }, { status: 400 });
  }

  const result = berechneProfilUpdate(payload);
  if (!result) {
    // Event bewusst ignoriert (unbekannt o. fehlende user_id) — 200, damit
    // LemonSqueezy nicht endlos retried.
    return Response.json({ ignored: true }, { status: 200 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("nutzer_profil")
    .update(result.update)
    .eq("id", result.userId);

  if (error) {
    console.error("[ls-webhook] update error:", error);
    return Response.json({ error: "DB-Update fehlgeschlagen" }, { status: 500 });
  }

  return Response.json({ ok: true }, { status: 200 });
}
