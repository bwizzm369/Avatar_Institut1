"use client";

import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import type { DashboardStudentState } from "@/lib/enrollments/types";
import { msg } from "@/lib/i18n";
import type { Locale } from "@/types";

function courseTitle(
  course: { title_en: string; title_ar: string },
  locale: Locale,
): string {
  return locale === "ar" ? course.title_ar : course.title_en;
}

function courseSummary(
  course: { summary_en: string; summary_ar: string },
  locale: Locale,
): string {
  return locale === "ar" ? course.summary_ar : course.summary_en;
}

function ctaLabel(percent: number, locale: Locale): string {
  if (percent <= 0) return msg("learning.ctaStart", locale);
  if (percent >= 100) return msg("learning.ctaReview", locale);
  return msg("learning.ctaContinue", locale);
}

export function DashboardCoursesClient({
  state,
}: {
  state: DashboardStudentState;
}) {
  const { locale } = useLocale();

  if (state.kind === "unconfigured") {
    return (
      <div className="learning-courses-root">
        <div className="notice-box">{msg("auth.configMissing", locale)}</div>
      </div>
    );
  }

  if (state.kind === "unauthenticated") {
    return (
      <div className="learning-courses-root learning-stack">
        <div className="notice-box">{msg("dashboard.unauthenticated", locale)}</div>
        <Link href="/login" className="btn btn-primary">
          {msg("nav.login", locale)}
        </Link>
      </div>
    );
  }

  if (state.enrollments.length === 0) {
    return (
      <div className="learning-courses-root">
        <div className="empty-state">{msg("dashboard.coursesEmpty", locale)}</div>
      </div>
    );
  }

  return (
    <div className="learning-courses-root">
      <ul className="learning-course-grid">
        {state.enrollments.map(({ course, enrollment, progress }) => {
          const href = `/dashboard/courses/${course.slug}`;
          const title = courseTitle(course, locale);

          return (
            <li key={enrollment.id} className="learning-course-card">
              <div
                className="learning-course-cover"
                aria-hidden="true"
              >
                <div className="learning-course-cover-mark" />
                <span className="learning-course-cover-label">
                  {msg("learning.coverPlaceholder", locale)}
                </span>
              </div>

              <div className="learning-course-card-body">
                <div className="learning-course-card-meta">
                  {course.is_demo ? (
                    <span className="learning-badge">
                      {msg("courses.demoBadge", locale)}
                    </span>
                  ) : (
                    <span className="learning-badge learning-badge-solid">
                      {msg("learning.enrolledBadge", locale)}
                    </span>
                  )}
                  <span className="learning-course-card-percent">
                    {progress.percent}%
                  </span>
                </div>

                <h3 className="learning-course-card-title display display-sm">
                  <Link href={href}>{title}</Link>
                </h3>

                <p className="learning-course-card-summary muted">
                  {courseSummary(course, locale)}
                </p>

                <div
                  className="learning-progress learning-progress-compact"
                  role="status"
                  aria-label={msg("learning.progressLabel", locale)}
                >
                  <div className="learning-progress-meta">
                    <span>
                      {msg("learning.progressCount", locale)
                        .replace(
                          "{completed}",
                          String(progress.completedLessons),
                        )
                        .replace("{total}", String(progress.totalLessons))}
                    </span>
                  </div>
                  <div className="learning-progress-bar" aria-hidden="true">
                    <span style={{ width: `${progress.percent}%` }} />
                  </div>
                </div>

                <Link href={href} className="btn btn-primary learning-cta">
                  {ctaLabel(progress.percent, locale)}
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
