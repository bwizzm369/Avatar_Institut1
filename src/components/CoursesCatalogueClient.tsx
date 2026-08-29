"use client";

import Link from "next/link";
import { CourseCard } from "@/components/CourseCard";
import { useLocale } from "@/components/LocaleProvider";
import type { CoursePassOfferMap } from "@/lib/courses/load-pass-offers";
import { msg } from "@/lib/i18n";
import type { Course } from "@/types";

export function CoursesCatalogueClient({
  courses,
  offers,
}: {
  courses: Course[];
  offers: CoursePassOfferMap;
}) {
  const { locale } = useLocale();
  const sparse = courses.length > 0 && courses.length < 3;

  return (
    <div className="catalogue-page">
      <section className="page-hero">
        <div className="container page-hero-inner">
          <p className="eyebrow">{msg("courses.eyebrow", locale)}</p>
          <h1 className="display display-lg">{msg("courses.title", locale)}</h1>
          <div className="section-rule" aria-hidden="true" />
          <p className="lead">{msg("courses.intro", locale)}</p>
        </div>
      </section>
      <section className="section">
        <div
          className={
            sparse
              ? "container catalogue-layout catalogue-layout--split"
              : "container catalogue-layout"
          }
        >
          {courses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-mark" aria-hidden="true" />
              <p className="eyebrow">{msg("courses.eyebrow", locale)}</p>
              <h2 className="display display-md">{msg("courses.empty", locale)}</h2>
              <p>{msg("courses.intro", locale)}</p>
              <Link href="/library" className="btn btn-ghost">
                {msg("home.ctaLibrary", locale)}
              </Link>
            </div>
          ) : (
            <div className={sparse ? "courses-grid courses-grid--sparse" : "courses-grid"}>
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  offer={offers[course.slug]}
                />
              ))}
            </div>
          )}

          {courses.length < 3 ? (
            <aside className="catalogue-companion">
              <article className="companion-card">
                <p className="eyebrow">{msg("library.eyebrow", locale)}</p>
                <h2 className="display display-sm">{msg("library.title", locale)}</h2>
                <p className="muted small">{msg("library.subtitle", locale)}</p>
                <Link href="/library" className="overview-block-link">
                  {msg("home.ctaLibrary", locale)}
                </Link>
              </article>
              <article className="companion-card">
                <p className="eyebrow">{msg("about.eyebrow", locale)}</p>
                <h2 className="display display-sm">{msg("about.title", locale)}</h2>
                <p className="muted small">{msg("home.aboutBody1", locale)}</p>
                <Link href="/about" className="overview-block-link">
                  {msg("home.ctaAbout", locale)}
                </Link>
              </article>
            </aside>
          ) : null}
        </div>
      </section>
    </div>
  );
}
