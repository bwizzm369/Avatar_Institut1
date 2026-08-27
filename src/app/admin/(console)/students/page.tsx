import type { Metadata } from "next";
import { Suspense } from "react";
import { StudentsClient } from "@/components/admin/StudentsClient";
import { listAdminStudents } from "@/lib/admin/students/list";

export const metadata: Metadata = {
  title: { absolute: "Students · Admin · Avatar Institut" },
};

export default async function AdminStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const { students, query } = await listAdminStudents(params.q ?? "");

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <h1>Students</h1>
        <p>
          Auth accounts and historical legacy students. Phone and notes stay
          admin-private and are never shown here.
        </p>
      </header>
      <Suspense fallback={null}>
        <StudentsClient students={students} initialQuery={query} />
      </Suspense>
    </div>
  );
}
