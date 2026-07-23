"use client";

import { DashboardNav } from "@/components/DashboardNav";
import { useLocale } from "@/components/LocaleProvider";
import { msg } from "@/lib/i18n";

export default function DashboardCertificatesPage() {
  const { locale } = useLocale();

  return (
    <section className="section">
      <div className="container">
        <div className="stack-lg" style={{ marginBottom: "1.5rem" }}>
          <h1 className="display display-lg">
            {msg("dashboard.certificatesTitle", locale)}
          </h1>
          <div className="notice-box">{msg("dashboard.notice", locale)}</div>
        </div>
        <div className="dashboard-layout">
          <DashboardNav />
          <div className="dashboard-panel">
            <div className="empty-state">
              {msg("dashboard.certificatesEmpty", locale)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
