import { describe, expect, it } from "vitest";
import {
  adminMayAccessStudentDashboard,
  authenticatedRoleOnAdminConsole,
  decideAdminConsoleAccess,
  decideAdminLogin,
  resolveSafeAdminRedirect,
  resolveStudentLoginDestination,
  studentDashboardLoginGate,
  studentUnauthenticatedAdminGate,
} from "@/lib/admin/auth-policy";
import { resolveAdminSessionAccess } from "@/lib/admin/guards";
import { resolveDashboardAccess } from "@/lib/auth/guards";

describe("student vs admin auth separation", () => {
  it("sends unauthenticated users from /admin to /admin/login", () => {
    const result = studentUnauthenticatedAdminGate("/admin");
    expect(result.allowed).toBe(false);
    expect(result.redirectTo).toBe(
      `/admin/login?next=${encodeURIComponent("/admin")}`,
    );
  });

  it("forbids a connected student on /admin (server role gate)", () => {
    const { session, consoleGate, isAdmin } =
      authenticatedRoleOnAdminConsole("student");
    expect(session.allowed).toBe(true);
    expect(isAdmin).toBe(false);
    expect(consoleGate.outcome).toBe("deny");
  });

  it("allows a connected admin on /admin", () => {
    const { session, consoleGate, isAdmin } =
      authenticatedRoleOnAdminConsole("admin");
    expect(session.allowed).toBe(true);
    expect(isAdmin).toBe(true);
    expect(consoleGate.outcome).toBe("allow");
  });

  it("redirects a valid admin login to /admin", () => {
    const decision = decideAdminLogin({
      authenticated: true,
      role: "admin",
      nextPath: "/admin/students",
    });
    expect(decision).toEqual({
      outcome: "allow",
      redirectTo: "/admin/students",
    });
  });

  it("refuses a student login attempt on /admin/login and requires sign-out", () => {
    const decision = decideAdminLogin({
      authenticated: true,
      role: "student",
      nextPath: "/admin",
    });
    expect(decision).toEqual({
      outcome: "deny",
      error: "Access denied. This account is not an administrator.",
      shouldSignOut: true,
    });
  });

  it("keeps normal student login on /dashboard", () => {
    expect(resolveStudentLoginDestination(null)).toBe("/dashboard");
    expect(resolveStudentLoginDestination("/dashboard/courses")).toBe(
      "/dashboard/courses",
    );
    // Never leak students into the admin console via ?next=
    expect(resolveStudentLoginDestination("/admin")).toBe("/dashboard");
    expect(resolveStudentLoginDestination("/admin/students")).toBe(
      "/dashboard",
    );

    const dashboard = studentDashboardLoginGate();
    expect(dashboard.allowed).toBe(true);
  });
});

describe("admin auth policy details", () => {
  it("clamps unsafe admin redirects to /admin", () => {
    expect(resolveSafeAdminRedirect("/dashboard")).toBe("/admin");
    expect(resolveSafeAdminRedirect("https://evil.example")).toBe("/admin");
    expect(resolveSafeAdminRedirect("/admin/login")).toBe("/admin/login");
  });

  it("maps console statuses to redirect or deny", () => {
    expect(
      decideAdminConsoleAccess({ status: "unauthenticated" }).outcome,
    ).toBe("redirect_login");
    expect(decideAdminConsoleAccess({ status: "forbidden" }).outcome).toBe(
      "deny",
    );
    expect(decideAdminConsoleAccess({ status: "ok" }).outcome).toBe("allow");
  });

  it("allows admins to open /dashboard without forcing /admin", () => {
    expect(adminMayAccessStudentDashboard()).toBe(true);
    const dashboard = resolveDashboardAccess({
      pathname: "/dashboard",
      userId: "admin-user",
      supabaseConfigured: true,
    });
    expect(dashboard.allowed).toBe(true);
    // No auto-redirect to /admin — shared session, student preview allowed.
    expect(dashboard.redirectTo).toBeNull();
  });

  it("keeps /admin/login open without a session", () => {
    const result = resolveAdminSessionAccess({
      pathname: "/admin/login",
      userId: null,
      supabaseConfigured: true,
    });
    expect(result.allowed).toBe(true);
  });
});
