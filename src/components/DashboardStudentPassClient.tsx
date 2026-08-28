"use client";

import Link from "next/link";
import { DigitalMemberCard } from "@/components/DigitalMemberCard";
import { StudentPassSubscribeButton } from "@/components/StudentPassSubscribeButton";
import { useLocale } from "@/components/LocaleProvider";
import type { StudentMembershipState } from "@/lib/student-pass/membership";
import { msg } from "@/lib/i18n";

export type StudentPassCheckoutNotice = "success" | "cancelled" | null;

export function DashboardStudentPassClient({
  state,
  checkout = null,
}: {
  state: StudentMembershipState;
  checkout?: StudentPassCheckoutNotice;
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

  const checkoutNoticeKey =
    checkout === "success"
      ? "dashboard.studentPassCheckoutSuccess"
      : checkout === "cancelled"
        ? "dashboard.studentPassCheckoutCancelled"
        : null;

  return (
    <div className="dashboard-panel student-pass-panel">
      <p className="student-pass-lead">
        {msg("dashboard.studentPassMaintains", locale)}
      </p>
      {checkoutNoticeKey ? (
        <p className="notice-box" role="status">
          {msg(checkoutNoticeKey, locale)}
        </p>
      ) : null}
      <DigitalMemberCard card={state.card} />
      {!state.card.isEntitled ? <StudentPassSubscribeButton /> : null}
    </div>
  );
}
