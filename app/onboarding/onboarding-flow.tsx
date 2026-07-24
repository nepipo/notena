"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { applyOnboarding } from "@/lib/actions/schule";
import { setTheme, type Theme } from "@/lib/actions/theme";
import { BUNDESLAND_LABEL, type Bundesland } from "@/lib/ferien/ferien-data";
import {
  type OnboardingData,
  type OnboardingFach,
  type OnboardingNiveau,
  saveOnboarding,
  loadOnboarding,
  clearOnboarding,
} from "@/lib/onboarding/storage";

const TOTAL_STEPS = 9;

const VORSCHLAG_FAECHER = [
  "Mathe", "Deutsch", "Englisch", "Physik", "Geschichte",
  "Biologie", "Chemie", "Sport", "Musik", "Informatik",
  "Latein", "Französisch", "Spanisch",
];

const SCHULFORMEN: { code: string; label: string }[] = [
  { code: "gymnasium", label: "Gymnasium" },
  { code: "berufsschule", label: "Berufsschule" },
  { code: "stadtteilschule", label: "Stadtteilschule" },
  { code: "andere", label: "Andere" },
];

const LAENDER: { code: string; emoji: string; label: string }[] = [
  { code: "de", emoji: "🇩🇪", label: "Deutschland" },
  { code: "at", emoji: "🇦🇹", label: "Österreich" },
  { code: "ch", emoji: "🇨🇭", label: "Schweiz" },
  { code: "other", emoji: "🌍", label: "Anderes Land" },
];

const textInput =
  "mt-8 w-full rounded-2xl border border-border bg-surface-2 px-4 py-3.5 text-base outline-none transition-colors focus:border-brand focus:bg-surface-3";
const primaryBtn =
  "mt-8 w-full rounded-2xl bg-primary px-6 py-4 font-display font-extrabold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40";
const subtleBtn =
  "mt-3 w-full font-mono text-sm text-text-mute transition-colors hover:text-text-dim";

export function OnboardingFlow({ isLoggedIn }: { isLoggedIn: boolean }) {
  const router = useRouter();

  const [flushing, setFlushing] = useState(isLoggedIn);
  const [step, setStep] = useState(1);
  // Modus-Wahl (Schwarz/Weiß) als erster Screen — eingeloggte überspringen ihn
  const [modusGewaehlt, setModusGewaehlt] = useState(isLoggedIn);

  const [vorname, setVorname] = useState("");
  const [nachname, setNachname] = useState("");
  const [geburtsdatum, setGeburtsdatum] = useState("");
  const [klasse, setKlasse] = useState<number | null>(null);
  const [land, setLand] = useState<string>("");
  const [bundesland, setBundesland] = useState<Bundesland | "">("");
  const [schulform, setSchulform] = useState("");
  const [schule, setSchule] = useState("");
  const [faecher, setFaecher] = useState<OnboardingFach[]>([]);
  const [freitextName, setFreitextName] = useState("");
  const [freitextNiveau, setFreitextNiveau] = useState<OnboardingNiveau>("grund");

  const [isPending, startTransition] = useTransition();

  function buildData(): OnboardingData {
    return {
      vorname: vorname.trim(),
      nachname: nachname.trim() || null,
      geburtsdatum: geburtsdatum || null,
      klasse,
      land: land || null,
      bundesland: bundesland || null,
      schulform: schulform || null,
      schule: schule.trim() || null,
      faecher,
    };
  }

  function prefill(d: OnboardingData) {
    setVorname(d.vorname);
    setNachname(d.nachname ?? "");
    setGeburtsdatum(d.geburtsdatum ?? "");
    setKlasse(d.klasse);
    setLand(d.land ?? "");
    setBundesland((d.bundesland as Bundesland) ?? "");
    setSchulform(d.schulform ?? "");
    setSchule(d.schule ?? "");
    setFaecher(d.faecher ?? []);
  }

  useEffect(() => {
    if (!isLoggedIn) return;
    const pending = loadOnboarding();
    if (pending && pending.vorname && pending.klasse) {
      (async () => {
        const res = await applyOnboarding(pending);
        if (res.ok) {
          clearOnboarding();
          router.replace("/dashboard");
        } else {
          toast.error(`Konnte Onboarding nicht abschließen: ${res.error}`);
          prefill(pending);
          setFlushing(false);
        }
      })();
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFlushing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  function waehleModus(m: Theme) {
    document.documentElement.classList.toggle("dark", m === "dark");
    void setTheme(m);
    setModusGewaehlt(true);
  }

  const back = () => {
    // step 6 (Bundesland) → skip back to step 5 if non-DE
    if (step === 7 && land && land !== "de") {
      setStep(5);
      return;
    }
    setStep((s) => Math.max(1, s - 1));
  };

  const next = () => {
    // step 5 (Land) → skip Bundesland (step 6) for non-DE
    if (step === 5 && land && land !== "de") {
      setStep(7);
      return;
    }
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  };

  function toggleVorschlag(name: string) {
    setFaecher((prev) =>
      prev.some((f) => f.name === name)
        ? prev.filter((f) => f.name !== name)
        : [...prev, { name, niveau: "grund" }],
    );
  }

  function freitextHinzufuegen() {
    const trimmed = freitextName.trim();
    if (!trimmed) return;
    if (faecher.some((f) => f.name.toLowerCase() === trimmed.toLowerCase())) {
      setFreitextName("");
      return;
    }
    setFaecher((prev) => [...prev, { name: trimmed, niveau: freitextNiveau }]);
    setFreitextName("");
    setFreitextNiveau("grund");
  }

  function finish() {
    const data = buildData();
    if (!data.vorname || !data.klasse) {
      toast.error("Vorname und Klasse fehlen.");
      return;
    }
    if (isLoggedIn) {
      startTransition(async () => {
        const res = await applyOnboarding(data);
        if (!res.ok) {
          toast.error(`Fehler: ${res.error}`);
          return;
        }
        clearOnboarding();
        router.push("/dashboard");
      });
    } else {
      saveOnboarding(data);
      router.push("/signup");
    }
  }

  if (flushing) {
    return (
      <main className="relative z-[5] flex min-h-screen flex-col items-center justify-center gap-3 px-5">
        <Loader2 className="size-6 animate-spin text-brand" />
        <p className="font-mono text-sm text-text-mute">Richte dein Konto ein…</p>
      </main>
    );
  }

  // Modus-Screen zählt als Schritt 1; Bundesland-Auslassung (non-DE) reduziert die Gesamtzahl
  const baseTotal = land && land !== "de" ? TOTAL_STEPS - 1 : TOTAL_STEPS;
  const displayTotal = baseTotal + 1;
  const displayStep = !modusGewaehlt
    ? 1
    : (step === 7 && land && land !== "de" ? 6 : step) + 1;

  return (
    <main className="relative z-[5] flex min-h-screen flex-col items-center px-5 py-12 sm:px-8">
      {/* Progress */}
      <div className="w-full max-w-md">
        <div className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[.25em] text-brand">
          Schritt {displayStep} von {displayTotal}
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: displayTotal }).map((_, i) => (
            <div
              key={i}
              className="h-1 flex-1 rounded-full transition-[background-color] duration-500"
              style={{
                background:
                  displayStep >= i + 1
                    ? "linear-gradient(90deg, var(--brand), var(--brand-2))"
                    : "var(--surface-3)",
              }}
            />
          ))}
        </div>
      </div>

      <div className="mt-10 w-full max-w-md animate-fade-up" key={modusGewaehlt ? `step-${step}` : "modus"}>
        {/* ── 0 · Modus-Wahl (Schwarz / Weiß) ── */}
        {!modusGewaehlt && (
          <>
            <h1 className="font-display text-4xl font-extrabold leading-tight">
              Wähl deinen Look
            </h1>
            <p className="mt-2 text-sm text-text-dim">
              Hell oder dunkel — du kannst das später jederzeit ändern.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-3">
              <button
                onClick={() => waehleModus("dark")}
                className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface-2 p-5 transition-[border-color] hover:border-brand/50"
              >
                <span
                  className="flex h-20 w-full items-center justify-center rounded-xl border border-white/10"
                  style={{ background: "linear-gradient(160deg, #202021, #0e0e0f)" }}
                >
                  <span
                    className="size-8 rounded-full"
                    style={{ background: "linear-gradient(150deg,#3a3a3d,#151516)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15)" }}
                  />
                </span>
                <span className="font-display font-extrabold">Schwarz</span>
              </button>
              <button
                onClick={() => waehleModus("light")}
                className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface-2 p-5 transition-[border-color] hover:border-brand/50"
              >
                <span
                  className="flex h-20 w-full items-center justify-center rounded-xl border border-black/10"
                  style={{ background: "linear-gradient(160deg, #ffffff, #f0eee9)" }}
                >
                  <span
                    className="size-8 rounded-full"
                    style={{ background: "linear-gradient(150deg,#ffffff,#d8d8dd)", boxShadow: "0 2px 6px rgba(0,0,0,0.15), inset 0 1px 0 #fff" }}
                  />
                </span>
                <span className="font-display font-extrabold">Weiß</span>
              </button>
            </div>
          </>
        )}

        {/* ── 1 · Vorname (Pflicht) ── */}
        {modusGewaehlt && step === 1 && (
          <>
            <h1 className="font-display text-4xl font-extrabold leading-tight">
              Wie heißt du?
            </h1>
            <p className="mt-2 text-sm text-text-dim">
              Damit die App dich persönlich anspricht.
            </p>
            <input
              autoFocus
              type="text"
              value={vorname}
              onChange={(e) => setVorname(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && vorname.trim() && next()}
              placeholder="Dein Vorname"
              className={textInput}
            />
            <button onClick={next} disabled={!vorname.trim()} className={primaryBtn}>
              Weiter →
            </button>
          </>
        )}

        {/* ── 2 · Nachname (optional) ── */}
        {step === 2 && (
          <>
            <h1 className="font-display text-4xl font-extrabold leading-tight">
              Dein Nachname?
            </h1>
            <p className="mt-2 text-sm text-text-dim">Optional — kannst du auch leer lassen.</p>
            <input
              autoFocus
              type="text"
              value={nachname}
              onChange={(e) => setNachname(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && next()}
              placeholder="Nachname"
              className={textInput}
            />
            <button onClick={next} className={primaryBtn}>Weiter →</button>
            <button onClick={() => { setNachname(""); next(); }} className={subtleBtn}>
              Überspringen
            </button>
            <button onClick={back} className={subtleBtn}>← Zurück</button>
          </>
        )}

        {/* ── 3 · Geburtsdatum (optional) ── */}
        {step === 3 && (
          <>
            <h1 className="font-display text-4xl font-extrabold leading-tight">
              Wann hast du Geburtstag?
            </h1>
            <p className="mt-2 text-sm text-text-dim">
              Optional — für kleine Extras wie einen Geburtstagsgruß.
            </p>
            <input
              autoFocus
              type="date"
              value={geburtsdatum}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setGeburtsdatum(e.target.value)}
              className={textInput}
            />
            <button onClick={next} className={primaryBtn}>Weiter →</button>
            <button onClick={() => { setGeburtsdatum(""); next(); }} className={subtleBtn}>
              Überspringen
            </button>
            <button onClick={back} className={subtleBtn}>← Zurück</button>
          </>
        )}

        {/* ── 4 · Klasse (Pflicht) ── */}
        {step === 4 && (
          <>
            <h1 className="font-display text-4xl font-extrabold leading-tight">
              In welcher Klasse bist du?
            </h1>
            <p className="mt-2 text-sm text-text-dim">Tipp einfach drauf.</p>
            <div className="mt-8 grid grid-cols-5 gap-2">
              {[5, 6, 7, 8, 9, 10, 11, 12, 13].map((k) => (
                <button
                  key={k}
                  onClick={() => { setKlasse(k); next(); }}
                  className={`rounded-2xl border py-4 font-display text-xl font-extrabold transition-[border-color,background-color,color,box-shadow] ${
                    klasse === k
                      ? "border-brand bg-brand/10 text-brand shadow-[0_0_20px_color-mix(in_srgb,var(--brand)_25%,transparent)]"
                      : "border-border bg-surface-2 text-text-dim hover:bg-surface-3"
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
            <button onClick={back} className={subtleBtn}>← Zurück</button>
          </>
        )}

        {/* ── 5 · Land (Pflicht) ── */}
        {step === 5 && (
          <>
            <h1 className="font-display text-4xl font-extrabold leading-tight">
              In welchem Land gehst du zur Schule?
            </h1>
            <p className="mt-2 text-sm text-text-dim">
              Damit wir Ferien und Feiertage richtig anzeigen können.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-3">
              {LAENDER.map((l) => (
                <button
                  key={l.code}
                  onClick={() => { setLand(l.code); setBundesland(""); setStep(l.code === "de" ? 6 : 7); }}
                  className={`flex flex-col items-center gap-2 rounded-2xl border py-6 font-display font-extrabold transition-[border-color,background-color,color,box-shadow] ${
                    land === l.code
                      ? "border-brand bg-brand/10 text-brand shadow-[0_0_20px_color-mix(in_srgb,var(--brand)_25%,transparent)]"
                      : "border-border bg-surface-2 text-text-dim hover:bg-surface-3"
                  }`}
                >
                  <span className="text-3xl">{l.emoji}</span>
                  <span className="text-sm">{l.label}</span>
                </button>
              ))}
            </div>
            <button onClick={back} className={subtleBtn}>← Zurück</button>
          </>
        )}

        {/* ── 6 · Bundesland (Pflicht, nur DE) ── */}
        {step === 6 && (
          <>
            <h1 className="font-display text-4xl font-extrabold leading-tight">
              Welches Bundesland?
            </h1>
            <p className="mt-2 text-sm text-text-dim">
              Für Ferien-Countdown und das richtige Notensystem.
            </p>
            <div className="mt-6 flex flex-col gap-1.5">
              {(Object.entries(BUNDESLAND_LABEL) as [Bundesland, string][]).map(
                ([code, label]) => (
                  <button
                    key={code}
                    onClick={() => { setBundesland(code); next(); }}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-medium transition-[border-color,background-color,color] ${
                      bundesland === code
                        ? "border-brand bg-brand/10 text-brand"
                        : "border-border bg-surface-2 text-foreground hover:bg-surface-3"
                    }`}
                  >
                    {label}
                    <span className="font-mono text-[10px] text-text-mute">{code}</span>
                  </button>
                ),
              )}
            </div>
            <button onClick={back} className={subtleBtn}>← Zurück</button>
          </>
        )}

        {/* ── 7 · Schulform (optional) ── */}
        {step === 7 && (
          <>
            <h1 className="font-display text-4xl font-extrabold leading-tight">
              Auf welche Schule gehst du?
            </h1>
            <p className="mt-2 text-sm text-text-dim">Optional.</p>
            {land && land !== "de" && (
              <div
                className="mt-4 rounded-xl border px-4 py-3 font-mono text-xs text-text-mute"
                style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
              >
                💡 Ferien-Countdown und Feiertage sind aktuell nur für Deutschland verfügbar.
              </div>
            )}
            <div className="mt-6 grid grid-cols-2 gap-3">
              {SCHULFORMEN.map((sf) => (
                <button
                  key={sf.code}
                  onClick={() => { setSchulform(sf.code); next(); }}
                  className={`rounded-2xl border py-5 font-display text-lg font-extrabold transition-[border-color,background-color,color] ${
                    schulform === sf.code
                      ? "border-brand bg-brand/10 text-brand"
                      : "border-border bg-surface-2 text-text-dim hover:bg-surface-3"
                  }`}
                >
                  {sf.label}
                </button>
              ))}
            </div>
            <button onClick={() => { setSchulform(""); next(); }} className={subtleBtn}>
              Überspringen
            </button>
            <button onClick={back} className={subtleBtn}>← Zurück</button>
          </>
        )}

        {/* ── 8 · Schulname (optional) ── */}
        {step === 8 && (
          <>
            <h1 className="font-display text-4xl font-extrabold leading-tight">
              Wie heißt deine Schule?
            </h1>
            <p className="mt-2 text-sm text-text-dim">Optional — Freitext.</p>
            <input
              autoFocus
              type="text"
              value={schule}
              onChange={(e) => setSchule(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && next()}
              placeholder="z. B. Schule am Stadtpark"
              className={textInput}
            />
            <button onClick={next} className={primaryBtn}>Weiter →</button>
            <button onClick={() => { setSchule(""); next(); }} className={subtleBtn}>
              Überspringen
            </button>
            <button onClick={back} className={subtleBtn}>← Zurück</button>
          </>
        )}

        {/* ── 9 · Fächer ── */}
        {step === 9 && (
          <>
            <h1 className="font-display text-4xl font-extrabold leading-tight">
              Deine Fächer
            </h1>
            <p className="mt-2 text-sm text-text-dim">
              Antippen zum Auswählen. Kannst du jederzeit ändern.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {VORSCHLAG_FAECHER.map((fach) => {
                const ausgewaehlt = faecher.some((f) => f.name === fach);
                return (
                  <button
                    key={fach}
                    onClick={() => toggleVorschlag(fach)}
                    className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-[border-color,background-color,color] ${
                      ausgewaehlt
                        ? "border-brand bg-primary text-primary-foreground"
                        : "border-border bg-surface-2 text-foreground hover:border-brand/40 hover:bg-surface-3"
                    }`}
                  >
                    {ausgewaehlt ? "✓ " : "+ "}{fach}
                  </button>
                );
              })}
            </div>

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
                onChange={(e) => setFreitextNiveau(e.target.value as OnboardingNiveau)}
                className="rounded-xl border border-border bg-surface-2 px-2 py-2.5 text-sm outline-none focus:border-brand"
              >
                <option value="grund">GK</option>
                <option value="erhoeht">LK</option>
              </select>
              <button
                onClick={freitextHinzufuegen}
                disabled={!freitextName.trim()}
                className="rounded-xl bg-primary px-3 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50"
              >
                +
              </button>
            </div>

            {faecher.length > 0 && (
              <div className="mt-4 rounded-2xl border border-border bg-surface-2 p-3">
                <div className="mb-2 font-mono text-[10px] uppercase tracking-[.15em] text-text-mute">
                  Ausgewählt · LK/GK anpassen
                </div>
                <div className="flex flex-col gap-1.5">
                  {faecher.map((f) => (
                    <div
                      key={f.name}
                      className="flex items-center justify-between rounded-xl bg-surface-3 px-3 py-2"
                    >
                      <span className="text-sm font-medium">{f.name}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            setFaecher((prev) =>
                              prev.map((x) =>
                                x.name === f.name
                                  ? { ...x, niveau: x.niveau === "grund" ? "erhoeht" : "grund" }
                                  : x,
                              ),
                            )
                          }
                          className={`rounded-lg px-2 py-0.5 text-xs font-bold transition-colors ${
                            f.niveau === "erhoeht"
                              ? "bg-indigo-500/20 text-indigo-300"
                              : "bg-surface-2 text-text-mute hover:text-text-dim"
                          }`}
                        >
                          {f.niveau === "erhoeht" ? "LK" : "GK"}
                        </button>
                        <button
                          onClick={() => setFaecher((prev) => prev.filter((x) => x.name !== f.name))}
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

            <button onClick={finish} disabled={isPending} className={primaryBtn}>
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Wird eingerichtet…
                </span>
              ) : isLoggedIn ? (
                faecher.length > 0 ? `Los geht's mit ${faecher.length} Fächern →` : "Los geht's →"
              ) : (
                "Konto erstellen →"
              )}
            </button>
            <button onClick={back} className={subtleBtn}>← Zurück</button>
          </>
        )}
      </div>
    </main>
  );
}
