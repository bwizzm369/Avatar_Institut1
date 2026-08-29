"use client";

import { DashboardNav } from "@/components/DashboardNav";
import { useLocale } from "@/components/LocaleProvider";
import { msg } from "@/lib/i18n";
import type { ReactNode } from "react";

export function DashboardShell({
  titleKey,
  noticeKey = "dashboard.notice",
  children,
}: {
  titleKey: string;
  noticeKey?: string;
  children: ReactNode;
}) {
  const { locale } = useLocale();

  return (
    <section className="section dashboard-shell">
      <div className="container">
        <header className="dashboard-header">
          <p className="eyebrow">{msg("nav.dashboard", locale)}</p>
          <h1 className="display display-lg">{msg(titleKey, locale)}</h1>
          <div className="section-rule" aria-hidden="true" />
          <p className="dashboard-lead muted">{msg(noticeKey, locale)}</p>
        </header>
        <div className="dashboard-layout">
          <DashboardNav />
          {children}
        </div>
      </div>
    </section>
  );
}
