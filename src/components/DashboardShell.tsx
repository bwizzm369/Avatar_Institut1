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
    <section className="section">
      <div className="container">
        <div className="stack-lg" style={{ marginBottom: "1.5rem" }}>
          <h1 className="display display-lg">{msg(titleKey, locale)}</h1>
          <div className="notice-box">{msg(noticeKey, locale)}</div>
        </div>
        <div className="dashboard-layout">
          <DashboardNav />
          {children}
        </div>
      </div>
    </section>
  );
}
