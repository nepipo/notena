"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { completeOnboarding, addFach, updateFach } from "@/lib/actions/schule";
import { aktuellesHalbjahr } from "@/lib/grades/halbjahr";
import { BUNDESLAND_LABEL, type Bundesland } from "@/lib/ferien/ferien-data";

type Modus = "punkte" | "note";
type Niveau = "grund" | "erhoeht";

interface FachEintrag {
  id: string;
  name: string;
  niveau: Niveau;
}

const VORSCHLAG_FAECHER = [
  "Mathe", "Deutsch", "Englisch", "Physik", "Geschichte",
  "Biologie", "Chemie", "Sport", "Musik", "Informatik",
  "Latein", "Französisch", "Spanisch",
];

const STEP_LABELS = ["Profil", "Fächer", "Einstellungen"];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [klasse, setKlasse] = useState<11 | 12 | 13 | null>(null);
  const [bundesland, setBundesland] = useState<Bundesland | "">("");
  const [eingabeModus, setEingabeModus] = useState<Modus>("punkte");
  const [faecher, setFaecher] = useState<FachEintrag[]>([]);
  const [freitextName, setFreitextName] = useState("");
  const [freitextNiveau, setFreitextNiveau] = useState<Niveau>("grund");
  const [isPendingFach, startFachTransition] = useTransition();
  const [isPendingFinish, startFinishTransition] = useTransition();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const halbjahr = aktuellesHalbjahr();

  useEffect(() => {
    if (step === 1) nameInputRef.current?.focus();
  }, [step]);

  function istAusgewaehlt(vorschlag: string) {
    return faecher.some((f) => f.name === vorschlag);
  }

  function toggleVorschlag(vorschlag: string) {
    if (istAusgewaehlt(vorschlag)) {
      const fach = faecher.find((f) => f.name === vorschlag);
      if (fach) setFaecher((prev) => prev.filter((f) => f.id !== fach.id));
    } else {
      fachHinzufuegen(vorschlag, "grund");
    }
  }

  function fachHinzufuegen(fachName: string, niveau: Niveau) {
    const trimmed = fachName.trim();
    if (!trimmed) return;
    startFachTransition(async () => {
      const res = await addFach(trimmed, halbjahr, niveau);
      if (!res.ok) {
        toast.error(`Fehler: ${res.error}`);
        return;
      }
      setFaecher((prev) => [...prev, { id: res.id, name: trimmed, niveau }]);
    });
  }

  function freitextHinzufuegen() {
    if (!freitextName.trim()) return;
    fachHinzufuegen(freitextName, freitextNiveau);
    setFreitextName("");
    setFreitextNiveau("grund");
  }

  function finish() {
    if (!klasse) return;
    startFinishTransition(async () => {
      const res = await completeOnboarding(name, klasse, eingabeModus, bundesland || null);
      if (!res.ok) {
        toast.error(`Fehler: ${res.error}`);
        return;
      }
      router.push("/dashboard");
    });
  }

  return (
    <main className="relative z-[5] flex min-h-screen flex-col items-center px-5 py-12 sm:px-8">
      {/* Progress bar */}
      <div className="w-full max-w-md">
        <div className="mb-2 flex justify-between">
          {STEP_LABELS.map((label, i) => {
            const s = i + 1;
            return (
              <span
                key={s}
                className={`font-mono text-[10px] font-semibold uppercase tracking-[.15em] transition-colors ${
                  step >= s ? "text-brand" : "text-text-mute"
                }`}
              >
                {label}
              </span>
            );
          })}
        </div>
        <div className="flex gap-1.5">
          {STEP_LABELS.map((_, i) => {
            const s = i + 1;
            return (
              <div
                key={s}
                className="h-1 flex-1 rounded-full transition-[background-color] duration-500"
                style={{
                  background:
                    step >= s
                      ? "linear-gradient(90deg, var(--brand), var(--brand-2))"
                      : "var(--surface-3)",
                }}
              />
            );
          })}
        </div>
      </div>

      {/* ── Screen 1: Profil ─────────────────────────────── */}
      {step === 1 && (
        <div className="mt-10 w-full max-w-md animate-fade-up">
          <div className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[.25em] text-brand">
            Schritt 1 von 3
          </div>
          <h1 className="font-display text-4xl font-extrabold leading-tight">
            Wie heißt du?
          </h1>
          <p className="mt-2 text-sm text-text-dim">
            Damit die App dich persönlich anspricht.
          </p>

          <input
            ref={nameInputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && name.trim() && klasse !== null) setStep(2);
            }}
            placeholder="Dein Vorname"
            className="mt-8 w-full rounded-2xl border border-border bg-surface-2 px-4 py-3.5 text-base outline-none transition-colors focus:border-brand focus:bg-surface-3"
          />

          <div className="mt-6">
            <p className="mb-3 text-sm text-text-dim">In welcher Klasse bist du?</p>
            <div className="flex gap-3">
              {([11, 12, 13] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setKlasse(k)}
                  className={`flex-1 rounded-2xl border py-4 font-display text-xl font-extrabold transition-[border-color,background-color,color,box-shadow] ${
                    klasse === k
                      ? "border-brand bg-brand/10 text-brand shadow-[0_0_20px_color-mix(in_srgb,var(--brand)_25%,transparent)]"
                      : "border-border bg-surface-2 text-text-dim hover:bg-surface-3"
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <p className="mb-3 text-sm text-text-dim">Bundesland?</p>
            <select
              value={bundesland}
              onChange={(e) => setBundesland(e.target.value as Bundesland | "")}
              className="w-full rounded-2xl border border-border bg-surface-2 px-4 py-3.5 text-base outline-none transition-colors focus:border-brand focus:bg-surface-3"
            >
              <option value="">Kein Bundesland auswählen</option>
              {(Object.entries(BUNDESLAND_LABEL) as [Bundesland, string][]).map(
                ([code, label]) => (
                  <option key={code} value={code}>
                    {label}
                  </option>
                ),
              )}
            </select>
            {!bundesland && (
              <p className="mt-1.5 font-mono text-[11px] text-text-mute">
                Optional — wird für den Ferien-Countdown gebraucht.
              </p>
            )}
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!name.trim() || klasse === null}
            className="mt-8 w-full rounded-2xl bg-brand px-6 py-4 font-display font-extrabold text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Weiter →
          </button>
        </div>
      )}

      {/* ── Screen 2: Fächer ─────────────────────────────── */}
      {step === 2 && (
        <div className="mt-10 w-full max-w-md animate-fade-up">
          <div className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[.25em] text-brand">
            Schritt 2 von 3
          </div>
          <h1 className="font-display text-4xl font-extrabold leading-tight">
            Deine Fächer
          </h1>
          <p className="mt-2 text-sm text-text-dim">
            Antippen zum Auswählen. Kannst du jederzeit ändern.
          </p>

          {/* Vorschlag-Chips */}
          <div className="mt-6 flex flex-wrap gap-2">
            {VORSCHLAG_FAECHER.map((fach) => {
              const ausgewaehlt = istAusgewaehlt(fach);
              return (
                <button
                  key={fach}
                  onClick={() => toggleVorschlag(fach)}
                  disabled={isPendingFach}
                  className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-[border-color,background-color,color] disabled:opacity-60 ${
                    ausgewaehlt
                      ? "border-brand bg-brand text-black"
                      : "border-border bg-surface-2 text-foreground hover:border-brand/40 hover:bg-surface-3"
                  }`}
                >
                  {ausgewaehlt ? "✓ " : "+ "}
                  {fach}
                </button>
              );
            })}
          </div>

          {/* Freitext */}
          <div className="mt-5 flex gap-2">
            <input
              type="text"
              value={freitextName}
              onChange={(e) => setFreitextName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && freitextHinzufuegen()}
              placeholder="Anderes Fach eingeben…"
              className="flex-1 rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm outline-none transition-colors focus:border-brand"
            />
            <select
              value={freitextNiveau}
              onChange={(e) => setFreitextNiveau(e.target.value as Niveau)}
              className="rounded-xl border border-border bg-surface-2 px-2 py-2.5 text-sm outline-none focus:border-brand"
            >
              <option value="grund">GK</option>
              <option value="erhoeht">LK</option>
            </select>
            <button
              onClick={freitextHinzufuegen}
              disabled={!freitextName.trim() || isPendingFach}
              className="rounded-xl bg-brand px-3 py-2.5 text-sm font-bold text-black disabled:opacity-50"
            >
              +
            </button>
          </div>

          {/* Ausgewählte Fächer mit LK-Toggle */}
          {faecher.length > 0 && (
            <div className="mt-4 rounded-2xl border border-border bg-surface-2 p-3">
              <div className="mb-2 font-mono text-[10px] uppercase tracking-[.15em] text-text-mute">
                Ausgewählt · LK/GK anpassen
              </div>
              <div className="flex flex-col gap-1.5">
                {faecher.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between rounded-xl bg-surface-3 px-3 py-2"
                  >
                    <span className="text-sm font-medium">{f.name}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const newNiveau = f.niveau === "grund" ? "erhoeht" : "grund";
                          setFaecher((prev) =>
                            prev.map((x) => x.id === f.id ? { ...x, niveau: newNiveau } : x)
                          );
                          startFachTransition(async () => {
                            await updateFach(f.id, { niveau: newNiveau });
                          });
                        }}
                        className={`rounded-lg px-2 py-0.5 text-xs font-bold transition-colors ${
                          f.niveau === "erhoeht"
                            ? "bg-indigo-500/20 text-indigo-300"
                            : "bg-surface-2 text-text-mute hover:text-text-dim"
                        }`}
                      >
                        {f.niveau === "erhoeht" ? "LK" : "GK"}
                      </button>
                      <button
                        onClick={() => setFaecher((prev) => prev.filter((x) => x.id !== f.id))}
                        className="text-xs text-text-mute hover:text-foreground"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isPendingFach && (
            <div className="mt-3 flex items-center gap-2 font-mono text-xs text-text-mute">
              <Loader2 className="size-3 animate-spin" />
              Wird gespeichert…
            </div>
          )}

          <button
            onClick={() => setStep(3)}
            disabled={isPendingFach}
            className="mt-6 w-full rounded-2xl bg-brand px-6 py-4 font-display font-extrabold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {faecher.length > 0 ? `Weiter mit ${faecher.length} Fächern →` : "Weiter →"}
          </button>
          <button
            onClick={() => setStep(1)}
            className="mt-3 w-full font-mono text-sm text-text-mute hover:text-text-dim"
          >
            ← Zurück
          </button>
        </div>
      )}

      {/* ── Screen 3: Modus + Done ───────────────────────── */}
      {step === 3 && (
        <div className="mt-10 w-full max-w-md animate-fade-up">
          <div className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[.25em] text-brand">
            Letzter Schritt
          </div>
          <h1 className="font-display text-4xl font-extrabold leading-tight">
            Wie gibst du<br />Noten ein?
          </h1>
          <p className="mt-2 text-sm text-text-dim">
            Jederzeit in den Einstellungen änderbar.
          </p>

          <div className="mt-8 flex flex-col gap-3">
            {(["punkte", "note"] as Modus[]).map((m) => (
              <button
                key={m}
                onClick={() => setEingabeModus(m)}
                className={`rounded-2xl border p-5 text-left transition-[border-color,background-color,box-shadow] ${
                  eingabeModus === m
                    ? "border-brand bg-brand/10 shadow-[0_0_24px_color-mix(in_srgb,var(--brand)_15%,transparent)]"
                    : "border-border bg-surface-2 hover:bg-surface-3"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-display font-extrabold">
                    {m === "punkte" ? "Punkte (0–15)" : "Noten (1+ bis 6)"}
                  </span>
                  {eingabeModus === m && (
                    <span className="font-mono text-[10px] font-bold text-brand">✓ Ausgewählt</span>
                  )}
                </div>
                <div className="mt-1 font-mono text-sm text-text-dim">
                  {m === "punkte"
                    ? "Das Oberstufen-System — du gibst 0 bis 15 Punkte ein."
                    : "Klassische Schulnoten — du gibst 1+, 2, 3− usw. ein."}
                </div>
              </button>
            ))}
          </div>

          {/* Mini-Summary */}
          <div className="mt-6 rounded-2xl border border-border/50 bg-surface-2 p-4">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-[.15em] text-text-mute">
              Dein Setup
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex gap-2">
                <span className="text-text-mute">Name</span>
                <span className="font-semibold">{name}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-text-mute">Klasse</span>
                <span className="font-semibold">{klasse}</span>
              </div>
              {bundesland && (
                <div className="flex gap-2">
                  <span className="text-text-mute">Bundesland</span>
                  <span className="font-semibold">{BUNDESLAND_LABEL[bundesland as Bundesland]}</span>
                </div>
              )}
              <div className="flex gap-2">
                <span className="shrink-0 text-text-mute">Fächer</span>
                <span className="font-semibold">
                  {faecher.length > 0
                    ? faecher.map((f) => `${f.name} (${f.niveau === "erhoeht" ? "LK" : "GK"})`).join(", ")
                    : "Noch keine — kannst du gleich eintragen"}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={finish}
            disabled={isPendingFinish}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand px-6 py-4 font-display font-extrabold text-black transition-opacity hover:opacity-90 disabled:opacity-70"
          >
            {isPendingFinish ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Wird eingerichtet…
              </>
            ) : (
              "Los geht's →"
            )}
          </button>
          <button
            onClick={() => setStep(2)}
            className="mt-3 w-full font-mono text-sm text-text-mute hover:text-text-dim"
          >
            ← Zurück
          </button>
        </div>
      )}
    </main>
  );
}
