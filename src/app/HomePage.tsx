"use client";

import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { msg } from "@/lib/i18n";

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
      <section className="hero">
        <div className="hero-decor-a" aria-hidden="true" />
        <div className="hero-decor-b" aria-hidden="true" />
        <div className="hero-content">
          <p className="eyebrow">{msg("home.eyebrow", locale)}</p>
          <h1 className="display display-xl">{msg("home.title", locale)}</h1>
          {locale === "en" ? (
            <p className="hero-ar" lang="ar" dir="rtl">
              استكشف ميتافيزيقا الوعي الإنساني
            </p>
          ) : null}
          <p className="lead">{msg("home.subtitle", locale)}</p>
          <div className="hero-actions">
            <Link href="/courses" className="btn btn-primary">
              {msg("home.ctaCourses", locale)}
            </Link>
            <a href="#about" className="btn btn-ghost">
              {msg("home.ctaAbout", locale)}
            </a>
          </div>
        </div>
      </section>

      <section id="about" className="section">
        <div className="container split">
          <div className="stack-lg">
            <p className="eyebrow">{msg("home.aboutEyebrow", locale)}</p>
            <h2 className="display display-lg">{msg("home.aboutTitle", locale)}</h2>
            <p className="muted">{msg("home.aboutBody1", locale)}</p>
            <p className="muted">{msg("home.aboutBody2", locale)}</p>
            <div>
              <Link href="/courses" className="btn btn-ghost">
                {msg("home.ctaCourses", locale)}
              </Link>
            </div>
          </div>
          <div className="panel">
            <div className="text-center">
              <svg
                width="120"
                height="120"
                viewBox="0 0 120 120"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                style={{ margin: "0 auto 1rem" }}
              >
                <circle cx="60" cy="60" r="50" fill="none" stroke="#1F4D3A" strokeWidth="1.5" />
                <circle
                  cx="60"
                  cy="60"
                  r="35"
                  fill="none"
                  stroke="#1F4D3A"
                  strokeWidth="1"
                  opacity="0.5"
                />
                <circle cx="60" cy="60" r="8" fill="#1F4D3A" />
                <circle cx="60" cy="20" r="3" fill="#1F4D3A" opacity="0.6" />
                <circle cx="100" cy="60" r="3" fill="#1F4D3A" opacity="0.6" />
                <circle cx="60" cy="100" r="3" fill="#1F4D3A" opacity="0.6" />
                <circle cx="20" cy="60" r="3" fill="#1F4D3A" opacity="0.6" />
              </svg>
              <p className="serif accent">{msg("brand.tagline", locale)}</p>
            </div>
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
    </>
  );
}
