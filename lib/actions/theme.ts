"use server";

import { cookies } from "next/headers";

export type Theme = "dark" | "light" | "system";
export type AccentColor = "blue" | "violet" | "pink" | "green" | "orange" | "red" | "teal" | "indigo";

export async function setTheme(theme: Theme): Promise<void> {
  const store = await cookies();
  store.set("notena-theme", theme, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}

export async function setAccent(accent: AccentColor): Promise<void> {
  const store = await cookies();
  store.set("notena-accent", accent, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
