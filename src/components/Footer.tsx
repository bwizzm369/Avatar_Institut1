"use client";

import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { msg } from "@/lib/i18n";

export function Footer() {
  const { locale } = useLocale();

  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <div className="brand-ar footer-brand" lang="ar" dir="rtl">
            {msg("brand.arabicName", locale)}
          </div>
          <p className="muted">{msg("footer.aboutBody", locale)}</p>
        </div>
        <div>
          <h2 className="footer-heading">{msg("footer.quickLinks", locale)}</h2>
          <ul className="footer-links">
            <li>
              <Link href="/">{msg("nav.home", locale)}</Link>
            </li>
            <li>
              <Link href="/about">{msg("nav.about", locale)}</Link>
            </li>
            <li>
              <Link href="/about/founder">{msg("nav.founder", locale)}</Link>
            </li>
            <li>
              <Link href="/courses">{msg("nav.courses", locale)}</Link>
            </li>
            <li>
              <Link href="/library">{msg("nav.library", locale)}</Link>
            </li>
            <li>
              <Link href="/cart">{msg("nav.cart", locale)}</Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="footer-heading">{msg("footer.platform", locale)}</h2>
          <ul className="footer-links">
            <li>
              <Link href="/login">{msg("nav.login", locale)}</Link>
            </li>
            <li>
              <Link href="/signup">{msg("nav.signup", locale)}</Link>
            </li>
            <li>
              <Link href="/dashboard">{msg("nav.dashboard", locale)}</Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p className="muted small">{msg("footer.rights", locale)}</p>
        <p className="serif accent">{msg("footer.tagline", locale)}</p>
      </div>
    </footer>
  );
}
