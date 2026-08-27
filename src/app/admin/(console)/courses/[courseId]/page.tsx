import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { setCoursePublishedAction } from "@/app/admin/(console)/courses/actions";
import { getAdminCourseById } from "@/lib/admin/courses/list";
import { formatCentsForInput } from "@/lib/admin/courses/normalize";

export const metadata: Metadata = {
  title: { absolute: "Course Preview · Admin · Avatar Institut" },
};

function Flag({ value, label }: { value: boolean; label: string }) {
  return (
    <li>
      <strong>{label}:</strong> {value ? "Yes" : "No"}
    </li>
  );
}

export default async function AdminCoursePreviewPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const course = await getAdminCourseById(courseId);
  if (!course) notFound();

  const isPublished = course.is_published;

  async function togglePublish() {
    "use server";
    const result = await setCoursePublishedAction(courseId, !isPublished);
    if (result.ok) {
      redirect(`/admin/courses/${courseId}`);
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <h1>Course preview</h1>
        <p>
          <Link href="/admin/courses">← Back to courses</Link>
          {" · "}
          <Link href={`/admin/courses/${course.id}/edit`}>Edit</Link>
        </p>
      </header>

      <section className="admin-panel admin-course-preview">
        <h2 dir="rtl" lang="ar">
          {course.title_ar}
        </h2>
        {course.title_en ? (
          <p className="admin-course-en">{course.title_en}</p>
        ) : null}
        <p className="admin-placeholder">Slug: {course.slug}</p>

        {course.description_ar ? (
          <div className="admin-preview-block" dir="rtl" lang="ar">
            <h3>الوصف</h3>
            <p>{course.description_ar}</p>
          </div>
        ) : null}
        {course.description_en ? (
          <div className="admin-preview-block">
            <h3>Description</h3>
            <p>{course.description_en}</p>
          </div>
        ) : null}

        {course.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={course.image_url} alt="" className="admin-course-image" />
        ) : null}

        <ul className="admin-result-list">
          <li>
            <strong>Price:</strong>{" "}
            {course.price_cents == null
              ? "Not set"
              : `${formatCentsForInput(course.price_cents)} ${course.currency}`}
          </li>
          <Flag label="Published" value={course.is_published} />
          <Flag label="For sale" value={course.is_for_sale} />
          <Flag
            label="Student Pass included"
            value={course.student_pass_included}
          />
          <li>
            <strong>Student Pass discount:</strong>{" "}
            {course.student_pass_discount_percent ?? 0}%
            {course.student_pass_included
              ? " (ignored while included)"
              : ""}
          </li>
          <Flag label="Historical" value={course.legacy_only} />
        </ul>

        <form action={togglePublish}>
          <button type="submit" className="admin-btn-primary admin-btn-inline">
            {course.is_published ? "Unpublish" : "Publish"}
          </button>
        </form>
      </section>
    </div>
  );
}
