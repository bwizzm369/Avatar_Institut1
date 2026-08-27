import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CourseFormClient } from "@/components/admin/CourseFormClient";
import { getAdminCourseById } from "@/lib/admin/courses/list";
import { courseRowToFormDefaults } from "@/lib/admin/courses/preview";

export const metadata: Metadata = {
  title: { absolute: "Edit Course · Admin · Avatar Institut" },
};

export default async function AdminEditCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const course = await getAdminCourseById(courseId);
  if (!course) notFound();

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <h1>Edit Course</h1>
        <p>
          <Link href={`/admin/courses/${course.id}`}>← Preview</Link>
          {" · "}
          <Link href="/admin/courses">All courses</Link>
        </p>
      </header>
      <section className="admin-panel">
        <CourseFormClient
          mode="edit"
          courseId={course.id}
          initial={courseRowToFormDefaults(course)}
        />
      </section>
    </div>
  );
}
