"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/components/AuthProvider";
import { useCart } from "@/components/CartProvider";
import { useLocale } from "@/components/LocaleProvider";
import { msg } from "@/lib/i18n";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { locale } = useLocale();
  const { itemCount, ready: cartReady } = useCart();
  const { user, configured, ready: authReady, refresh } = useAuth();
  const [open, setOpen] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const links = [
    { href: "/", label: msg("nav.home", locale) },
    { href: "/courses", label: msg("nav.courses", locale) },
    { href: "/library", label: msg("nav.library", locale) },
    { href: "/cart", label: msg("nav.cart", locale) },
    { href: "/dashboard", label: msg("nav.dashboard", locale) },
  ];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const showCartBadge = cartReady && itemCount > 0;
  const showSignedIn = configured && authReady && user;

  async function handleLogout() {
    if (logoutPending) return;

    setLogoutError(null);

    if (!configured) {
      router.replace("/login");
      router.refresh();
      return;
    }

    setLogoutPending(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        setLogoutError(msg("auth.logoutFailed", locale));
        return;
      }

      await refresh();
      router.replace("/login");
      router.refresh();
    } catch {
      setLogoutError(msg("auth.logoutFailed", locale));
    } finally {
      setLogoutPending(false);
    }
  }

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="brand-link" onClick={() => setOpen(false)}>
          <Logo />
        </Link>

        <nav className="nav-desktop" aria-label="Primary">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={isActive(link.href) ? "nav-link active" : "nav-link"}
            >
              {link.label}
              {link.href === "/cart" && showCartBadge ? (
                <span className="cart-count" aria-label={`${itemCount}`}>
                  {itemCount}
                </span>
              ) : null}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          <LanguageSwitcher />
          {logoutError ? (
            <p className="header-logout-error" role="alert">
              {logoutError}
            </p>
          ) : null}
          {showSignedIn ? (
            <button
              type="button"
              className="btn btn-ghost header-auth"
              onClick={() => void handleLogout()}
              disabled={logoutPending}
            >
              {logoutPending
                ? msg("auth.submitting", locale)
                : msg("nav.logout", locale)}
            </button>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost header-auth">
                {msg("nav.login", locale)}
              </Link>
              <Link href="/signup" className="btn btn-primary header-cta">
                {msg("nav.getStarted", locale)}
              </Link>
            </>
          )}
          <button
            type="button"
            className="menu-toggle"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? msg("nav.close", locale) : msg("nav.menu", locale)}
          </button>
        </div>
      </div>

      {open ? (
        <nav id="mobile-nav" className="nav-mobile" aria-label="Mobile">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={isActive(link.href) ? "nav-link active" : "nav-link"}
              onClick={() => setOpen(false)}
            >
              {link.label}
              {link.href === "/cart" && showCartBadge ? ` (${itemCount})` : ""}
            </Link>
          ))}
          {showSignedIn ? (
            <button
              type="button"
              className="nav-link"
              onClick={() => {
                setOpen(false);
                void handleLogout();
              }}
              disabled={logoutPending}
            >
              {logoutPending
                ? msg("auth.submitting", locale)
                : msg("nav.logout", locale)}
            </button>
          ) : (
            <>
              <Link
                href="/login"
                className="nav-link"
                onClick={() => setOpen(false)}
              >
                {msg("nav.login", locale)}
              </Link>
              <Link
                href="/signup"
                className="nav-link"
                onClick={() => setOpen(false)}
              >
                {msg("nav.signup", locale)}
              </Link>
            </>
          )}
        </nav>
      ) : null}
    </header>
  );
}
