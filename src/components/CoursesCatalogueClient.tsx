"use client";

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

  return (
    <>
      <section className="page-hero">
        <div className="container stack-lg">
          <p className="eyebrow">{msg("courses.eyebrow", locale)}</p>
          <h1 className="display display-lg">{msg("courses.title", locale)}</h1>
          <p className="lead">{msg("courses.intro", locale)}</p>
        </div>
      </section>
      <section className="section">
        <div className="container">
          {courses.length === 0 ? (
            <div className="empty-state">{msg("courses.empty", locale)}</div>
          ) : (
            <div className="courses-grid">
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  offer={offers[course.slug]}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
