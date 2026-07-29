/**
 * Dashboard route protection helpers (pure — used by middleware and tests).
 */

export function isDashboardPath(pathname: string): boolean {
  return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
}

export function isAuthPath(pathname: string): boolean {
  return (
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname.startsWith("/auth/")
  );
}

/**
 * Decide where to send the user for a dashboard request.
 * - Unauthenticated → login (with next=)
 * - Supabase not configured → login (shows configuration message)
 * - Authenticated → stay on dashboard
 */
export function resolveDashboardAccess(options: {
  pathname: string;
  userId: string | null;
  supabaseConfigured: boolean;
}): { allowed: boolean; redirectTo: string | null } {
  if (!isDashboardPath(options.pathname)) {
    return { allowed: true, redirectTo: null };
  }

  if (!options.supabaseConfigured || !options.userId) {
    const next = encodeURIComponent(options.pathname);
    return { allowed: false, redirectTo: `/login?next=${next}` };
  }

  return { allowed: true, redirectTo: null };
}

/**
 * Safe post-login redirect: only same-origin relative paths.
 */
export function safeAuthRedirect(
  next: string | null | undefined,
  fallback = "/dashboard",
): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return fallback;
  }
  if (next.includes("://") || next.includes("\\")) {
    return fallback;
  }
  return next;
}
