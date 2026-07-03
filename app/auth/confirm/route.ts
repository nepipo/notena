import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest, after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendWelcomeMail } from "@/lib/email/welcome";

/**
 * Bestätigt die E-Mail über den Link aus der Verifizierungs-Mail.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/dashboard";

  if (token_hash && type) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.verifyOtp({ type, token_hash });

    if (!error) {
      // Welcome-Mail nur bei Signup-Bestätigung, nicht bei Recovery/E-Mail-Wechsel.
      // after() blockiert den Redirect nicht, hält die Serverless-Function aber
      // lange genug am Leben, damit die Mail rausgeht.
      const email = data.user?.email;
      if (email && (type === "signup" || type === "email")) {
        after(() => sendWelcomeMail(email));
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=confirm`);
}
