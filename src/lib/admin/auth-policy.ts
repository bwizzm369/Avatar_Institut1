/**
 * Pure admin/student auth separation policy (testable without Supabase).
 * Server layouts/actions remain the authority for session + role checks.
 */

import {
  isAdminPath,
  isAdminRole,
  resolveAdminSessionAccess,
  type ProfileRole,
} from "@/lib/admin/guards";
import {
  ADMIN_HOME_PATH,
  ADMIN_LOGIN_PATH,
  adminVerifyRedirect,
} from "@/lib/admin/paths";
import {
  resolveDashboardAccess,
  safeAuthRedirect,
} from "@/lib/auth/guards";

export type AdminLoginDecision =
  | { outcome: "allow"; redirectTo: string }
  | { outcome: "challenge"; redirectTo: string }
  | { outcome: "deny"; error: string; shouldSignOut: true }
  | { outcome: "unauthenticated"; error: string };

/**
 * After credentials succeed on /admin/login: require profiles.role = admin.
 * Non-admins must be refused and signed out of that attempt.
 */
export function decideAdminLogin(options: {
  authenticated: boolean;
  role: string | null | undefined;
  nextPath?: string | null;
}): AdminLoginDecision {
  if (!options.authenticated) {
    return { outcome: "unauthenticated", error: "Invalid email or password." };
  }

  if (!isAdminRole(options.role as ProfileRole)) {
    return {
      outcome: "deny",
      error: "Access denied. This account is not an administrator.",
      shouldSignOut: true,
    };
  }

  return {
    outcome: "challenge",
    redirectTo: adminVerifyRedirect(resolveSafeAdminRedirect(options.nextPath)),
  };
}

export function resolveSafeAdminRedirect(
  nextPath?: string | null,
): string {
  const redirectTo = safeAuthRedirect(nextPath, ADMIN_HOME_PATH);
  if (redirectTo === ADMIN_HOME_PATH || redirectTo.startsWith("/admin/")) {
    return redirectTo;
  }
  return ADMIN_HOME_PATH;
}

export type AdminConsoleDecision =
  | { outcome: "redirect_login"; redirectTo: string }
  | { outcome: "redirect_verify"; redirectTo: string }
  | { outcome: "deny" }
  | { outcome: "allow" };

/**
 * Server console gate for /admin/* except /admin/login and /admin/verify.
 * - no session → /admin/login
 * - student (or non-admin) → access denied
 * - admin without email verification → /admin/verify
 * - verified admin → allow
 */
export function decideAdminConsoleAccess(options: {
  status:
    | "unconfigured"
    | "unauthenticated"
    | "forbidden"
    | "needs_verification"
    | "ok";
  pathname?: string;
}): AdminConsoleDecision {
  if (
    options.status === "unconfigured" ||
    options.status === "unauthenticated"
  ) {
    const pathname = options.pathname ?? ADMIN_HOME_PATH;
    const next = encodeURIComponent(pathname);
    return {
      outcome: "redirect_login",
      redirectTo: `${ADMIN_LOGIN_PATH}?next=${next}`,
    };
  }

  if (options.status === "forbidden") {
    return { outcome: "deny" };
  }

  if (options.status === "needs_verification") {
    const pathname = options.pathname ?? ADMIN_HOME_PATH;
    return {
      outcome: "redirect_verify",
      redirectTo: adminVerifyRedirect(resolveSafeAdminRedirect(pathname)),
    };
  }

  return { outcome: "allow" };
}

/**
 * Student /login destination: default /dashboard.
 * Never send students into the admin console via ?next=.
 */
export function resolveStudentLoginDestination(
  nextPath?: string | null,
): string {
  const dest = safeAuthRedirect(nextPath, "/dashboard");
  if (isAdminPath(dest)) {
    return "/dashboard";
  }
  return dest;
}

/**
 * Admins may open /dashboard as authenticated users (shared Supabase session).
 * Primary admin journey remains /admin/login → /admin — no auto-redirect away
 * from the student space, so admins can preview the student experience.
 */
export function adminMayAccessStudentDashboard(): boolean {
  return true;
}

/** Convenience wrappers used by separation tests. */
export function studentUnauthenticatedAdminGate(pathname = "/admin") {
  return resolveAdminSessionAccess({
    pathname,
    userId: null,
    supabaseConfigured: true,
  });
}

export function authenticatedRoleOnAdminConsole(role: ProfileRole) {
  const session = resolveAdminSessionAccess({
    pathname: "/admin",
    userId: "user-1",
    supabaseConfigured: true,
  });
  const consoleGate = decideAdminConsoleAccess({
    status: isAdminRole(role) ? "ok" : "forbidden",
  });
  return { session, consoleGate, isAdmin: isAdminRole(role) };
}

export function studentDashboardLoginGate() {
  return resolveDashboardAccess({
    pathname: "/dashboard",
    userId: "student-1",
    supabaseConfigured: true,
  });
}
