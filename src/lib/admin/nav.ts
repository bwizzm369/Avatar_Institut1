export type AdminNavItem = {
  href: string;
  label: string;
  exact?: boolean;
  /** Extra path prefixes that keep this item active (e.g. Students / Import). */
  matchPrefixes?: string[];
  disabled?: boolean;
};

/**
 * Independent back-office navigation (no public site links).
 * Logout is a shell action, not a nav destination.
 */
export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/courses", label: "Courses" },
  { href: "/admin/student-pass", label: "Student Pass" },
  {
    href: "/admin/students",
    label: "Students / Import",
    matchPrefixes: ["/admin/students", "/admin/import"],
  },
  { href: "/admin/certificates", label: "Certificates" },
  { href: "/admin/consultations", label: "Consultations" },
  { href: "/admin/reviews", label: "Reviews" },
];

export const ADMIN_SHELL_BRAND = {
  title: "Avatar Institut",
  subtitle: "Admin Console",
} as const;

/** Public-only chrome labels that must never appear in the admin shell. */
export const PUBLIC_SITE_NAV_LABELS = [
  "Home",
  "About",
  "Library",
  "Consultation",
  "Testimonials",
  "Cart",
] as const;

export function isAdminNavActive(
  pathname: string,
  item: AdminNavItem,
): boolean {
  if (item.disabled) return false;

  if (item.matchPrefixes?.length) {
    return item.matchPrefixes.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );
  }

  if (item.exact) {
    return pathname === item.href;
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function getAdminNavHrefs(): string[] {
  return ADMIN_NAV_ITEMS.filter((item) => !item.disabled).map(
    (item) => item.href,
  );
}
