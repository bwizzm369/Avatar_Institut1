"use client";

import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import {
  courseTitleForLocale,
  formatIssuedAtForLocale,
} from "@/lib/certificates/verify";
import {
  studentCertificatePdfPath,
  studentCertificateVerifyPath,
  type StudentCertificatesState,
} from "@/lib/certificates/student-view";
import { msg } from "@/lib/i18n";

export function DashboardCertificatesClient({
  state,
}: {
  state: StudentCertificatesState;
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

  if (state.certificates.length === 0) {
    return (
      <div className="dashboard-panel">
        <div className="empty-state">
          <div className="empty-state-mark" aria-hidden="true" />
          <h2 className="display display-sm">
            {msg("dashboard.certificatesTitle", locale)}
          </h2>
          <p>{msg("dashboard.certificatesEmpty", locale)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-panel">
      <ul className="certificate-list">
        {state.certificates.map((certificate) => {
          const statusKey =
            certificate.status === "revoked"
              ? "dashboard.certificateRevoked"
              : "dashboard.certificateIssued";
          return (
            <li
              key={certificate.certificateNumber}
              className="certificate-card course-list-item"
            >
              <div className="certificate-list-body">
                <p className="certificate-number">
                  {certificate.certificateNumber}
                </p>
                <h3 className="display display-sm">
                  {courseTitleForLocale(
                    {
                      courseTitleEn: certificate.courseTitleEn,
                      courseTitleAr: certificate.courseTitleAr,
                    },
                    locale,
                  )}
                </h3>
                <p className="muted">
                  {msg("verify.issuedAt", locale)}:{" "}
                  {formatIssuedAtForLocale(certificate.issuedAt, locale)}
                </p>
                <p className="muted">{msg(statusKey, locale)}</p>
              </div>
              <div className="certificate-list-actions">
                {state.officialPdfAvailable ? (
                  <a
                    href={studentCertificatePdfPath(
                      certificate.certificateNumber,
                    )}
                    className="btn btn-primary"
                  >
                    {msg("dashboard.certificateDownload", locale)}
                  </a>
                ) : null}
                <Link
                  href={studentCertificateVerifyPath(
                    certificate.certificateNumber,
                  )}
                  className="btn btn-ghost"
                >
                  {msg("dashboard.certificateView", locale)}
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
