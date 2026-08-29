import type { Metadata } from "next";
import { Suspense } from "react";
import { ConsultationsClient } from "@/components/admin/ConsultationsClient";
import { listAdminConsultationRequests } from "@/lib/admin/consultation/list";

export const metadata: Metadata = {
  title: { absolute: "Consultations · Admin · Avatar Institut" },
};

export default async function AdminConsultationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const params = await searchParams;
  const { requests, query, status } = await listAdminConsultationRequests({
    query: params.q ?? "",
    status: params.status ?? "",
  });

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <h1>Consultations</h1>
        <p>
          Public Consultation and Information requests. Personal details stay in
          this console and are never published.
        </p>
      </header>
      <Suspense fallback={null}>
        <ConsultationsClient
          requests={requests}
          initialQuery={query}
          initialStatus={status}
        />
      </Suspense>
    </div>
  );
}
