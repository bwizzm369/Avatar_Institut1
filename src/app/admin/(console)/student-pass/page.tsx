import type { Metadata } from "next";
import { Suspense } from "react";
import { StudentPassClient } from "@/components/admin/StudentPassClient";
import { listAdminStudentPassMembers } from "@/lib/admin/student-pass/list";

export const metadata: Metadata = {
  title: { absolute: "Student Pass · Admin · Avatar Institut" },
};

export default async function AdminStudentPassPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const data = await listAdminStudentPassMembers(params.q ?? "");

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <h1>Student Pass</h1>
        <p className="admin-kicker">Digital Membership / العضوية الرقمية</p>
        <p>
          Student Pass maintains your active member status within Avatar
          Institut. Manual and offline subscription management. Stripe billing
          is not connected yet.
        </p>
      </header>

      <section className="admin-stat-grid" aria-label="Student Pass overview">
        <article className="admin-stat-card">
          <p className="admin-stat-label">Student Pass</p>
          <p className="admin-stat-value">{data.priceLabel}</p>
          <p className="admin-stat-hint">{data.priceEur} EUR billed monthly (later)</p>
        </article>
        <article className="admin-stat-card">
          <p className="admin-stat-label">Active members</p>
          <p className="admin-stat-value">{data.activeMembers}</p>
        </article>
        <article className="admin-stat-card">
          <p className="admin-stat-label">Inactive members</p>
          <p className="admin-stat-value">{data.inactiveMembers}</p>
        </article>
      </section>

      <Suspense fallback={null}>
        <StudentPassClient members={data.members} initialQuery={data.query} />
      </Suspense>
    </div>
  );
}
