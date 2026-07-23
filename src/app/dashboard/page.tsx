"use client";

import { DashboardNav } from "@/components/DashboardNav";
import { useLocale } from "@/components/LocaleProvider";
import { msg } from "@/lib/i18n";

export default function DashboardPage() {
  const { locale } = useLocale();

  return (
    <section className="section">
      <div className="container">
        <div className="stack-lg" style={{ marginBottom: "1.5rem" }}>
          <h1 className="display display-lg">{msg("dashboard.title", locale)}</h1>
          <div className="notice-box">{msg("dashboard.notice", locale)}</div>
        </div>
        <div className="dashboard-layout">
          <DashboardNav />
          <div className="dashboard-panel stack-lg">
            <h2 className="display display-md">{msg("dashboard.welcome", locale)}</h2>
            <p className="muted">{msg("dashboard.intro", locale)}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
