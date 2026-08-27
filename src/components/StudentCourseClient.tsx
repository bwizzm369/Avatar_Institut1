"use client";

import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { dashboardLessonPath } from "@/lib/courses/course-slug";
import { studentLocalizedText } from "@/lib/courses/student-display";
import type { StudentCourseView, StudentLessonSummary } from "@/lib/learning/queries";
import type { LessonProgressStatus, LessonType } from "@/lib/learning/progress";
import { msg } from "@/lib/i18n";
import type { Locale } from "@/types";

function typeLabel(type: LessonType, locale: Locale): string {
  if (type === "video") return msg("learning.type.video", locale);
  if (type === "text") return msg("learning.type.text", locale);
  return msg("learning.type.pdf", locale);
}

function statusLabel(status: LessonProgressStatus, locale: Locale): string {
  if (status === "completed") return msg("learning.status.completed", locale);
  if (status === "in_progress") return msg("learning.status.inProgress", locale);
  return msg("learning.status.notStarted", locale);
}

function typeIcon(type: LessonType): string {
  if (type === "video") return "▶";
  if (type === "text") return "¶";
  return "▤";
}

function findNextLesson(
  view: StudentCourseView,
): StudentLessonSummary | null {
  for (const mod of view.modules) {
    for (const lesson of mod.lessons) {
      if (lesson.progressStatus !== "completed") {
        return lesson;
      }
    }
  }
  return view.modules[0]?.lessons[0] ?? null;
}

function totalDurationMinutes(view: StudentCourseView): number {
  return view.modules.reduce(
    (sum, mod) =>
      sum + mod.lessons.reduce((inner, lesson) => inner + lesson.durationMinutes, 0),
    0,
  );
}

export function StudentCourseClient({
  view,
}: {
  view: StudentCourseView;
}) {
  const { locale } = useLocale();
  const { course, modules, progress } = view;
  const nextLesson = findNextLesson(view);
  const nextHref = nextLesson
    ? dashboardLessonPath(course.slug, nextLesson.id)
    : null;
  const durationTotal = totalDurationMinutes(view);
  const certificateReady = progress.percent >= 100;

  return (
    <div className="learning-reader">
      <section className="learning-hero">
        <div className="learning-hero-main">
          <p className="eyebrow">{msg("learning.courseEyebrow", locale)}</p>
          <h2 className="display display-md learning-hero-title">
            {studentLocalizedText(course.title_en, course.title_ar, locale)}
          </h2>
          {course.is_demo ? (
            <span className="learning-badge">
              {msg("courses.demoBadge", locale)}
            </span>
          ) : null}
          <p className="learning-hero-lead">
            {studentLocalizedText(
              course.description_en,
              course.description_ar,
              locale,
            )}
          </p>

          <div
            className="learning-progress"
            role="status"
            aria-label={msg("learning.progressLabel", locale)}
          >
            <div className="learning-progress-meta">
              <strong>{msg("learning.progressLabel", locale)}</strong>
              <span>
                {msg("learning.progressCount", locale)
                  .replace("{completed}", String(progress.completedLessons))
                  .replace("{total}", String(progress.totalLessons))}{" "}
                · {progress.percent}%
              </span>
            </div>
            <div className="learning-progress-bar" aria-hidden="true">
              <span style={{ width: `${progress.percent}%` }} />
            </div>
          </div>

          {nextHref ? (
            <Link href={nextHref} className="btn btn-primary learning-cta">
              {progress.percent <= 0
                ? msg("learning.ctaStart", locale)
                : progress.percent >= 100
                  ? msg("learning.ctaReview", locale)
                  : msg("learning.continueNextLesson", locale)}
            </Link>
          ) : null}
        </div>

        <aside className="learning-sidebar" aria-label={msg("learning.sidebarLabel", locale)}>
          <div className="learning-sidebar-card">
            <h3 className="learning-sidebar-heading">
              {msg("learning.progressLabel", locale)}
            </h3>
            <p className="learning-sidebar-value">{progress.percent}%</p>
            <p className="muted">
              {msg("learning.progressCount", locale)
                .replace("{completed}", String(progress.completedLessons))
                .replace("{total}", String(progress.totalLessons))}
            </p>
          </div>
          <div className="learning-sidebar-card">
            <h3 className="learning-sidebar-heading">
              {msg("learning.totalDuration", locale)}
            </h3>
            <p className="learning-sidebar-value">
              {msg("learning.durationMinutes", locale).replace(
                "{n}",
                String(durationTotal),
              )}
            </p>
          </div>
          <div className="learning-sidebar-card">
            <h3 className="learning-sidebar-heading">
              {msg("learning.certificateStatus", locale)}
            </h3>
            <p className="muted">
              {certificateReady
                ? msg("learning.certificateReady", locale)
                : msg("learning.certificatePending", locale)}
            </p>
          </div>
        </aside>
      </section>

      <div className="learning-modules">
        {modules.length === 0 ? (
          <div className="empty-state">{msg("learning.noModules", locale)}</div>
        ) : (
          modules.map((mod, index) => {
            const openByDefault =
              index === 0 ||
              mod.lessons.some(
                (lesson) =>
                  lesson.id === nextLesson?.id ||
                  lesson.progressStatus === "in_progress",
              );

            return (
              <details
                key={mod.id}
                className="learning-accordion"
                open={openByDefault}
              >
                <summary className="learning-accordion-summary">
                  <span className="learning-accordion-title display display-sm">
                    {studentLocalizedText(mod.title_en, mod.title_ar, locale)}
                  </span>
                  <span className="learning-accordion-count muted">
                    {msg("learning.moduleLessonCount", locale).replace(
                      "{n}",
                      String(mod.lessons.length),
                    )}
                  </span>
                </summary>
                <ul className="learning-lesson-list">
                  {mod.lessons.map((lesson) => {
                    const isNext = nextLesson?.id === lesson.id;
                    return (
                      <li
                        key={lesson.id}
                        className={
                          isNext
                            ? "learning-lesson-item learning-lesson-item-next"
                            : "learning-lesson-item"
                        }
                        data-status={lesson.progressStatus}
                      >
                        <div className="learning-lesson-main">
                          <span
                            className="learning-lesson-icon"
                            aria-hidden="true"
                            title={typeLabel(lesson.lessonType, locale)}
                          >
                            {typeIcon(lesson.lessonType)}
                          </span>
                          <div className="learning-lesson-meta">
                            <Link
                              href={dashboardLessonPath(course.slug, lesson.id)}
                              className="learning-lesson-title"
                            >
                              {studentLocalizedText(
                                lesson.title_en,
                                lesson.title_ar,
                                locale,
                              )}
                              {isNext ? (
                                <span className="learning-next-pill">
                                  {msg("learning.nextLesson", locale)}
                                </span>
                              ) : null}
                            </Link>
                            <p className="muted learning-lesson-attrs">
                              {typeLabel(lesson.lessonType, locale)}
                              {" · "}
                              {msg("learning.durationMinutes", locale).replace(
                                "{n}",
                                String(lesson.durationMinutes),
                              )}
                              {" · "}
                              <span
                                data-status={lesson.progressStatus}
                                className="learning-status"
                              >
                                {statusLabel(lesson.progressStatus, locale)}
                              </span>
                            </p>
                          </div>
                        </div>
                        <Link
                          href={dashboardLessonPath(course.slug, lesson.id)}
                          className="btn btn-ghost learning-open-lesson"
                        >
                          {msg("learning.openLesson", locale)}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </details>
            );
          })
        )}
      </div>

      <Link href="/dashboard/courses" className="btn btn-ghost">
        {msg("learning.backToCourses", locale)}
      </Link>
    </div>
  );
}
