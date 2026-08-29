import { describe, expect, it } from "vitest";
import {
  isAdminLoginPath,
  isAdminPath,
  isAdminRole,
  isProtectedAdminPath,
  resolveAdminSessionAccess,
} from "@/lib/admin/guards";
import { ADMIN_NAV_ITEMS, isAdminNavActive } from "@/lib/admin/nav";

describe("admin route session protection", () => {
  it("detects admin paths", () => {
    expect(isAdminPath("/admin")).toBe(true);
    expect(isAdminPath("/admin/students")).toBe(true);
    expect(isAdminPath("/dashboard")).toBe(false);
    expect(isAdminPath("/verify/AVT-2026-000001")).toBe(false);
    expect(isAdminLoginPath("/admin/login")).toBe(true);
    expect(isProtectedAdminPath("/admin")).toBe(true);
    expect(isProtectedAdminPath("/admin/login")).toBe(false);
  });

  it("redirects unauthenticated users away from admin console", () => {
    const result = resolveAdminSessionAccess({
      pathname: "/admin/students",
      userId: null,
      supabaseConfigured: true,
    });
    expect(result.allowed).toBe(false);
    expect(result.redirectTo).toBe(
      `/admin/login?next=${encodeURIComponent("/admin/students")}`,
    );
  });

  it("redirects when Supabase is not configured", () => {
    const result = resolveAdminSessionAccess({
      pathname: "/admin",
      userId: "user-1",
      supabaseConfigured: false,
    });
    expect(result.allowed).toBe(false);
    expect(result.redirectTo).toContain("/admin/login?next=");
  });

  it("allows authenticated sessions past the middleware gate", () => {
    const result = resolveAdminSessionAccess({
      pathname: "/admin/courses",
      userId: "user-1",
      supabaseConfigured: true,
    });
    expect(result.allowed).toBe(true);
    expect(result.redirectTo).toBeNull();
  });

  it("leaves the admin login page open without a session", () => {
    const result = resolveAdminSessionAccess({
      pathname: "/admin/login",
      userId: null,
      supabaseConfigured: true,
    });
    expect(result.allowed).toBe(true);
  });

  it("does not treat public certificate verification as an admin path", () => {
    const result = resolveAdminSessionAccess({
      pathname: "/verify/AVT-2026-000001",
      userId: null,
      supabaseConfigured: true,
    });
    expect(result.allowed).toBe(true);
    expect(result.redirectTo).toBeNull();
  });
});

describe("admin role checks", () => {
  it("accepts only the admin role", () => {
    expect(isAdminRole("admin")).toBe(true);
    expect(isAdminRole("student")).toBe(false);
    expect(isAdminRole(null)).toBe(false);
    expect(isAdminRole(undefined)).toBe(false);
    expect(isAdminRole("ADMIN")).toBe(false);
  });
});

describe("admin navigation", () => {
  it("exposes the independent console destinations", () => {
    const hrefs = ADMIN_NAV_ITEMS.map((item) => item.href);
    expect(hrefs).toEqual([
      "/admin",
      "/admin/courses",
      "/admin/student-pass",
      "/admin/students",
      "/admin/certificates",
      "/admin/consultations",
      "/admin/reviews",
    ]);
  });

  it("marks the active nav item correctly", () => {
    const dashboard = ADMIN_NAV_ITEMS[0];
    const courses = ADMIN_NAV_ITEMS[1];
    expect(isAdminNavActive("/admin", dashboard)).toBe(true);
    expect(isAdminNavActive("/admin/courses", dashboard)).toBe(false);
    expect(isAdminNavActive("/admin/courses", courses)).toBe(true);
    expect(isAdminNavActive("/admin/courses/new", courses)).toBe(true);
  });
});

describe("admin access denial semantics", () => {
  it("documents that students must be refused by server role check", () => {
    // Middleware only checks session; role === student must fail isAdminRole.
    expect(isAdminRole("student")).toBe(false);
    const sessionOk = resolveAdminSessionAccess({
      pathname: "/admin",
      userId: "student-user",
      supabaseConfigured: true,
    });
    expect(sessionOk.allowed).toBe(true);
    // Server layout uses isAdminRole — student is not admin.
    expect(isAdminRole("student")).toBe(false);
  });

  it("documents that admins pass both session and role gates", () => {
    const sessionOk = resolveAdminSessionAccess({
      pathname: "/admin",
      userId: "admin-user",
      supabaseConfigured: true,
    });
    expect(sessionOk.allowed).toBe(true);
    expect(isAdminRole("admin")).toBe(true);
  });
});
