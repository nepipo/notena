"use client";

import { Printer } from "lucide-react";

/** Löst den Browser-Druckdialog aus → „Als PDF speichern". Im Druck selbst versteckt. */
export function ReportPrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
    >
      <Printer className="size-4" />
      Als PDF speichern
    </button>
  );
}
