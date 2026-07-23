"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { DemoBadge } from "@/components/DemoBadge";
import { useCart } from "@/components/CartProvider";
import { useLocale } from "@/components/LocaleProvider";
import { countLessons, formatPrice, getCourseBySlug } from "@/lib/courses";
import { msg, msgReplace, t } from "@/lib/i18n";

export default function CourseDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { locale } = useLocale();
  const { addCourse, hasCourse, ready: cartReady } = useCart();
  const course = getCourseBySlug(slug);

  if (!course) {
    return (
      <section className="section">
        <div className="container stack-lg">
          <h1 className="display display-md">{msg("courses.notFound", locale)}</h1>
          <Link href="/courses" className="btn btn-ghost">
            {msg("courses.back", locale)}
          </Link>
        </div>
      </section>
    );
  }

  const inCart = cartReady && hasCourse(course.id);

  return (
    <>
      <section className="page-hero">
        <div className="container stack-lg">
          {course.isDemo ? <DemoBadge /> : null}
          <h1 className="display display-lg">{t(course.title, locale)}</h1>
          <p className="lead">{t(course.summary, locale)}</p>
        </div>
      </section>

      <section className="section">
        <div className="container detail-layout">
          <div>
            <p className="muted" style={{ marginBottom: "2rem", lineHeight: 1.8 }}>
              {t(course.description, locale)}
            </p>

            <h2 className="display display-md">{msg("courses.curriculum", locale)}</h2>
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

            <div style={{ marginTop: "2rem" }}>
              <h2 className="display display-md">{msg("courses.skills", locale)}</h2>
              <ul className="skills">
                {course.skills[locale].map((skill) => (
                  <li key={skill}>• {skill}</li>
                ))}
              </ul>
            </div>
          </div>

          <aside className="detail-side">
            <p className="price">
              {formatPrice(course.priceCents, course.currency, locale)}
            </p>
            <dl>
              <div>
                <dt>{msg("courses.level", locale)}</dt>
                <dd>{t(course.level, locale)}</dd>
              </div>
              <div>
                <dt>{msg("courses.duration", locale)}</dt>
                <dd>
                  {msgReplace("courses.weeks", locale, { n: course.durationWeeks })}
                </dd>
              </div>
              <div>
                <dt>{msg("courses.price", locale)}</dt>
                <dd>
                  {formatPrice(course.priceCents, course.currency, locale)}
                </dd>
              </div>
              <div>
                <dt>{msg("courses.lessonsLabel", locale)}</dt>
                <dd>{countLessons(course)}</dd>
              </div>
            </dl>
            <button
              type="button"
              className="btn btn-primary btn-block"
              disabled={inCart}
              onClick={() => addCourse(course)}
            >
              {inCart ? msg("courses.inCart", locale) : msg("courses.addToCart", locale)}
            </button>
            <div className="notice-box">{msg("cart.checkoutDisabled", locale)}</div>
            <div style={{ marginTop: "1rem" }}>
              <Link href="/courses" className="btn btn-ghost btn-block">
                {msg("courses.back", locale)}
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
