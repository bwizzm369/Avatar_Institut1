"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Fragment, useState } from "react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/components/AuthProvider";
import { useCart } from "@/components/CartProvider";
import { useLocale } from "@/components/LocaleProvider";
import { isClientSignedIn } from "@/lib/auth/session-ui";
import { msg } from "@/lib/i18n";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { locale } = useLocale();
  const { itemCount, ready: cartReady } = useCart();
  const { user, configured, ready: authReady, refresh } = useAuth();
  const [open, setOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const aboutItems = [
    { href: "/about", label: msg("about.tab.institute", locale) },
    { href: "/about/founder", label: msg("about.tab.founder", locale) },
  ] as const;

  const links = [
    { href: "/", label: msg("nav.home", locale) },
    { href: "/about", label: msg("nav.about", locale) },
    { href: "/courses", label: msg("nav.courses", locale) },
    { href: "/library", label: msg("nav.library", locale) },
    { href: "/consultation", label: msg("nav.consultation", locale) },
    { href: "/reviews", label: msg("nav.reviews", locale) },
    { href: "/cart", label: msg("nav.cart", locale) },
    { href: "/dashboard", label: msg("nav.dashboard", locale) },
  ];

  const isAboutSection =
    pathname === "/about" || pathname.startsWith("/about/");

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/about") return pathname === "/about";
    if (pathname === href) return true;
    if (!pathname.startsWith(`${href}/`)) return false;
    const hasMoreSpecificMatch = links.some(
      (link) =>
        link.href !== href &&
        link.href.startsWith(`${href}/`) &&
        (pathname === link.href || pathname.startsWith(`${link.href}/`)),
    );
    return !hasMoreSpecificMatch;
  };

  function renderAboutDropdown(closeMobile?: () => void) {
    return (
      <div
        className={aboutOpen ? "nav-dropdown is-open" : "nav-dropdown"}
        onMouseEnter={() => setAboutOpen(true)}
        onMouseLeave={() => setAboutOpen(false)}
      >
        <Link
          href="/about"
          className={isAboutSection ? "nav-link active" : "nav-link"}
          aria-expanded={aboutOpen}
          aria-haspopup="true"
          onClick={() => {
            setAboutOpen(false);
            closeMobile?.();
          }}
        >
          {msg("nav.about", locale)}
        </Link>
        <div className="nav-dropdown-panel" role="list">
          {aboutItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              role="listitem"
              className={
                isActive(item.href)
                  ? "nav-link nav-dropdown-link active"
                  : "nav-link nav-dropdown-link"
              }
              onClick={() => {
                setAboutOpen(false);
                closeMobile?.();
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    );
  }

  const showCartBadge = cartReady && itemCount > 0;
  const showSignedIn = isClientSignedIn({
    configured,
    ready: authReady,
    user,
  });

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
          {links.map((link) =>
            link.href === "/about" ? (
              <Fragment key={link.href}>{renderAboutDropdown()}</Fragment>
            ) : (
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
            ),
          )}
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
          {links.map((link) =>
            link.href === "/about" ? (
              <div key={link.href} className="nav-mobile-about">
                {aboutItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={
                      isActive(item.href) ? "nav-link active" : "nav-link"
                    }
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className={isActive(link.href) ? "nav-link active" : "nav-link"}
                onClick={() => setOpen(false)}
              >
                {link.label}
                {link.href === "/cart" && showCartBadge ? ` (${itemCount})` : ""}
              </Link>
            ),
          )}
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
