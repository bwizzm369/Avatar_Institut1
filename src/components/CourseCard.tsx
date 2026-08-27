"use client";

import Link from "next/link";
import { CoursePassPricing } from "@/components/CoursePassPricing";
import { useCart } from "@/components/CartProvider";
import { useLocale } from "@/components/LocaleProvider";
import { countLessons } from "@/lib/courses";
import {
  dashboardCoursePath,
  publicCoursePath,
} from "@/lib/courses/course-slug";
import type { CoursePassOfferView } from "@/lib/courses/pass-offer";
import { displayLocalized, msg, msgReplace, t } from "@/lib/i18n";
import type { Course } from "@/types";

export function CourseCard({
  course,
  offer,
}: {
  course: Course;
  offer?: CoursePassOfferView;
}) {
  const { locale } = useLocale();
  const { addCourse, hasCourse, ready: cartReady } = useCart();
  const inCart = cartReady && hasCourse(course.id);
  const includedAccess = Boolean(offer?.accessIncluded && offer.hasLearnerAccess);
  const lessonCount = countLessons(course);
  const levelLabel = t(course.level, locale).trim();
  const title = displayLocalized(course.title, locale);
  const summary = displayLocalized(course.summary, locale);

  return (
    <article className="course-card">
      {course.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="course-card-image"
          src={course.imageUrl}
          alt=""
        />
      ) : null}
      <div className="course-card-top">
        <h2 className="course-card-title">
          <Link href={publicCoursePath(course.slug)}>{title}</Link>
        </h2>
        {summary ? <p className="muted">{summary}</p> : null}
      </div>
      <div className="course-meta">
        {course.durationWeeks > 0 ? (
          <span>
            {msgReplace("courses.weeks", locale, { n: course.durationWeeks })}
          </span>
        ) : null}
        {lessonCount > 0 ? (
          <span>
            {msgReplace("courses.lessons", locale, { n: lessonCount })}
          </span>
        ) : null}
        {levelLabel ? <span>{levelLabel}</span> : null}
      </div>
      <div className="course-card-footer">
        <CoursePassPricing
          locale={locale}
          currency={course.currency}
          listPriceCents={course.priceCents}
          offer={offer}
          compact
        />
        <div className="course-actions">
          <Link href={publicCoursePath(course.slug)} className="btn btn-ghost">
            {msg("courses.view", locale)}
          </Link>
          {includedAccess ? (
            <Link
              href={dashboardCoursePath(course.slug)}
              className="btn btn-primary"
            >
              {msg("courses.startCourse", locale)}
            </Link>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              disabled={inCart}
              onClick={() => addCourse(course)}
            >
              {inCart ? msg("courses.inCart", locale) : msg("courses.addToCart", locale)}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
