"use client";

import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { msg } from "@/lib/i18n";

export function LearningAccessDenied({
  reason,
}: {
  reason: "forbidden" | "not_found" | "unconfigured" | "unauthenticated";
}) {
  const { locale } = useLocale();

  const messageKey =
    reason === "unconfigured"
      ? "auth.configMissing"
      : reason === "unauthenticated"
        ? "dashboard.unauthenticated"
        : reason === "not_found"
          ? "learning.courseNotFound"
          : "learning.accessDenied";

  return (
    <div className="dashboard-panel stack-lg">
      <div className="notice-box" role="alert">
        {msg(messageKey, locale)}
      </div>
      {reason === "unauthenticated" ? (
        <Link href="/login" className="btn btn-primary">
          {msg("nav.login", locale)}
        </Link>
      ) : (
        <Link href="/dashboard/courses" className="btn btn-ghost">
          {msg("learning.backToCourses", locale)}
        </Link>
      )}
    </div>
  );
}
