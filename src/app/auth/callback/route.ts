import { NextResponse } from "next/server";
import { safeAuthRedirect } from "@/lib/auth/guards";
import { callbackFailureRedirect } from "@/lib/auth/password-reset";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeAuthRedirect(url.searchParams.get("next"));

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(new URL(`/login?error=config`, url.origin));
  }

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        new URL(callbackFailureRedirect(next), url.origin),
      );
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
