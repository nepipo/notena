import { createClient } from "@/lib/supabase/server";
import { aktuellesHalbjahr } from "@/lib/grades/halbjahr";

export async function GET() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();

  if (!auth?.claims?.sub) {
    return new Response("Nicht eingeloggt.", { status: 401 });
  }

  const userId = auth.claims.sub;

  try {
    const [profilRes, fachRes, noteRes, klausurRes] = await Promise.all([
      supabase.from("nutzer_profil").select("name, klasse, schule, aktuelles_halbjahr").eq("id", userId).single(),
      supabase.from("schule_fach").select("id, name, halbjahr, niveau, farbe").eq("user_id", userId).order("halbjahr").order("name"),
      supabase.from("schule_note").select("fach_id, punkte, kategorie, bezeichnung, gewicht, created_at").eq("user_id", userId).order("created_at"),
      supabase.from("schule_klausur").select("titel, datum, fach_id, created_at").eq("user_id", userId).order("datum"),
    ]);

    if (profilRes.error || fachRes.error || noteRes.error || klausurRes.error) {
      console.error("[export] Supabase error:", profilRes.error ?? fachRes.error ?? noteRes.error ?? klausurRes.error);
      return new Response("Fehler beim Laden der Daten.", { status: 500 });
    }

    const { data: profil } = profilRes;
    const { data: fachRows } = fachRes;
    const { data: noteRows } = noteRes;
    const { data: klausurRows } = klausurRes;

    const fachMap = new Map((fachRows ?? []).map((f) => [f.id, f.name]));

    const exportData = {
      exportiert_am: new Date().toISOString(),
      profil: {
        name: profil?.name ?? null,
        klasse: profil?.klasse ?? null,
        schule: profil?.schule ?? null,
        aktuelles_halbjahr: profil?.aktuelles_halbjahr ?? aktuellesHalbjahr(),
      },
      faecher: (fachRows ?? []).map((f) => ({
        id: f.id,
        name: f.name,
        halbjahr: f.halbjahr,
        niveau: f.niveau,
      })),
      noten: (noteRows ?? []).map((n) => ({
        fach: fachMap.get(n.fach_id) ?? n.fach_id,
        punkte: n.punkte,
        kategorie: n.kategorie,
        bezeichnung: n.bezeichnung ?? null,
        gewicht: n.gewicht,
        eingetragen_am: n.created_at,
      })),
      klausuren: (klausurRows ?? []).map((k) => ({
        titel: k.titel,
        datum: k.datum,
        fach: k.fach_id ? (fachMap.get(k.fach_id) ?? null) : null,
        eingetragen_am: k.created_at,
      })),
    };

    const dateiname = `project-x-export-${new Date().toISOString().slice(0, 10)}.json`;

    return new Response(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${dateiname}"`,
      },
    });
  } catch (err) {
    console.error("[export] network error:", err);
    return new Response("Fehler beim Export.", { status: 500 });
  }
}
