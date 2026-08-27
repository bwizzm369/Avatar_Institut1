"use client";

import Link from "next/link";
import { FounderPortrait } from "@/components/FounderPortrait";
import { useLocale } from "@/components/LocaleProvider";
import {
  founderBiography,
  getFounderWorksByCategory,
  type FounderWork,
} from "@/lib/founder/biography";
import { msg } from "@/lib/i18n";

function WorkListItem({
  work,
  locale,
}: {
  work: FounderWork;
  locale: "en" | "ar";
}) {
  const title = locale === "ar" ? work.titleAr : work.titleEn;
  const lang = locale === "ar" ? "ar" : "en";
  const dir = locale === "ar" ? "rtl" : undefined;

  if (work.link) {
    return (
      <li>
        <a
          href={work.link}
          target="_blank"
          rel="noopener noreferrer"
          lang={lang}
          dir={dir}
        >
          {title}
        </a>
      </li>
    );
  }

  return (
    <li>
      <span lang={lang} dir={dir}>
        {title}
      </span>
    </li>
  );
}

export default function FounderPageClient() {
  const { locale } = useLocale();
  const name =
    locale === "ar" ? founderBiography.name_ar : founderBiography.name_en;
  const role =
    locale === "ar" ? founderBiography.role_ar : founderBiography.role_en;
  const heroLead =
    locale === "ar"
      ? founderBiography.hero_lead_ar
      : founderBiography.hero_lead_en;
  const presentation =
    locale === "ar"
      ? founderBiography.presentation_ar
      : founderBiography.presentation_en;
  const translations =
    locale === "ar"
      ? founderBiography.translations_ar
      : founderBiography.translations_en;
  const intellectual = getFounderWorksByCategory("intellectual_sufi");
  const poetry = getFounderWorksByCategory("poetry");

  const toc = [
    { href: "#founder-biography", label: "founder.section.biography" },
    { href: "#founder-intellectual", label: "founder.section.intellectual" },
    { href: "#founder-poetry", label: "founder.section.poetry" },
    { href: "#founder-translations", label: "founder.section.translations" },
  ] as const;

  return (
    <div className="about-surface founder-page">
      <section className="founder-hero-premium" aria-labelledby="founder-name">
        <div className="container founder-hero-grid">
          <FounderPortrait size="hero" className="founder-portrait--light" />
          <div className="founder-hero-copy">
            <nav
              className="about-subnav"
              aria-label={msg("about.subnavLabel", locale)}
            >
              <Link href="/about" className="about-subnav-link">
                {msg("about.tab.institute", locale)}
              </Link>
              <Link href="/about/founder" className="about-subnav-link active">
                {msg("about.tab.founder", locale)}
              </Link>
            </nav>
            <p className="founder-kicker">{msg("founder.eyebrow", locale)}</p>
            <h1 id="founder-name" className="founder-hero-name">
              {name}
            </h1>
            <p className="founder-hero-role">{role}</p>
            <div className="about-hero-rule" aria-hidden="true" />
            <p className="founder-hero-lead">{heroLead}</p>
            <div className="founder-hero-actions">
              <a href="#founder-biography" className="btn btn-primary">
                {msg("founder.cta.biography", locale)}
              </a>
              <a
                href="#founder-intellectual"
                className="btn btn-ghost founder-btn-secondary"
              >
                {msg("founder.cta.works", locale)}
              </a>
            </div>
          </div>
        </div>
      </section>

      <nav className="founder-toc" aria-label={msg("founder.tocLabel", locale)}>
        <div className="container founder-toc-inner">
          <span className="founder-toc-label">
            {msg("founder.tocLabel", locale)}
          </span>
          <ul className="founder-toc-list">
            {toc.map((item) => (
              <li key={item.href}>
                <a href={item.href}>{msg(item.label, locale)}</a>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <section
        id="founder-biography"
        className="founder-block"
        aria-labelledby="founder-biography-heading"
      >
        <div className="container founder-block-inner">
          <header className="founder-block-header">
            <h2
              id="founder-biography-heading"
              className="founder-block-title"
            >
              {msg("founder.section.biography", locale)}
            </h2>
          </header>
          <div className="founder-card founder-card--stack">
            {presentation.map((paragraph) => (
              <p key={paragraph.slice(0, 48)} className="founder-prose">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section
        id="founder-intellectual"
        className="founder-block founder-block--soft"
        aria-labelledby="founder-intellectual-heading"
      >
        <div className="container founder-block-inner">
          <header className="founder-block-header">
            <h2
              id="founder-intellectual-heading"
              className="founder-block-title"
            >
              {msg("founder.section.intellectual", locale)}
            </h2>
          </header>
          <ul className="founder-works">
            {intellectual.map((work) => (
              <WorkListItem key={work.titleEn} work={work} locale={locale} />
            ))}
          </ul>
        </div>
      </section>

      <section
        id="founder-poetry"
        className="founder-block"
        aria-labelledby="founder-poetry-heading"
      >
        <div className="container founder-block-inner">
          <header className="founder-block-header">
            <h2 id="founder-poetry-heading" className="founder-block-title">
              {msg("founder.section.poetry", locale)}
            </h2>
          </header>
          <ul className="founder-works">
            {poetry.map((work) => (
              <WorkListItem key={work.titleEn} work={work} locale={locale} />
            ))}
          </ul>
        </div>
      </section>

      <section
        id="founder-translations"
        className="founder-block founder-block--soft"
        aria-labelledby="founder-translations-heading"
      >
        <div className="container founder-block-inner">
          <header className="founder-block-header">
            <h2
              id="founder-translations-heading"
              className="founder-block-title"
            >
              {msg("founder.section.translations", locale)}
            </h2>
          </header>
          <div className="founder-card founder-card--stack">
            {translations.map((paragraph) => (
              <p key={paragraph.slice(0, 48)} className="founder-prose">
                {paragraph}
              </p>
            ))}
          </div>
          <div className="founder-footer-actions">
            <Link href="/library" className="btn btn-primary">
              {msg("founder.cta.library", locale)}
            </Link>
            <Link href="/about" className="btn btn-ghost founder-btn-secondary">
              {msg("founder.backToAbout", locale)}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
