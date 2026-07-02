"use client";

import { createContext, useContext } from "react";
import type { CustomKategorie } from "@/lib/grades/types";

const KategorienContext = createContext<CustomKategorie[]>([]);

export function KategorienProvider({
  custom,
  children,
}: {
  custom: CustomKategorie[];
  children: React.ReactNode;
}) {
  return (
    <KategorienContext.Provider value={custom}>
      {children}
    </KategorienContext.Provider>
  );
}

export function useCustomKategorien(): CustomKategorie[] {
  return useContext(KategorienContext);
}
