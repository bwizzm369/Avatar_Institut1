"use client";

import Image from "next/image";
import Link from "next/link";
import { ConnectSection } from "@/components/connect/ConnectSection";
import { Logo } from "@/components/Logo";
import { useLocale } from "@/components/LocaleProvider";
import { msg } from "@/lib/i18n";

const HERO_IMAGE_SRC = "/hero/avatar-online-institute-hero-v2.png";

export default function HomePage() {
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
            <p className="muted">{msg("home.aboutBody1", locale)}</p>
            <p className="muted">{msg("home.aboutBody2", locale)}</p>
            <div>
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

      <section className="section section-soft">
        <div className="container">
          <div className="text-center stack-lg" style={{ marginBottom: "2.5rem" }}>
            <p className="eyebrow">{msg("home.valuesEyebrow", locale)}</p>
            <h2 className="display display-lg">{msg("home.valuesTitle", locale)}</h2>
          </div>
          <div className="values-grid">
            {values.map((value) => (
              <article key={value.title} className="value-card">
                <h3>{msg(value.title, locale)}</h3>
                <p className="muted small">{msg(value.body, locale)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-green">
        <div className="container text-center stack-lg">
          <h2 className="display display-lg">{msg("home.ctaBannerTitle", locale)}</h2>
          <p style={{ opacity: 0.95, maxWidth: "40rem", margin: "0 auto" }}>
            {msg("home.ctaBannerBody", locale)}
          </p>
          <div className="cta-row">
            <Link href="/courses" className="btn" style={{ background: "#fff", color: "#1F4D3A" }}>
              {msg("home.ctaCourses", locale)}
            </Link>
          </div>
        </div>
      </section>

      <ConnectSection />
    </>
  );
}
