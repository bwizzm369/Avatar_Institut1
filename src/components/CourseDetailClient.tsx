"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CoursePassPricing } from "@/components/CoursePassPricing";
import { useCart } from "@/components/CartProvider";
import { useLocale } from "@/components/LocaleProvider";
import { countLessons, formatPrice } from "@/lib/courses";
import { dashboardCoursePath } from "@/lib/courses/course-slug";
import type { CoursePassOfferView } from "@/lib/courses/pass-offer";
import { displayLocalized, msg, msgReplace, t } from "@/lib/i18n";
import type { Course } from "@/types";

export function CourseDetailClient({
  course,
  offer,
}: {
  course: Course;
  offer?: CoursePassOfferView;
}) {
  const { locale } = useLocale();
  const router = useRouter();
  const { addCourse, hasCourse, ready: cartReady } = useCart();
  const inCart = cartReady && hasCourse(course.id);
  const includedAccess = Boolean(offer?.accessIncluded && offer.hasLearnerAccess);
  const lessonCount = countLessons(course);
  const levelLabel = t(course.level, locale).trim();
  const skills = course.skills[locale];
  const title = displayLocalized(course.title, locale);
  const summary = displayLocalized(course.summary, locale);
  const description = displayLocalized(course.description, locale);

  return (
    <div className="detail-page">
      <section className="page-hero">
        <div className="container page-hero-inner">
          <p className="eyebrow">{msg("courses.eyebrow", locale)}</p>
          <h1 className="display display-lg">{title}</h1>
          <div className="section-rule" aria-hidden="true" />
          {summary ? <p className="lead">{summary}</p> : null}
        </div>
      </section>

      <section className="section">
        <div className="container detail-layout">
          <div className="detail-main">
            <div className="course-detail-cover">
              {course.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  className="course-detail-image"
                  src={course.imageUrl}
                  alt=""
                />
              ) : (
                <div className="course-card-cover" aria-hidden="true">
                  <div className="course-card-cover-mark" />
                  <span className="course-card-cover-label">
                    {msg("learning.coverPlaceholder", locale)}
                  </span>
                </div>
              )}
            </div>
            {description ? (
              <p className="muted" style={{ lineHeight: 1.8 }}>
                {description}
              </p>
            ) : null}

            {course.modules.length > 0 ? (
              <>
                <h2 className="display display-md">
                  {msg("courses.curriculum", locale)}
                </h2>
                <div className="module-list">
                  {course.modules.map((module) => (
                    <article key={module.id} className="module-card">
                      <h3>
                        {msgReplace("common.module", locale, { n: module.order })} —{" "}
                        {t(module.title, locale)}
                      </h3>
                      <ul className="lesson-list">
                        {module.lessons.map((lesson) => (
                          <li key={lesson.id}>
                            <span>{t(lesson.title, locale)}</span>
                            <span>
                              {msgReplace("common.min", locale, {
                                n: lesson.durationMinutes,
                              })}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </div>
              </>
            ) : null}

            {skills.length > 0 ? (
              <div style={{ marginTop: "2rem" }}>
                <h2 className="display display-md">
                  {msg("courses.skills", locale)}
                </h2>
                <ul className="skills">
                  {skills.map((skill) => (
                    <li key={skill}>• {skill}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <aside className="detail-side">
            <CoursePassPricing
              locale={locale}
              currency={course.currency}
              listPriceCents={course.priceCents}
              offer={offer}
            />
            <dl>
              {levelLabel ? (
                <div>
                  <dt>{msg("courses.level", locale)}</dt>
                  <dd>{levelLabel}</dd>
                </div>
              ) : null}
              {course.durationWeeks > 0 ? (
                <div>
                  <dt>{msg("courses.duration", locale)}</dt>
                  <dd>
                    {msgReplace("courses.weeks", locale, {
                      n: course.durationWeeks,
                    })}
                  </dd>
                </div>
              ) : null}
              <div>
                <dt>{msg("courses.price", locale)}</dt>
                <dd>
                  {offer?.showMemberPrice && offer.memberPriceCents != null
                    ? formatPrice(offer.memberPriceCents, course.currency, locale)
                    : offer?.accessIncluded && offer.hasActiveStudentPass
                      ? msg("courses.passIncludedShort", locale)
                      : formatPrice(course.priceCents, course.currency, locale)}
                </dd>
              </div>
              {lessonCount > 0 ? (
                <div>
                  <dt>{msg("courses.lessonsLabel", locale)}</dt>
                  <dd>{lessonCount}</dd>
                </div>
              ) : null}
            </dl>
            {includedAccess ? (
              <Link
                href={dashboardCoursePath(course.slug)}
                className="btn btn-primary btn-block"
              >
                {msg("courses.startCourse", locale)}
              </Link>
            ) : (
              <button
                type="button"
                className="btn btn-primary btn-block"
                disabled={inCart}
                onClick={() => {
                  addCourse(course);
                  router.push("/cart");
                }}
              >
                {inCart ? msg("courses.inCart", locale) : msg("courses.addToCart", locale)}
              </button>
            )}
            <div>
              <Link href="/courses" className="btn btn-ghost btn-block">
                {msg("courses.back", locale)}
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
