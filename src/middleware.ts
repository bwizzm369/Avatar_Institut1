import { type NextRequest, NextResponse } from "next/server";
import { resolveAdminSessionAccess } from "@/lib/admin/guards";
import { resolveDashboardAccess } from "@/lib/auth/guards";
import {
  applySessionCookies,
  updateSession,
} from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
