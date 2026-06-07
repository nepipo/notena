"use server";

import { cookies } from "next/headers";

export type Theme = "dark" | "light" | "system";

export async function setTheme(theme: Theme): Promise<void> {
  const store = await cookies();
  store.set("project-x-theme", theme, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
