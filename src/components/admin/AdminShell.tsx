"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { OFFICIAL_LOGO_SRC } from "@/components/Logo";
import { adminLogoutAction } from "@/lib/admin/actions";
import {
  ADMIN_NAV_ITEMS,
  ADMIN_SHELL_BRAND,
  isAdminNavActive,
} from "@/lib/admin/nav";

type AdminShellProps = {
  email: string;
  displayName: string;
  children: React.ReactNode;
};

export function AdminShell({ email, displayName, children }: AdminShellProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="admin-app">
      <aside
        id="admin-sidebar"
        className={`admin-sidebar${menuOpen ? " is-open" : ""}`}
      >
        <div className="admin-brand">
          <Image
            src={OFFICIAL_LOGO_SRC}
            alt="Avatar Institut"
            width={64}
            height={64}
            className="admin-brand-logo"
            style={{ height: "auto" }}
            priority
          />
          <div>
            <p className="admin-brand-title">{ADMIN_SHELL_BRAND.title}</p>
            <p className="admin-brand-subtitle">{ADMIN_SHELL_BRAND.subtitle}</p>
          </div>
        </div>

        <nav className="admin-nav" aria-label="Admin Console">
          {ADMIN_NAV_ITEMS.map((item) => {
            const active = isAdminNavActive(pathname, item);
            if (item.disabled) {
              return (
                <span
                  key={item.href}
                  className="admin-nav-link is-disabled"
                  aria-disabled="true"
                >
                  {item.label}
                </span>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-nav-link${active ? " is-active" : ""}`}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-account">
            <p className="admin-account-label">Signed in</p>
            <p className="admin-account-name">{displayName || "Administrator"}</p>
            <p className="admin-account-email">{email}</p>
          </div>
          <form action={adminLogoutAction}>
            <button type="submit" className="admin-signout">
              Logout
            </button>
          </form>
        </div>
      </aside>

      {menuOpen ? (
        <button
          type="button"
          className="admin-backdrop"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <div className="admin-main">
        <header className="admin-topbar">
          <button
            type="button"
            className="admin-menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="admin-sidebar"
            onClick={() => setMenuOpen((open) => !open)}
          >
            Menu
          </button>
          <p className="admin-topbar-title">{ADMIN_SHELL_BRAND.subtitle}</p>
        </header>
        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
}
