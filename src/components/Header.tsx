"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Logo } from "@/components/Logo";
import { useCart } from "@/components/CartProvider";
import { useLocale } from "@/components/LocaleProvider";
import { msg } from "@/lib/i18n";

export function Header() {
  const pathname = usePathname();
  const { locale } = useLocale();
  const { itemCount, ready: cartReady } = useCart();
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/", label: msg("nav.home", locale) },
    { href: "/courses", label: msg("nav.courses", locale) },
    { href: "/cart", label: msg("nav.cart", locale) },
    { href: "/dashboard", label: msg("nav.dashboard", locale) },
  ];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const showCartBadge = cartReady && itemCount > 0;

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="brand-link" onClick={() => setOpen(false)}>
          <Logo />
          <span className="brand-text">
            <span className="brand-ar" lang="ar" dir="rtl">
              {msg("brand.arabicName", locale)}
            </span>
            <span className="brand-en">AVATAR INSTITUT</span>
          </span>
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
          <Link href="/login" className="btn btn-ghost header-auth">
            {msg("nav.login", locale)}
          </Link>
          <Link href="/signup" className="btn btn-primary header-cta">
            {msg("nav.getStarted", locale)}
          </Link>
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
          <Link href="/login" className="nav-link" onClick={() => setOpen(false)}>
            {msg("nav.login", locale)}
          </Link>
          <Link href="/signup" className="nav-link" onClick={() => setOpen(false)}>
            {msg("nav.signup", locale)}
          </Link>
        </nav>
      ) : null}
    </header>
  );
}
