"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { markLessonCompleteAction } from "@/lib/learning/actions";
import type { StudentLessonView } from "@/lib/learning/queries";
import { msg } from "@/lib/i18n";
import type { Locale } from "@/types";

function pick(en: string, ar: string, locale: Locale): string {
  return locale === "ar" ? ar : en;
}

export function StudentLessonClient({
  view,
}: {
  view: StudentLessonView;
}) {
  const { locale } = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const { lesson, progress } = view;
  const completed = lesson.progressStatus === "completed";

  function handleComplete() {
    setFeedback(null);
    startTransition(async () => {
      const result = await markLessonCompleteAction({
        courseSlug: view.courseSlug,
        lessonId: lesson.id,
      });
      if (!result.ok) {
        setFeedback(msg(result.errorKey, locale));
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="dashboard-panel stack-lg learning-lesson">
      <div>
        <p className="eyebrow">
          {pick(view.courseTitle_en, view.courseTitle_ar, locale)}
        </p>
        <h2 className="display display-md">
          {pick(lesson.title_en, lesson.title_ar, locale)}
        </h2>
        <p className="muted">
          {pick(view.moduleTitle_en, view.moduleTitle_ar, locale)}
          {" · "}
          {msg(`learning.type.${lesson.lessonType}`, locale)}
          {" · "}
          {msg("learning.durationMinutes", locale).replace(
            "{n}",
            String(lesson.durationMinutes),
          )}
        </p>
      </div>

      <div className="learning-progress" role="status">
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

      {lesson.lessonType === "video" ? (
        <div className="learning-bunny-slot" role="region">
          <p className="learning-bunny-title">
            {msg("learning.bunnyPlaceholderTitle", locale)}
          </p>
          <p className="muted">
            {lesson.hasBunnyVideo
              ? msg("learning.bunnyPlaceholderReady", locale)
              : msg("learning.bunnyPlaceholderMissing", locale)}
          </p>
          <p className="muted learning-bunny-note">
            {msg("learning.bunnyPlaceholderNote", locale)}
          </p>
        </div>
      ) : null}

      {lesson.lessonType === "text" ? (
        <article className="learning-text-content">
          <p>
            {pick(lesson.text_content_en, lesson.text_content_ar, locale)}
          </p>
        </article>
      ) : null}

      {lesson.lessonType === "pdf" ? (
        <div className="learning-pdf-slot">
          {lesson.pdf_url ? (
            <a
              href={lesson.pdf_url}
              className="btn btn-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              {msg("learning.openPdf", locale)}
            </a>
          ) : (
            <p className="muted">{msg("learning.pdfMissing", locale)}</p>
          )}
        </div>
      ) : null}

      <div className="learning-lesson-actions">
        {completed ? (
          <div className="notice-box" role="status">
            {msg("learning.alreadyCompleted", locale)}
          </div>
        ) : (
          <button
            type="button"
            className="btn btn-primary"
            disabled={pending}
            onClick={handleComplete}
          >
            {pending
              ? msg("learning.markingComplete", locale)
              : msg("learning.markComplete", locale)}
          </button>
        )}
        {feedback ? (
          <div className="notice-box" role="alert">
            {feedback}
          </div>
        ) : null}
      </div>

      <Link
        href={`/dashboard/courses/${view.courseSlug}`}
        className="btn btn-ghost"
      >
        {msg("learning.backToCourse", locale)}
      </Link>
    </div>
  );
}
