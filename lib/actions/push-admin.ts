import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PushPayload } from "@/lib/actions/push";

function initWebPush() {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) throw new Error("VAPID-Keys fehlen.");
  webpush.setVapidDetails("mailto:ne.polonius@gmail.com", pub, priv);
}

export async function sendPushZuUserAdmin(
  userId: string,
  payload: PushPayload,
): Promise<void> {
  initWebPush();
  const supabase = createAdminClient();

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
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth_key },
          },
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
