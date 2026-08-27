"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { msg } from "@/lib/i18n";

export function DashboardNav() {
  const pathname = usePathname();
  const { locale } = useLocale();

  const links = [
    { href: "/dashboard", label: msg("dashboard.nav.overview", locale), exact: true },
    {
      href: "/dashboard/courses",
      label: msg("dashboard.nav.courses", locale),
      exact: false,
    },
    {
      href: "/dashboard/student-pass",
      label: msg("dashboard.nav.studentPass", locale),
      exact: false,
    },
    {
      href: "/dashboard/certificates",
      label: msg("dashboard.nav.certificates", locale),
      exact: false,
    },
  ];

  return (
    <nav className="dashboard-nav" aria-label="Dashboard">
      {links.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={active ? "dashboard-link active" : "dashboard-link"}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
