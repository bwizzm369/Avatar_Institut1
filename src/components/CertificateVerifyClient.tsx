"use client";

import { Logo } from "@/components/Logo";
import { useLocale } from "@/components/LocaleProvider";
import {
  courseTitleForLocale,
  formatIssuedAtForLocale,
  type CertificateVerifyView,
} from "@/lib/certificates/verify";
import { msg } from "@/lib/i18n";

export function CertificateVerifyClient({
  view,
}: {
  view: CertificateVerifyView;
}) {
  const { locale } = useLocale();
  const certificate = view.certificate;
  const statusKey =
    view.kind === "issued"
      ? "verify.valid"
      : view.kind === "revoked"
        ? "verify.revoked"
        : "verify.notFound";

  return (
    <section className="section verify-section">
      <div className="container">
        <article className="verify-card" data-kind={view.kind}>
          <p className="eyebrow">{msg("verify.eyebrow", locale)}</p>
          <div className="verify-logo">
            <Logo variant="panel" />
          </div>
          <h1 className="verify-status">{msg(statusKey, locale)}</h1>

          {view.kind === "not_found" || !certificate ? (
            <p className="muted verify-body">
              {msg("verify.notFoundBody", locale)}
            </p>
          ) : (
            <>
              {view.kind === "revoked" ? (
                <p className="muted verify-body">
                  {msg("verify.revokedBody", locale)}
                </p>
              ) : null}
              <dl className="verify-fields">
                <div>
                  <dt>{msg("verify.number", locale)}</dt>
                  <dd className="verify-number">{certificate.certificateNumber}</dd>
                </div>
                <div>
                  <dt>{msg("verify.holder", locale)}</dt>
                  <dd>{certificate.holderDisplayName}</dd>
                </div>
                <div>
                  <dt>{msg("verify.course", locale)}</dt>
                  <dd>
                    {courseTitleForLocale(certificate, locale) || "—"}
                  </dd>
                </div>
                <div>
                  <dt>{msg("verify.issuedAt", locale)}</dt>
                  <dd>{formatIssuedAtForLocale(certificate.issuedAt, locale)}</dd>
                </div>
              </dl>
            </>
          )}

          <p className="verify-institute">{msg("verify.institute", locale)}</p>
        </article>
      </div>
    </section>
  );
}
