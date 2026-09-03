import { type NextRequest, NextResponse } from "next/server";
import { resolveAdminSessionAccess } from "@/lib/admin/guards";
import { resolveDashboardAccess } from "@/lib/auth/guards";
import {
  AUTH_CALLBACK_PATH,
  FORGOT_PASSWORD_PATH,
  isSupabaseEmailLinkError,
  recoveryExpiredRedirect,
  resolveAuthCallbackNext,
} from "@/lib/auth/password-reset";
import {
  applySessionCookies,
  updateSession,
} from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const params = request.nextUrl.searchParams;

  if (
    isSupabaseEmailLinkError({
      error: params.get("error"),
      errorCode: params.get("error_code"),
      errorDescription: params.get("error_description"),
    }) &&
    pathname !== FORGOT_PASSWORD_PATH
  ) {
    return NextResponse.redirect(
      new URL(recoveryExpiredRedirect(), request.url),
    );
  }

  const authCode = params.get("code");
  const tokenHash = params.get("token_hash");
  if (
    (authCode || tokenHash) &&
    pathname !== AUTH_CALLBACK_PATH &&
    !pathname.startsWith("/auth/")
  ) {
    const callbackUrl = request.nextUrl.clone();
    callbackUrl.pathname = AUTH_CALLBACK_PATH;
    const next = resolveAuthCallbackNext(
      params.get("next"),
      params.get("type"),
    );
    callbackUrl.searchParams.set("next", next);
    return NextResponse.redirect(callbackUrl);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  const { response, userId, configured, cookiesToApply } = await updateSession(
    request,
    requestHeaders,
  );

  const dashboardAccess = resolveDashboardAccess({
    pathname,
    userId,
    supabaseConfigured: configured,
  });

  if (!dashboardAccess.allowed && dashboardAccess.redirectTo) {
    const redirectUrl = new URL(dashboardAccess.redirectTo, request.url);
    const redirectResponse = NextResponse.redirect(redirectUrl);
    applySessionCookies(redirectResponse, cookiesToApply);
    return redirectResponse;
  }

  const adminAccess = resolveAdminSessionAccess({
    pathname,
    userId,
    supabaseConfigured: configured,
  });

  if (!adminAccess.allowed && adminAccess.redirectTo) {
    const redirectUrl = new URL(adminAccess.redirectTo, request.url);
    const redirectResponse = NextResponse.redirect(redirectUrl);
    applySessionCookies(redirectResponse, cookiesToApply);
    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
