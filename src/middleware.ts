import { type NextRequest, NextResponse } from "next/server";
import { resolveDashboardAccess } from "@/lib/auth/guards";
import {
  applySessionCookies,
  updateSession,
} from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { response, userId, configured, cookiesToApply } =
    await updateSession(request);
  const { pathname } = request.nextUrl;

  const access = resolveDashboardAccess({
    pathname,
    userId,
    supabaseConfigured: configured,
  });

  if (!access.allowed && access.redirectTo) {
    const redirectUrl = new URL(access.redirectTo, request.url);
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
