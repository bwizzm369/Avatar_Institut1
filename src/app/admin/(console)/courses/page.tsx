import type { Metadata } from "next";
import { Suspense } from "react";
import { CoursesListClient } from "@/components/admin/CoursesListClient";
import { listAdminCourses } from "@/lib/admin/courses/list";

export const metadata: Metadata = {
  title: { absolute: "Courses · Admin · Avatar Institut" },
};

export default async function AdminCoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const { courses, query } = await listAdminCourses(params.q ?? "");

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <h1>Courses</h1>
        <p>
          Official Avatar Institut course registry. Add courses manually or
          import Excel/CSV from the academy. No titles or prices are invented
          here.
        </p>
      </header>
      <Suspense fallback={null}>
        <CoursesListClient courses={courses} initialQuery={query} />
      </Suspense>
    </div>
  );
}
