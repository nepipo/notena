import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushZuUserAdmin } from "@/lib/actions/push-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ErinnerungRow = {
  user_id: string;
  klausur_titel: string;
  fach_name: string;
  vorbereitung_prozent: number;
  tage_bis: number;
};

function wann(tage: number): string {
  if (tage === 1) return "morgen";
  if (tage === 7) return "in einer Woche";
  return `in ${tage} Tagen`;
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("Authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase.rpc("klausur_erinnerungen_heute");
    if (error) {
      console.error("[cron/klausur-erinnerung] RPC-Fehler:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const erinnerungen = (data ?? []) as ErinnerungRow[];

    let gesendet = 0;
    for (const e of erinnerungen) {
      const fachPrefix = e.fach_name ? `${e.fach_name} ` : "";
      await sendPushZuUserAdmin(e.user_id, {
        title: `${fachPrefix}Klausur ${wann(e.tage_bis)}!`,
        body: `${e.klausur_titel} · Vorbereitung: ${e.vorbereitung_prozent}%`,
        url: "/noten",
      });
      gesendet++;
    }

    console.log(`[cron/klausur-erinnerung] ${gesendet} Erinnerungen gesendet.`);
    return NextResponse.json({ ok: true, gesendet });
  } catch (e) {
    console.error("[cron/klausur-erinnerung]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unbekannter Fehler" },
      { status: 500 },
    );
  }
}
