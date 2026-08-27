import { isAdminLoginPath, isProtectedAdminPath } from "@/lib/admin/guards";
import {
  ADMIN_NAV_ITEMS,
  ADMIN_SHELL_BRAND,
  PUBLIC_SITE_NAV_LABELS,
} from "@/lib/admin/nav";
import { ADMIN_LOGIN_PATH } from "@/lib/admin/paths";

/**
 * Pure shell contracts for the independent admin back-office.
 * Public Header/Footer are suppressed for all /admin/* via root layout + isAdminPath.
 */

export function adminLoginUsesPublicChrome(): boolean {
  return false;
}

export function adminConsoleUsesAdminShell(pathname: string): boolean {
  return isProtectedAdminPath(pathname);
}

export function adminLoginIsIsolated(pathname: string): boolean {
  return isAdminLoginPath(pathname) && !adminLoginUsesPublicChrome();
}

export function adminNavIsIndependentOfPublicSite(): boolean {
  const labels = ADMIN_NAV_ITEMS.map((item) => item.label);
  const hrefs = ADMIN_NAV_ITEMS.map((item) => item.href);

  const hasPublicLabel = PUBLIC_SITE_NAV_LABELS.some((label) =>
    labels.includes(label),
  );
  const hasPublicHref = hrefs.some(
    (href) =>
      href === "/" ||
      href.startsWith("/about") ||
      href.startsWith("/library") ||
      href.startsWith("/cart") ||
      href.startsWith("/dashboard") ||
      href === "/login" ||
      href === "/courses",
  );

  return !hasPublicLabel && !hasPublicHref;
}

export function adminLogoutDestination(): string {
  return ADMIN_LOGIN_PATH;
}

export function getAdminShellBrand() {
  return ADMIN_SHELL_BRAND;
}
