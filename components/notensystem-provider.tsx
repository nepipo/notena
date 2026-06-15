"use client";

import { createContext, useContext } from "react";
import { getNotensystem, type Notensystem } from "@/lib/grades/systems";

const NotensystemContext = createContext<Notensystem>(getNotensystem("de_0_15"));

export function NotensystemProvider({
  systemId,
  children,
}: {
  systemId: string;
  children: React.ReactNode;
}) {
  return (
    <NotensystemContext.Provider value={getNotensystem(systemId)}>
      {children}
    </NotensystemContext.Provider>
  );
}

export function useNotensystem(): Notensystem {
  return useContext(NotensystemContext);
}
