import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims?.sub) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  const body = await req.json();
  const { endpoint, keys } = body as { endpoint: string; keys: { p256dh: string; auth: string } };
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: "Ungültige Subscription-Daten" }, { status: 400 });
  }

  // Endpoint muss eine gültige HTTPS-URL sein
  try {
    const url = new URL(endpoint);
    if (url.protocol !== "https:") throw new Error("Kein HTTPS");
  } catch {
    return NextResponse.json({ error: "Ungültige Endpoint-URL" }, { status: 400 });
  }

  const { error } = await supabase.from("push_subscription").upsert(
    { user_id: auth.claims.sub, endpoint, p256dh: keys.p256dh, auth_key: keys.auth },
    { onConflict: "user_id,endpoint" },
  );
  if (error) {
    console.error("[push/subscribe] upsert error:", error);
    return NextResponse.json({ error: "Speichern fehlgeschlagen." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims?.sub) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  const { endpoint } = await req.json() as { endpoint: string };
  if (!endpoint) return NextResponse.json({ error: "Endpoint fehlt" }, { status: 400 });

  const { error: deleteError } = await supabase
    .from("push_subscription")
    .delete()
    .eq("user_id", auth.claims.sub)
    .eq("endpoint", endpoint);

  if (deleteError) {
    console.error("[push/subscribe] delete error:", deleteError);
    return NextResponse.json({ error: "Löschen fehlgeschlagen." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
