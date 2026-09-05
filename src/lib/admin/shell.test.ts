import { describe, expect, it } from "vitest";
import {
  isAdminLoginPath,
  isAdminPath,
  isAdminRole,
  isProtectedAdminPath,
  resolveAdminSessionAccess,
} from "@/lib/admin/guards";
import {
  ADMIN_NAV_ITEMS,
  ADMIN_SHELL_BRAND,
  getAdminNavHrefs,
  isAdminNavActive,
  PUBLIC_SITE_NAV_LABELS,
} from "@/lib/admin/nav";
import { ADMIN_LOGIN_PATH } from "@/lib/admin/paths";
import {
  adminConsoleUsesAdminShell,
  adminLoginIsIsolated,
  adminLoginUsesPublicChrome,
  adminLogoutDestination,
  adminNavIsIndependentOfPublicSite,
  getAdminShellBrand,
} from "@/lib/admin/shell";
import { decideAdminConsoleAccess } from "@/lib/admin/auth-policy";

describe("admin login isolation", () => {
  it("keeps /admin/login outside the public header/footer chrome", () => {
    expect(isAdminPath("/admin/login")).toBe(true);
    expect(isAdminLoginPath("/admin/login")).toBe(true);
    expect(adminLoginUsesPublicChrome()).toBe(false);
    expect(adminLoginIsIsolated("/admin/login")).toBe(true);
    expect(isProtectedAdminPath("/admin/login")).toBe(false);
  });
});

describe("admin console shell", () => {
  it("uses the admin shell for dashboard, courses and student-pass", () => {
    expect(adminConsoleUsesAdminShell("/admin")).toBe(true);
    expect(adminConsoleUsesAdminShell("/admin/student-pass")).toBe(true);
    expect(adminConsoleUsesAdminShell("/admin/courses")).toBe(true);
    expect(adminConsoleUsesAdminShell("/admin/students")).toBe(true);
    expect(adminConsoleUsesAdminShell("/admin/import")).toBe(true);
    expect(adminConsoleUsesAdminShell("/admin/certificates")).toBe(true);
    expect(adminConsoleUsesAdminShell("/admin/consultations")).toBe(true);
    expect(adminConsoleUsesAdminShell("/admin/reviews")).toBe(true);
    expect(adminConsoleUsesAdminShell("/admin/login")).toBe(false);
    expect(adminConsoleUsesAdminShell("/admin/verify")).toBe(false);
  });

  it("exposes Admin Console branding without public site navigation", () => {
    expect(getAdminShellBrand()).toEqual(ADMIN_SHELL_BRAND);
    expect(ADMIN_SHELL_BRAND.subtitle).toBe("Admin Console");
    expect(adminNavIsIndependentOfPublicSite()).toBe(true);

    for (const label of PUBLIC_SITE_NAV_LABELS) {
      expect(ADMIN_NAV_ITEMS.some((item) => item.label === label)).toBe(false);
    }
  });

  it("lists the independent admin destinations in order", () => {
    expect(getAdminNavHrefs()).toEqual([
      "/admin",
      "/admin/courses",
      "/admin/student-pass",
      "/admin/students",
      "/admin/certificates",
      "/admin/consultations",
      "/admin/reviews",
    ]);
    expect(ADMIN_NAV_ITEMS.map((item) => item.label)).toEqual([
      "Dashboard",
      "Courses",
      "Student Pass",
      "Students / Import",
      "Certificates",
      "Consultations",
      "Reviews",
    ]);
  });

  it("marks Students / Import active on both students and import routes", () => {
    const studentsImport = ADMIN_NAV_ITEMS.find(
      (item) => item.label === "Students / Import",
    );
    expect(studentsImport).toBeTruthy();
    expect(isAdminNavActive("/admin/students", studentsImport!)).toBe(true);
    expect(isAdminNavActive("/admin/import", studentsImport!)).toBe(true);
    expect(isAdminNavActive("/admin/courses", studentsImport!)).toBe(false);
  });
});

describe("admin shell access and logout", () => {
  it("refuses students and allows admins on the console gate", () => {
    const studentSession = resolveAdminSessionAccess({
      pathname: "/admin",
      userId: "student-1",
      supabaseConfigured: true,
    });
    expect(studentSession.allowed).toBe(true);
    expect(isAdminRole("student")).toBe(false);
    expect(
      decideAdminConsoleAccess({ status: "forbidden" }).outcome,
    ).toBe("deny");

    expect(isAdminRole("admin")).toBe(true);
    expect(decideAdminConsoleAccess({ status: "ok" }).outcome).toBe("allow");
  });

  it("logs out to /admin/login, not the public home", () => {
    expect(adminLogoutDestination()).toBe("/admin/login");
    expect(adminLogoutDestination()).toBe(ADMIN_LOGIN_PATH);
    expect(adminLogoutDestination()).not.toBe("/");
  });
});
