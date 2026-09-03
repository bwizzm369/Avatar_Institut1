import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import {
  callbackFailureRedirect,
  isAuthOtpType,
  isPasswordResetNext,
  isSupabaseEmailLinkError,
  passwordRecoveryCookieOptions,
  PASSWORD_RECOVERY_COOKIE,
  recoveryExpiredRedirect,
  resolveAuthCallbackNext,
  UPDATE_PASSWORD_PATH,
} from "@/lib/auth/password-reset";
import { getSupabasePublicConfig } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

type PendingCookie = {
  name: string;
  value: string;
  options: CookieOptions;
};

function applyCookies(
  response: NextResponse,
  pending: PendingCookie[],
): void {
  pending.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const next = resolveAuthCallbackNext(url.searchParams.get("next"), type);

  if (
    isSupabaseEmailLinkError({
      error: url.searchParams.get("error"),
      errorCode: url.searchParams.get("error_code"),
      errorDescription: url.searchParams.get("error_description"),
    })
  ) {
    return NextResponse.redirect(new URL(recoveryExpiredRedirect(), url.origin));
  }

  const config = getSupabasePublicConfig();
  if (!config) {
    return NextResponse.redirect(new URL(`/login?error=config`, url.origin));
  }

  const cookieStore = await cookies();
  const pendingCookies: PendingCookie[] = [];
  const supabase = createServerClient<Database>(
    config.url,
    config.publishableKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          pendingCookies.splice(0, pendingCookies.length, ...cookiesToSet);
          cookiesToSet.forEach(({ name, value, options }) => {
            try {
              cookieStore.set(name, value, options);
            } catch {
              // Redirect response copies pending cookies below.
            }
          });
        },
      },
    },
  );

  const isRecovery = type === "recovery" || isPasswordResetNext(next);

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const failure = NextResponse.redirect(
        new URL(callbackFailureRedirect(next, type), url.origin),
      );
      applyCookies(failure, pendingCookies);
      return failure;
    }
  } else if (tokenHash && isAuthOtpType(type)) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
    if (error) {
      const failure = NextResponse.redirect(
        new URL(callbackFailureRedirect(next, type), url.origin),
      );
      applyCookies(failure, pendingCookies);
      return failure;
    }
  } else if (isRecovery) {
    return NextResponse.redirect(
      new URL(recoveryExpiredRedirect(), url.origin),
    );
  }

  const destination = isRecovery ? UPDATE_PASSWORD_PATH : next;
  const response = NextResponse.redirect(new URL(destination, url.origin));
  applyCookies(response, pendingCookies);
  if (isRecovery) {
    response.cookies.set(
      PASSWORD_RECOVERY_COOKIE,
      "1",
      passwordRecoveryCookieOptions(url.protocol === "https:"),
    );
  }
  return response;
}
