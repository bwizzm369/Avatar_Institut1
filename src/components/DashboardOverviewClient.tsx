"use client";

import Link from "next/link";
import { DigitalMemberCard } from "@/components/DigitalMemberCard";
import { useLocale } from "@/components/LocaleProvider";
import {
  courseTitleForLocale,
} from "@/lib/certificates/verify";
import { dashboardCoursePath } from "@/lib/courses/course-slug";
import {
  studentCourseSummary,
  studentCourseTitle,
} from "@/lib/courses/student-display";
import type { StudentCertificatesState } from "@/lib/certificates/student-view";
import type { DashboardStudentState } from "@/lib/enrollments/types";
import {
  dashboardIntroMessageKey,
  hasConfirmedCoursePayment,
} from "@/lib/dashboard/welcome-intro";
import { msg } from "@/lib/i18n";
import type { StudentMembershipState } from "@/lib/student-pass/membership";

export function DashboardOverviewClient({
  state,
  membership,
  certificates,
}: {
  state: DashboardStudentState;
  membership: StudentMembershipState;
  certificates: StudentCertificatesState;
}) {
  const { locale } = useLocale();

  if (state.kind === "unconfigured") {
    return (
      <div className="overview-stack">
        <div className="notice-box">{msg("auth.configMissing", locale)}</div>
      </div>
    );
  }

  if (state.kind === "unauthenticated") {
    return (
      <div className="overview-stack">
        <div className="notice-box">{msg("dashboard.unauthenticated", locale)}</div>
        <Link href="/login" className="btn btn-primary">
          {msg("nav.login", locale)}
        </Link>
      </div>
    );
  }

  const displayName =
    [state.profile?.first_name, state.profile?.last_name]
      .filter(Boolean)
      .join(" ")
      .trim() || state.email;

  const courseCount = state.enrollments.length;
  const overallProgress =
    courseCount === 0
      ? 0
      : Math.round(
          state.enrollments.reduce(
            (sum, item) => sum + item.progress.percent,
            0,
          ) / courseCount,
        );
  const passStatus =
    membership.kind === "ready" ? membership.card.cardStatus : null;
  const certificateCount =
    certificates.kind === "ok" ? certificates.certificates.length : 0;
  const previewCertificates =
    certificates.kind === "ok" ? certificates.certificates.slice(0, 3) : [];

  return (
    <div className="overview-stack">
      <header className="overview-welcome">
        <h2 className="display display-md">
          {msg("dashboard.welcomeNamed", locale).replace("{name}", displayName)}
        </h2>
        <p className="muted">
          {msg(
            dashboardIntroMessageKey({
              hasConfirmedCoursePayment: hasConfirmedCoursePayment(
                state.enrollments,
              ),
              hasActiveMembership: passStatus === "ACTIVE",
            }),
            locale,
          )}
        </p>
      </header>

      <dl className="overview-stats">
        <div className="overview-stat">
          <dt>{msg("dashboard.nav.courses", locale)}</dt>
          <dd>{courseCount}</dd>
        </div>
        <div className="overview-stat">
          <dt>{msg("dashboard.overallProgress", locale)}</dt>
          <dd>
            {overallProgress}
            <span className="overview-stat-note">%</span>
          </dd>
        </div>
        <div className="overview-stat">
          <dt>{msg("dashboard.nav.studentPass", locale)}</dt>
          <dd className="overview-stat-status">
            {passStatus === "ACTIVE"
              ? msg("dashboard.memberCardActive", locale)
              : msg("dashboard.memberCardInactive", locale)}
          </dd>
        </div>
        <div className="overview-stat">
          <dt>{msg("dashboard.nav.certificates", locale)}</dt>
          <dd>{certificateCount}</dd>
        </div>
      </dl>

      <div className="overview-grid">
        <section className="overview-block" aria-labelledby="overview-courses">
          <div className="overview-block-header">
            <h3 id="overview-courses" className="display display-sm">
              {msg("dashboard.nav.courses", locale)}
            </h3>
            <Link href="/dashboard/courses" className="overview-block-link">
              {msg("dashboard.viewAll", locale)}
            </Link>
          </div>
          {courseCount === 0 ? (
            <div className="empty-state">
              <div className="empty-state-mark" aria-hidden="true" />
              <p>{msg("dashboard.coursesEmpty", locale)}</p>
              <Link href="/courses" className="btn btn-ghost">
                {msg("home.ctaCourses", locale)}
              </Link>
            </div>
          ) : (
            <ul className="course-list">
              {state.enrollments.map(({ course, enrollment, progress }) => (
                <li key={enrollment.id} className="course-list-item">
                  <div className="overview-progress-row">
                    <h4 className="display display-sm">
                      {studentCourseTitle(course, locale)}
                    </h4>
                    <p className="muted small">
                      {studentCourseSummary(course, locale)}
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
                        <span className="learning-course-card-percent">
                          {progress.percent}%
                        </span>
                      </div>
                      <div className="learning-progress-bar" aria-hidden="true">
                        <span style={{ width: `${progress.percent}%` }} />
                      </div>
                    </div>
                  </div>
                  <Link
                    href={dashboardCoursePath(course.slug)}
                    className="btn btn-ghost"
                  >
                    {msg("courses.view", locale)}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="overview-stack">
          <section className="overview-block" aria-labelledby="overview-pass">
            <div className="overview-block-header">
              <h3 id="overview-pass" className="display display-sm">
                {msg("dashboard.nav.studentPass", locale)}
              </h3>
              <Link href="/dashboard/student-pass" className="overview-block-link">
                {msg("dashboard.viewAll", locale)}
              </Link>
            </div>
            {membership.kind === "ready" ? (
              <DigitalMemberCard card={membership.card} />
            ) : (
              <p className="muted">{msg("dashboard.studentPassNotice", locale)}</p>
            )}
          </section>

          <section className="overview-block" aria-labelledby="overview-certs">
            <div className="overview-block-header">
              <h3 id="overview-certs" className="display display-sm">
                {msg("dashboard.nav.certificates", locale)}
              </h3>
              <Link href="/dashboard/certificates" className="overview-block-link">
                {msg("dashboard.viewAll", locale)}
              </Link>
            </div>
            {certificateCount === 0 ? (
              <div className="empty-state">
                <p>{msg("dashboard.certificatesEmpty", locale)}</p>
              </div>
            ) : (
              <ul className="certificate-list">
                {previewCertificates.map((certificate) => (
                  <li key={certificate.certificateNumber} className="certificate-card">
                    <p className="certificate-number">
                      {certificate.certificateNumber}
                    </p>
                    <p className="muted small">
                      {courseTitleForLocale(
                        {
                          courseTitleEn: certificate.courseTitleEn,
                          courseTitleAr: certificate.courseTitleAr,
                        },
                        locale,
                      )}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
