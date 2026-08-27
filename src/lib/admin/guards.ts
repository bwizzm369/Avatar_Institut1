/**
 * Admin route protection helpers (pure — used by middleware and tests).
 * Role checks must still run on the server (layout / actions) — middleware
 * only enforces session presence for protected admin paths.
 */

export function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export function isAdminLoginPath(pathname: string): boolean {
  return pathname === "/admin/login";
}

export function isProtectedAdminPath(pathname: string): boolean {
  return isAdminPath(pathname) && !isAdminLoginPath(pathname);
}

/**
 * Session-level gate for /admin/* (except /admin/login).
 * Does NOT verify role — that must happen in a Server Component / action.
 */
export function resolveAdminSessionAccess(options: {
  pathname: string;
  userId: string | null;
  supabaseConfigured: boolean;
}): { allowed: boolean; redirectTo: string | null } {
  if (!isProtectedAdminPath(options.pathname)) {
    return { allowed: true, redirectTo: null };
  }

  if (!options.supabaseConfigured || !options.userId) {
    const next = encodeURIComponent(options.pathname);
    return {
      allowed: false,
      redirectTo: `/admin/login?next=${next}`,
    };
  }

  return { allowed: true, redirectTo: null };
}

export type ProfileRole = "student" | "admin";

export function isAdminRole(role: string | null | undefined): boolean {
  return role === "admin";
}
