"use client";

import Link from "next/link";
import { FounderPortrait } from "@/components/FounderPortrait";
import { useLocale } from "@/components/LocaleProvider";
import { founderBiography } from "@/lib/founder/biography";
import { msg } from "@/lib/i18n";

export default function AboutPage() {
  const { locale } = useLocale();
  const name =
    locale === "ar" ? founderBiography.name_ar : founderBiography.name_en;
  const role =
    locale === "ar" ? founderBiography.role_ar : founderBiography.role_en;
  const heroLead =
    locale === "ar"
      ? founderBiography.hero_lead_ar
      : founderBiography.hero_lead_en;

  const values = [
    {
      title: "about.value.clarity",
      body: "about.value.clarityBody",
    },
    {
      title: "about.value.dialogue",
      body: "about.value.dialogueBody",
    },
    {
      title: "about.value.integrity",
      body: "about.value.integrityBody",
    },
    {
      title: "about.value.bridge",
      body: "about.value.bridgeBody",
    },
  ] as const;

  return (
    <div className="about-surface about-page">
      <section className="about-hero-premium" aria-labelledby="about-hero-title">
        <div className="container about-hero-shell">
          <nav className="about-subnav" aria-label={msg("about.subnavLabel", locale)}>
            <Link href="/about" className="about-subnav-link active">
              {msg("about.tab.institute", locale)}
            </Link>
            <Link href="/about/founder" className="about-subnav-link">
              {msg("about.tab.founder", locale)}
            </Link>
          </nav>
          <div className="about-hero-inner">
            <p className="founder-kicker">{msg("about.eyebrow", locale)}</p>
            <p className="about-location">{msg("about.location", locale)}</p>
            <h1 id="about-hero-title" className="about-hero-title">
              {msg("about.title", locale)}
            </h1>
            <div className="about-hero-rule" aria-hidden="true" />
            <p className="about-hero-lead">{msg("about.intro", locale)}</p>
          </div>
        </div>
      </section>

      <section className="founder-block" aria-labelledby="about-pillars-heading">
        <div className="container founder-block-inner">
          <header className="founder-block-header about-section-header">
            <p className="founder-kicker">{msg("about.pillarsEyebrow", locale)}</p>
            <h2 id="about-pillars-heading" className="founder-block-title">
              {msg("about.pillarsTitle", locale)}
            </h2>
          </header>

          <div className="about-mv-grid">
            <article className="founder-card about-value-card">
              <p className="about-card-label">{msg("about.missionEyebrow", locale)}</p>
              <h3 className="about-card-title">{msg("about.missionTitle", locale)}</h3>
              <p className="founder-prose">{msg("about.missionBody", locale)}</p>
            </article>
            <article className="founder-card about-value-card">
              <p className="about-card-label">{msg("about.visionEyebrow", locale)}</p>
              <h3 className="about-card-title">{msg("about.visionTitle", locale)}</h3>
              <p className="founder-prose">{msg("about.visionBody", locale)}</p>
            </article>
          </div>

          <div className="about-values-panel">
            <header className="about-values-header">
              <p className="about-card-label">{msg("about.valuesEyebrow", locale)}</p>
              <h3 className="about-card-title">{msg("about.valuesTitle", locale)}</h3>
            </header>
            <div className="about-values-grid">
              {values.map((value) => (
                <article key={value.title} className="about-value-tile">
                  <h4 className="about-value-tile-title">{msg(value.title, locale)}</h4>
                  <p className="about-value-tile-body">{msg(value.body, locale)}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        className="founder-block founder-block--soft"
        aria-labelledby="about-founder-heading"
      >
        <div className="container">
          <div className="about-founder-teaser">
            <FounderPortrait size="teaser" className="founder-portrait--light" />
            <div className="about-founder-teaser-copy">
              <p className="founder-kicker">{msg("about.founderEyebrow", locale)}</p>
              <h2 id="about-founder-heading" className="founder-block-title">
                {msg("about.founderTitle", locale)}
              </h2>
              <p className="founder-name">{name}</p>
              <p className="founder-hero-role">{role}</p>
              <p className="founder-hero-lead">{heroLead}</p>
              <div className="founder-hero-actions">
                <Link href="/about/founder" className="btn btn-primary">
                  {msg("about.founderCta", locale)}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
