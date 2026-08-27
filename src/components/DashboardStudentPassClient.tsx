"use client";

import Link from "next/link";
import { DigitalMemberCard } from "@/components/DigitalMemberCard";
import { useLocale } from "@/components/LocaleProvider";
import type { StudentMembershipState } from "@/lib/student-pass/membership";
import { msg } from "@/lib/i18n";

export function DashboardStudentPassClient({
  state,
}: {
  state: StudentMembershipState;
}) {
  const { locale } = useLocale();

  if (state.kind === "unconfigured") {
    return (
      <div className="dashboard-panel">
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

  return (
    <div className="dashboard-panel student-pass-panel">
      <p className="student-pass-lead">
        {msg("dashboard.studentPassMaintains", locale)}
      </p>
      <p className="muted student-pass-price">
        {msg("dashboard.studentPassPrice", locale)}
      </p>
      <DigitalMemberCard card={state.card} />
    </div>
  );
}
