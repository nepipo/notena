"use server";

import webpush from "web-push";
import { createClient } from "@/lib/supabase/server";

webpush.setVapidDetails(
  "mailto:ne.polonius@gmail.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
};

export async function sendPushZuUser(
  userId: string,
  payload: PushPayload,
): Promise<void> {
  const supabase = await createClient();
  const { data: subs } = await supabase
    .from("push_subscription")
    .select("endpoint, p256dh, auth_key")
    .eq("user_id", userId);

  if (!subs?.length) return;

  const abgelaufeneEndpoints: string[] = [];

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
          JSON.stringify(payload),
        );
      } catch (err: unknown) {
        const status = (err as { statusCode?: number })?.statusCode;
        if (status === 410 || status === 404) {
          abgelaufeneEndpoints.push(sub.endpoint);
        }
      }
    }),
  );

  if (abgelaufeneEndpoints.length) {
    await supabase
      .from("push_subscription")
      .delete()
      .eq("user_id", userId)
      .in("endpoint", abgelaufeneEndpoints);
  }
}

export async function testPushAnMich(): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getClaims();
    if (!auth?.claims?.sub) return { ok: false, error: "Nicht eingeloggt" };

    await sendPushZuUser(auth.claims.sub, {
      title: "Project X ✓",
      body: "Push-Benachrichtigungen funktionieren!",
      url: "/einstellungen",
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler." };
  }
}
