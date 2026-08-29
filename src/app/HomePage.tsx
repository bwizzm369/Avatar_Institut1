"use client";

import Image from "next/image";
import Link from "next/link";
import { ConnectSection } from "@/components/connect/ConnectSection";
import { Logo } from "@/components/Logo";
import { ReviewsGallery } from "@/components/ReviewsGallery";
import { useLocale } from "@/components/LocaleProvider";
import { msg } from "@/lib/i18n";
import type { PublicReview } from "@/lib/reviews/types";

const HERO_IMAGE_SRC = "/hero/avatar-online-institute-hero-v2.png";

export default function HomePage({
  reviews = [],
}: {
  reviews?: PublicReview[];
}) {
  const { locale } = useLocale();

  const values = [
    { title: "home.value.wisdom", body: "home.value.wisdomBody" },
    { title: "home.value.research", body: "home.value.researchBody" },
    { title: "home.value.integrity", body: "home.value.integrityBody" },
    { title: "home.value.transformation", body: "home.value.transformationBody" },
  ] as const;

  return (
    <>
      <section className="hero" aria-labelledby="home-hero-title">
        <div className="hero-visual" aria-hidden="true">
          <Image
            src={HERO_IMAGE_SRC}
            alt=""
            fill
            priority
            sizes="100vw"
            className="hero-image"
          />
          <div className="hero-overlay" />
        </div>
        <div className="container hero-grid">
          <div
            className="hero-copy"
            dir={locale === "ar" ? "rtl" : "ltr"}
          >
            <p className="hero-badge">{msg("home.eyebrow", locale)}</p>
            <h1 id="home-hero-title" className="hero-title">
              {msg("home.title", locale)}
            </h1>
            <p className="hero-lead">{msg("home.subtitle", locale)}</p>
            <div className="hero-actions">
              <Link href="/courses" className="btn btn-primary">
                {msg("home.ctaCourses", locale)}
              </Link>
              <Link href="/library" className="btn btn-ghost">
                {msg("home.ctaLibrary", locale)}
              </Link>
            </div>
          </div>
          <div className="hero-spacer" aria-hidden="true" />
        </div>
      </section>

      <section id="about" className="section home-about">
        <div className="container split home-about-grid">
          <div className="stack-lg">
            <p className="eyebrow">{msg("home.aboutEyebrow", locale)}</p>
            <h2 className="display display-lg">{msg("home.aboutTitle", locale)}</h2>
            <div className="section-rule" aria-hidden="true" />
            <p className="muted">{msg("home.aboutBody1", locale)}</p>
            <p className="muted">{msg("home.aboutBody2", locale)}</p>
            <div className="cta-row" style={{ justifyContent: "flex-start", marginTop: "0.5rem" }}>
              <Link href="/about" className="btn btn-primary">
                {msg("home.ctaAbout", locale)}
              </Link>
              <Link href="/about/founder" className="btn btn-ghost">
                {msg("home.ctaFounder", locale)}
              </Link>
            </div>
          </div>
          <div className="home-about-logo">
            <Logo variant="panel" />
          </div>
        </div>
      </section>

      <section className="section home-pathways">
        <div className="container">
          <div className="pathway-grid">
            <article className="pathway-card">
              <p className="eyebrow">{msg("courses.eyebrow", locale)}</p>
              <h3 className="display display-md">{msg("courses.title", locale)}</h3>
              <p className="muted">{msg("courses.intro", locale)}</p>
              <Link href="/courses" className="btn btn-ghost">
                {msg("home.ctaCourses", locale)}
              </Link>
            </article>
            <article className="pathway-card">
              <p className="eyebrow">{msg("library.eyebrow", locale)}</p>
              <h3 className="display display-md">{msg("library.title", locale)}</h3>
              <p className="muted">{msg("library.subtitle", locale)}</p>
              <Link href="/library" className="btn btn-ghost">
                {msg("home.ctaLibrary", locale)}
              </Link>
            </article>
            <article className="pathway-card">
              <p className="eyebrow">{msg("consultation.eyebrow", locale)}</p>
              <h3 className="display display-md">{msg("consultation.title", locale)}</h3>
              <p className="muted">{msg("consultation.lead", locale)}</p>
              <Link href="/consultation" className="btn btn-ghost">
                {msg("home.ctaConsultation", locale)}
              </Link>
            </article>
          </div>
        </div>
      </section>

      <section className="section home-values">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">{msg("home.valuesEyebrow", locale)}</p>
            <h2 className="display display-lg">{msg("home.valuesTitle", locale)}</h2>
            <div className="section-rule" aria-hidden="true" />
          </div>
          <div className="values-grid">
            {values.map((value, index) => (
              <article key={value.title} className="value-card">
                <span className="value-index" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3>{msg(value.title, locale)}</h3>
                <p className="muted small">{msg(value.body, locale)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-green home-cta">
        <div className="container home-cta-inner">
          <h2 className="display display-lg">{msg("home.ctaBannerTitle", locale)}</h2>
          <p style={{ opacity: 0.95, margin: 0 }}>
            {msg("home.ctaBannerBody", locale)}
          </p>
          <div className="cta-row" style={{ justifyContent: "flex-start", marginTop: 0 }}>
            <Link href="/courses" className="btn" style={{ background: "#fff", color: "#1F4D3A" }}>
              {msg("home.ctaCourses", locale)}
            </Link>
            <Link href="/library" className="btn btn-ghost">
              {msg("home.ctaLibrary", locale)}
            </Link>
          </div>
        </div>
      </section>

      {reviews.length > 0 ? (
        <section className="section home-reviews" aria-labelledby="home-reviews-title">
          <div className="container">
            <div className="section-heading">
              <p className="eyebrow">{msg("reviews.eyebrow", locale)}</p>
              <h2 id="home-reviews-title" className="display display-lg">
                {msg("reviews.title", locale)}
              </h2>
              <div className="section-rule" aria-hidden="true" />
              <p className="muted">{msg("reviews.lead", locale)}</p>
            </div>
            <ReviewsGallery reviews={reviews.slice(0, 6)} showViewAll={reviews.length > 6} />
          </div>
        </section>
      ) : null}

      <ConnectSection />
    </>
  );
}
