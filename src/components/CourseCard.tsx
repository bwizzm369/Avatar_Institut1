"use client";

import Link from "next/link";
import { DemoBadge } from "@/components/DemoBadge";
import { useCart } from "@/components/CartProvider";
import { useLocale } from "@/components/LocaleProvider";
import { countLessons, formatPrice } from "@/lib/courses";
import { msg, msgReplace, t } from "@/lib/i18n";
import type { Course } from "@/types";

export function CourseCard({ course }: { course: Course }) {
  const { locale } = useLocale();
  const { addCourse, hasCourse, ready: cartReady } = useCart();
  const inCart = cartReady && hasCourse(course.id);

  return (
    <article className="course-card">
      <div className="course-card-top">
        {course.isDemo ? <DemoBadge /> : null}
        <h2 className="course-card-title">
          <Link href={`/courses/${course.slug}`}>{t(course.title, locale)}</Link>
        </h2>
        <p className="muted">{t(course.summary, locale)}</p>
      </div>
      <div className="course-meta">
        <span>{msgReplace("courses.weeks", locale, { n: course.durationWeeks })}</span>
        <span>{msgReplace("courses.lessons", locale, { n: countLessons(course) })}</span>
        <span>{t(course.level, locale)}</span>
      </div>
      <div className="course-card-footer">
        <strong className="price">
          {formatPrice(course.priceCents, course.currency, locale)}
        </strong>
        <div className="course-actions">
          <Link href={`/courses/${course.slug}`} className="btn btn-ghost">
            {msg("courses.view", locale)}
          </Link>
          <button
            type="button"
            className="btn btn-primary"
            disabled={inCart}
            onClick={() => addCourse(course)}
          >
            {inCart ? msg("courses.inCart", locale) : msg("courses.addToCart", locale)}
          </button>
        </div>
      </div>
    </article>
  );
}
