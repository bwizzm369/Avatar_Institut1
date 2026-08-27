import type { Metadata } from "next";
import { Suspense } from "react";
import { CertificatesClient } from "@/components/admin/CertificatesClient";
import { loadAdminCertificatesPage } from "@/lib/admin/certificates/load";
import { isCertificatePdfPreviewEnvironment } from "@/lib/certificates/pdf/preview-env";

export const metadata: Metadata = {
  title: { absolute: "Certificates · Admin · Avatar Institut" },
};

export default async function AdminCertificatesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    sq?: string;
    holder?: string;
    item?: string;
  }>;
}) {
  const params = await searchParams;
  const data = await loadAdminCertificatesPage({
    certificateQuery: params.q ?? "",
    studentQuery: params.sq ?? "",
    holderKey: params.holder,
    itemKey: params.item,
  });

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <h1>Certificates</h1>
        <p>
          Official certificates. Search existing records, preview snapshots,
          then issue one official certificate. Revocation is not available yet.
        </p>
      </header>

      <section className="admin-stat-grid" aria-label="Certificate overview">
        <article className="admin-stat-card">
          <p className="admin-stat-label">Total</p>
          <p className="admin-stat-value">{data.stats.total}</p>
        </article>
        <article className="admin-stat-card">
          <p className="admin-stat-label">Issued</p>
          <p className="admin-stat-value">{data.stats.issued}</p>
        </article>
        <article className="admin-stat-card">
          <p className="admin-stat-label">Revoked</p>
          <p className="admin-stat-value">{data.stats.revoked}</p>
        </article>
      </section>

      <Suspense fallback={null}>
        <CertificatesClient
          data={data}
          pdfPreviewEnabled={isCertificatePdfPreviewEnvironment()}
        />
      </Suspense>
    </div>
  );
}
