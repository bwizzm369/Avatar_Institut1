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

export function isAdminVerifyPath(pathname: string): boolean {
  return pathname === "/admin/verify";
}

export function isProtectedAdminPath(pathname: string): boolean {
  return (
    isAdminPath(pathname) &&
    !isAdminLoginPath(pathname) &&
    !isAdminVerifyPath(pathname)
  );
}

/**
 * Session-level gate for /admin/* (except /admin/login).
 * /admin/verify requires a session but not the verification cookie.
 * Console paths require a session; role and email verification run on the server.
 */
export function resolveAdminSessionAccess(options: {
  pathname: string;
  userId: string | null;
  supabaseConfigured: boolean;
}): { allowed: boolean; redirectTo: string | null } {
  if (isAdminLoginPath(options.pathname)) {
    return { allowed: true, redirectTo: null };
  }

  if (isAdminVerifyPath(options.pathname)) {
    if (!options.supabaseConfigured || !options.userId) {
      return {
        allowed: false,
        redirectTo: "/admin/login?next=%2Fadmin%2Fverify",
      };
    }
    return { allowed: true, redirectTo: null };
  }

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
