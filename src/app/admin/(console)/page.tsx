import type { Metadata } from "next";
import Link from "next/link";
import { getAdminDashboardStats } from "@/lib/admin/stats";

export const metadata: Metadata = {
  title: { absolute: "Dashboard · Admin · Avatar Institut" },
};

function formatStatValue(value: number | null, hint: string | null): string {
  if (value === null) {
    return hint ?? "Not available";
  }
  return String(value);
}

export default async function AdminDashboardPage() {
  const { cards } = await getAdminDashboardStats();

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <h1>Dashboard</h1>
        <p>Avatar Institut back-office overview.</p>
      </header>

      <section className="admin-stat-grid" aria-label="Key metrics">
        {cards.map((card) => (
          <article key={card.id} className="admin-stat-card">
            <p className="admin-stat-label">{card.label}</p>
            <p
              className={
                card.value === null
                  ? "admin-stat-value admin-stat-value-muted"
                  : "admin-stat-value"
              }
            >
              {formatStatValue(card.value, card.hint)}
            </p>
            {card.value !== null && card.hint ? (
              <p className="admin-stat-hint">{card.hint}</p>
            ) : null}
          </article>
        ))}
      </section>

      <section className="admin-panel" aria-label="Quick links">
        <h2>Console</h2>
        <ul className="admin-quick-links">
          <li>
            <Link href="/admin/courses">Courses</Link>
          </li>
          <li>
            <Link href="/admin/student-pass">Student Pass</Link>
          </li>
          <li>
            <Link href="/admin/students">Students / Import</Link>
          </li>
          <li>
            <Link href="/admin/consultations">Consultations</Link>
          </li>
          <li>
            <Link href="/admin/reviews">Reviews</Link>
          </li>
        </ul>
      </section>
    </div>
  );
}
