"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { useCustomKategorien } from "@/components/kategorien-provider";
import type { Kategorie, CustomKategorie } from "@/lib/grades/types";

export const BUILTIN_LABELS: Record<string, string> = {
  klausur: "Klausur",
  muendlich: "Mündlich",
  test: "Test",
  referat: "Referat",
  hausaufgabe: "Hausaufgabe",
  sonstige: "Sonstige",
};

export const BUILTIN_KUERZEL: Record<string, string> = {
  klausur: "K",
  muendlich: "M",
  test: "T",
  referat: "R",
  hausaufgabe: "H",
  sonstige: "S",
};

export function katLabel(k: string, custom: CustomKategorie[] = []): string {
  if (BUILTIN_LABELS[k]) return BUILTIN_LABELS[k];
  const c = custom.find((c) => c.id === k);
  return c?.name ?? k;
}

export function katKuerzel(k: string, custom: CustomKategorie[] = []): string {
  if (BUILTIN_KUERZEL[k]) return BUILTIN_KUERZEL[k];
  const c = custom.find((c) => c.id === k);
  return c?.kurzname ?? k.slice(0, 2).toUpperCase();
}

const BUILTIN_OPTIONEN = [
  { wert: "klausur", label: "Klausur", kurz: "K" },
  { wert: "muendlich", label: "Mündlich", kurz: "M" },
  { wert: "test", label: "Test", kurz: "T" },
  { wert: "referat", label: "Referat", kurz: "R" },
  { wert: "hausaufgabe", label: "Hausaufgabe", kurz: "H" },
  { wert: "sonstige", label: "Sonstige", kurz: "S" },
];

export function KategorieSelector({
  value,
  onChange,
}: {
  value: Kategorie;
  onChange: (k: Kategorie) => void;
}) {
  const custom = useCustomKategorien();
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        buttonRef.current && !buttonRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function handleToggle() {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 4, left: rect.left });
    }
    setOpen((v) => !v);
  }

  const alleOptionen = [
    ...BUILTIN_OPTIONEN,
    ...custom.map((c) => ({ wert: c.id, label: c.name, kurz: c.kurzname })),
  ];

  const aktuelle = alleOptionen.find((o) => o.wert === value) ?? alleOptionen[0];

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-mono text-[11px] font-semibold transition-colors active:scale-[0.96] ${open ? "border-brand/40 bg-brand/10 text-brand" : "border-border bg-surface-2 text-text-dim hover:bg-surface-3"}`}
      >
        {aktuelle.label}
        <ChevronDown className={`size-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {typeof document !== "undefined" && createPortal(
        <div
          ref={dropdownRef}
          style={{ top: dropdownPos.top, left: dropdownPos.left }}
          className={`fixed z-[9999] min-w-[10rem] rounded-2xl border border-border/60 bg-surface-1/95 p-1.5 shadow-xl backdrop-blur-md transition-[opacity,transform] duration-150 origin-top-left ${open ? "pointer-events-auto scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"}`}
        >
          {alleOptionen.map((opt) => (
            <button
              key={opt.wert}
              type="button"
              onClick={() => { onChange(opt.wert); setOpen(false); }}
              className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 font-mono text-[11px] text-left transition-colors ${value === opt.wert ? "bg-primary font-semibold text-primary-foreground" : "text-text-dim hover:bg-surface-3"}`}
            >
              <span className="w-4 shrink-0 text-center opacity-60">{opt.kurz}</span>
              {opt.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
