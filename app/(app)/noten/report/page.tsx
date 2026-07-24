import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { istPro } from "@/lib/pro/plan";
import { aktuellesHalbjahr, halbjahrLabel, schuljahrLabel } from "@/lib/grades/halbjahr";
import { assembleFaecher, type FachRow, type NoteRow } from "@/lib/grades/db";
import {
  fachSchnitt,
  fachSchnittMitUnterfaecher,
  gesamtSchnittGerundet,
} from "@/lib/grades/calc";
import { getNotensystem, type Notensystem } from "@/lib/grades/systems";
import type { Fach } from "@/lib/grades/types";
import { ReportPrintButton } from "@/components/noten/report-print-button";

const KATEGORIE_LABEL: Record<string, string> = {
  klausur: "Klausur",
  test: "Test",
  muendlich: "Mündlich",
  referat: "Referat",
  hausaufgabe: "Hausaufgabe",
  sonstige: "Sonstige",
};

function formatDatum(d: string | null | undefined): string {
  if (!d) return "—";
  const t = Date.parse(d);
  if (Number.isNaN(t)) return "—";
  return new Date(t).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function schnittFuer(fach: Fach, alle: Fach[], system: Notensystem): number | null {
  const kinder = alle.filter((f) => f.parentFachId === fach.id);
  return kinder.length > 0
    ? fachSchnittMitUnterfaecher(fach, kinder, system)
    : fachSchnitt(fach.noten, fach.gewichtungConfig, system);
}

export default async function ReportPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub as string | undefined;
  if (!userId) redirect("/login");

  const { data: profil } = await supabase
    .from("nutzer_profil")
    .select("name, klasse, schule, aktuelles_halbjahr, notensystem, plan_tier, plan_bis")
    .eq("id", userId)
    .single();

  // PDF-Report ist ein Pro-Feature — Free-User zur Pricing-Seite (Defense-in-Depth,
  // der Button in den Einstellungen ist ohnehin schon gated).
  if (!istPro(profil)) redirect("/pro");

  const halbjahr = profil?.aktuelles_halbjahr ?? aktuellesHalbjahr();
  const system = getNotensystem(profil?.notensystem ?? "de_0_15");

  const { data: fachRows } = await supabase
    .from("schule_fach")
    .select("*")
    .or(`halbjahr.eq.${halbjahr},halbjahr.is.null`)
    .order("created_at", { ascending: true });
  const fachIds = (fachRows ?? []).map((f) => f.id);
  const { data: noteRows } = fachIds.length
    ? await supabase.from("schule_note").select("*").in("fach_id", fachIds)
    : { data: [] as NoteRow[] };

  const faecher = assembleFaecher((fachRows ?? []) as FachRow[], (noteRows ?? []) as NoteRow[]);
  const topFaecher = faecher.filter((f) => !f.parentFachId && !f.ausgeschlossen);
  const gesamt = gesamtSchnittGerundet(faecher, system);
  const erstellt = new Date().toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-surface-2 px-5 py-8 print:bg-white print:p-0">
      <div className="mx-auto max-w-3xl">
        <div className="no-print mb-6 flex items-center justify-between gap-4">
          <p className="text-sm text-text-dim">
            Vorschau — mit „Als PDF speichern“ öffnest du den Druckdialog und wählst dort
            „Als PDF sichern“.
          </p>
          <ReportPrintButton />
        </div>

        {/* Das eigentliche Dokument — hell, unabhängig vom App-Theme */}
        <div className="print-report rounded-2xl bg-white p-10 text-zinc-900 shadow-sm print:rounded-none print:p-0 print:shadow-none">
          {/* Kopf */}
          <div className="flex items-start justify-between border-b border-zinc-200 pb-5">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Notenübersicht</h1>
              <p className="mt-1 text-sm text-zinc-500">
                {[profil?.name, profil?.klasse ? `Klasse ${profil.klasse}` : null, profil?.schule]
                  .filter(Boolean)
                  .join(" · ") || "—"}
              </p>
              <p className="text-sm text-zinc-500">
                {halbjahrLabel(halbjahr)} · Schuljahr {schuljahrLabel(halbjahr)}
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Notena
              </div>
              <div className="mt-1 text-xs text-zinc-400">{erstellt}</div>
            </div>
          </div>

          {/* Gesamtschnitt */}
          <div className="my-6 flex items-baseline justify-between rounded-xl bg-zinc-50 px-5 py-4">
            <span className="text-sm font-semibold text-zinc-600">Gesamtschnitt</span>
            <span className="text-2xl font-bold">
              {gesamt !== null ? system.formatSchnitt(gesamt) : "—"}
              {gesamt !== null && (
                <span className="ml-2 text-sm font-medium text-zinc-500">
                  Note {system.formatNote(gesamt)}
                </span>
              )}
            </span>
          </div>

          {/* Fächer */}
          {topFaecher.length === 0 ? (
            <p className="text-sm text-zinc-500">Für dieses Halbjahr sind noch keine Fächer angelegt.</p>
          ) : (
            <div className="space-y-6">
              {topFaecher.map((fach) => {
                const s = schnittFuer(fach, faecher, system);
                const noten = [...fach.noten].sort(
                  (a, b) => (a.datum ?? "").localeCompare(b.datum ?? ""),
                );
                return (
                  <div key={fach.id} className="break-inside-avoid">
                    <div className="mb-1.5 flex items-baseline justify-between border-b border-zinc-100 pb-1">
                      <h2 className="text-base font-semibold">
                        {fach.name}
                        {fach.niveau === "erhoeht" && (
                          <span className="ml-2 rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                            LK
                          </span>
                        )}
                      </h2>
                      <span className="text-sm font-semibold">
                        {s !== null ? system.formatSchnitt(s) : "—"}
                      </span>
                    </div>
                    {noten.length === 0 ? (
                      <p className="py-1 text-xs text-zinc-400">Noch keine Noten.</p>
                    ) : (
                      <table className="w-full text-sm">
                        <tbody>
                          {noten.map((n) => (
                            <tr key={n.id} className="border-b border-zinc-50 last:border-0">
                              <td className="py-1 pr-2 text-zinc-700">{n.bezeichnung || "—"}</td>
                              <td className="py-1 pr-2 text-zinc-500">
                                {KATEGORIE_LABEL[n.kategorie] ?? n.kategorie}
                              </td>
                              <td className="py-1 pr-2 text-zinc-500">{formatDatum(n.datum)}</td>
                              <td className="py-1 text-right font-medium text-zinc-900">
                                {system.formatNote(n.punkte)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Fuß */}
          <div className="mt-8 border-t border-zinc-200 pt-4 text-center text-xs text-zinc-400">
            Erstellt mit Notena · notena.app
          </div>
        </div>
      </div>
    </div>
  );
}
