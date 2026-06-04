"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; success?: string } | null;

function getOrigin(headerList: Headers) {
  return (
    headerList.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000"
  );
}

export async function login(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Bitte E-Mail und Passwort eingeben." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "E-Mail oder Passwort ist falsch." };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Bitte E-Mail und Passwort eingeben." };
  }
  if (password.length < 8) {
    return { error: "Das Passwort muss mindestens 8 Zeichen haben." };
  }

  const supabase = await createClient();
  const origin = getOrigin(await headers());

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/confirm` },
  });

  if (error) {
    return { error: error.message };
  }

  // Email-Bestätigung deaktiviert -> Session existiert sofort
  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/dashboard");
  }

  return {
    success:
      "Fast geschafft! Wir haben dir eine E-Mail geschickt — bestätige den Link, um loszulegen.",
  };
}

export async function signInWithGoogle(): Promise<void> {
  const supabase = await createClient();
  const origin = getOrigin(await headers());

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback` },
  });

  if (error) {
    redirect("/login?error=oauth");
  }
  if (data.url) {
    redirect(data.url);
  }
}

export async function requestPasswordReset(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    return { error: "Bitte gib deine E-Mail ein." };
  }

  const supabase = await createClient();
  const origin = getOrigin(await headers());

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm?next=/auth/reset`,
  });

  if (error) {
    return { error: error.message };
  }

  // Generische Erfolgsmeldung (verhindert, dass man rät, welche Mails existieren).
  return {
    success:
      "Falls ein Konto mit dieser E-Mail existiert, haben wir dir einen Link zum Zurücksetzen geschickt.",
  };
}

export async function updatePassword(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) {
    return { error: "Das Passwort muss mindestens 8 Zeichen haben." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: "Link abgelaufen oder ungültig. Fordere einen neuen an." };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect("/login");
}

export async function deleteAccount(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return { error: "Nicht eingeloggt." };

  const { error } = await supabase.rpc("delete_current_user");
  if (error) return { error: "Konto konnte nicht gelöscht werden." };

  await supabase.auth.signOut({ scope: "local" });
  redirect("/login");
}
