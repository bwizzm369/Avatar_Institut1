import { describe, expect, it } from "vitest";
import {
  isDashboardPath,
  resolveDashboardAccess,
  safeAuthRedirect,
} from "@/lib/auth/guards";

describe("dashboard route protection", () => {
  it("detects dashboard paths", () => {
    expect(isDashboardPath("/dashboard")).toBe(true);
    expect(isDashboardPath("/dashboard/courses")).toBe(true);
    expect(isDashboardPath("/courses")).toBe(false);
  });

  it("redirects unauthenticated users to login with next", () => {
    const result = resolveDashboardAccess({
      pathname: "/dashboard/courses",
      userId: null,
      supabaseConfigured: true,
    });
    expect(result.allowed).toBe(false);
    expect(result.redirectTo).toBe(
      `/login?next=${encodeURIComponent("/dashboard/courses")}`,
    );
  });

  it("redirects when Supabase is not configured", () => {
    const result = resolveDashboardAccess({
      pathname: "/dashboard",
      userId: "user-1",
      supabaseConfigured: false,
    });
    expect(result.allowed).toBe(false);
    expect(result.redirectTo).toContain("/login?next=");
  });

  it("allows authenticated users when configured", () => {
    const result = resolveDashboardAccess({
      pathname: "/dashboard",
      userId: "user-1",
      supabaseConfigured: true,
    });
    expect(result.allowed).toBe(true);
    expect(result.redirectTo).toBeNull();
  });

  it("sanitizes post-login redirects", () => {
    expect(safeAuthRedirect("/dashboard/courses")).toBe("/dashboard/courses");
    expect(safeAuthRedirect("/cart")).toBe("/cart");
    expect(safeAuthRedirect("https://evil.example")).toBe("/dashboard");
    expect(safeAuthRedirect("//evil.example")).toBe("/dashboard");
    expect(safeAuthRedirect(null)).toBe("/dashboard");
  });
});
