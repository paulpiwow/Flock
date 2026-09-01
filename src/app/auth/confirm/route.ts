import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Landing route for Supabase auth links. Today that's the password-reset link
 * an RS generates on the People page; the same handler works for any Supabase
 * auth email (confirmation, magic link) if those are ever turned on.
 *
 * Accepts either form Supabase can produce:
 *   - ?token_hash=...&type=recovery  (RS reset link / {{ .TokenHash }} template)
 *   - ?code=...                      (default {{ .ConfirmationURL }} template)
 *
 * On success the user has a session cookie and is sent to `next`. On failure
 * they go back to login with an error flag.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");

  // Only allow same-site relative paths as the destination.
  const rawNext = searchParams.get("next") ?? "/home";
  const next =
    rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/home";

  const supabase = await createClient();
  let ok = false;

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    ok = !error;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  }

  const url = request.nextUrl.clone();
  url.search = "";
  if (ok) {
    url.pathname = next;
  } else {
    url.pathname = "/";
    url.searchParams.set("error", "link");
  }
  return NextResponse.redirect(url);
}
