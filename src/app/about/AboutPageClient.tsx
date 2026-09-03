"use client";

import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { msg } from "@/lib/i18n";

export default function AboutPage() {
  const { locale } = useLocale();

  const areas = [
    "about.area.1",
    "about.area.2",
    "about.area.3",
    "about.area.4",
    "about.area.5",
    "about.area.6",
    "about.area.7",
    "about.area.8",
  ] as const;

  const offers = [
    "about.offer.1",
    "about.offer.2",
    "about.offer.3",
    "about.offer.4",
    "about.offer.5",
    "about.offer.6",
  ] as const;

  return (
    <div className="about-surface about-page">
      <section className="about-hero-premium" aria-labelledby="about-hero-title">
        <div className="container about-hero-shell">
          <nav
            className="about-subnav"
            aria-label={msg("about.subnavLabel", locale)}
          >
            <Link href="/about" className="about-subnav-link active">
              {msg("about.tab.institute", locale)}
            </Link>
            <Link href="/about/founder" className="about-subnav-link">
              {msg("about.tab.founder", locale)}
            </Link>
          </nav>
          <div className="about-hero-inner">
            <h1 id="about-hero-title" className="about-hero-title">
              {msg("about.overviewTitle", locale)}
            </h1>
            <div className="about-hero-rule" aria-hidden="true" />
            <p className="about-hero-lead">{msg("about.overviewBody1", locale)}</p>
            <p className="about-hero-lead">{msg("about.overviewBody2", locale)}</p>
          </div>
        </div>
      </section>

      <section
        className="founder-block"
        aria-labelledby="about-mission-heading"
      >
        <div className="container founder-block-inner">
          <div className="about-mv-grid">
            <article className="founder-card about-value-card">
              <h2 id="about-mission-heading" className="about-card-title">
                {msg("about.missionTitle", locale)}
              </h2>
              <p className="founder-prose">{msg("about.missionBody", locale)}</p>
            </article>
            <article className="founder-card about-value-card">
              <h2 className="about-card-title">
                {msg("about.visionTitle", locale)}
              </h2>
              <p className="founder-prose">{msg("about.visionBody", locale)}</p>
            </article>
          </div>
        </div>
      </section>

      <section
        className="founder-block founder-block--soft"
        aria-labelledby="about-areas-heading"
      >
        <div className="container founder-block-inner">
          <header className="founder-block-header about-section-header">
            <h2 id="about-areas-heading" className="founder-block-title">
              {msg("about.areasTitle", locale)}
            </h2>
          </header>
          <ul className="founder-list">
            {areas.map((area) => (
              <li key={area}>{msg(area, locale)}</li>
            ))}
          </ul>
        </div>
      </section>

      <section
        className="founder-block"
        aria-labelledby="about-offer-heading"
      >
        <div className="container founder-block-inner">
          <header className="founder-block-header about-section-header">
            <h2 id="about-offer-heading" className="founder-block-title">
              {msg("about.offerTitle", locale)}
            </h2>
          </header>
          <ul className="founder-list">
            {offers.map((offer) => (
              <li key={offer}>{msg(offer, locale)}</li>
            ))}
          </ul>
        </div>
      </section>

      <section
        className="founder-block founder-block--soft"
        aria-labelledby="about-message-heading"
      >
        <div className="container founder-block-inner">
          <header className="founder-block-header about-section-header">
            <h2 id="about-message-heading" className="founder-block-title">
              {msg("about.messageTitle", locale)}
            </h2>
          </header>
          <div className="founder-card founder-card--stack">
            <p className="founder-prose">{msg("about.messageBody1", locale)}</p>
            <p className="founder-prose">{msg("about.messageBody2", locale)}</p>
          </div>
          <div className="founder-footer-actions">
            <Link href="/about/founder" className="btn btn-primary">
              {msg("about.founderCta", locale)}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
