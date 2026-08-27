"use client";

import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { dashboardCoursePath } from "@/lib/courses/course-slug";
import {
  studentCourseSummary,
  studentCourseTitle,
} from "@/lib/courses/student-display";
import type { DashboardStudentState } from "@/lib/enrollments/types";
import { msg } from "@/lib/i18n";

export function DashboardOverviewClient({
  state,
}: {
  state: DashboardStudentState;
}) {
  const { locale } = useLocale();

  if (state.kind === "unconfigured") {
    return (
      <div className="dashboard-panel stack-lg">
        <div className="notice-box">{msg("auth.configMissing", locale)}</div>
      </div>
    );
  }

  if (state.kind === "unauthenticated") {
    return (
      <div className="dashboard-panel stack-lg">
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

  return (
    <div className="dashboard-panel stack-lg">
      <h2 className="display display-md">
        {msg("dashboard.welcomeNamed", locale).replace("{name}", displayName)}
      </h2>
      <p className="muted">{msg("dashboard.intro", locale)}</p>
      <Link href="/dashboard/student-pass" className="btn btn-ghost">
        {msg("dashboard.nav.studentPass", locale)}
      </Link>
      {state.enrollments.length === 0 ? (
        <div className="empty-state">{msg("dashboard.coursesEmpty", locale)}</div>
      ) : (
        <ul className="course-list">
          {state.enrollments.map(({ course, enrollment }) => (
            <li key={enrollment.id} className="course-list-item">
              <div>
                <h3 className="display display-sm">
                  {studentCourseTitle(course, locale)}
                </h3>
                <p className="muted">{studentCourseSummary(course, locale)}</p>
                {course.is_demo ? (
                  <span className="demo-badge">
                    {msg("courses.demoBadge", locale)}
                  </span>
                ) : null}
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
    </div>
  );
}
