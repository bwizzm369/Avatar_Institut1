"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { setCoursePublishedAction } from "@/app/admin/(console)/courses/actions";
import type { AdminCourseListItem } from "@/lib/admin/courses/list";
import { formatCentsForInput } from "@/lib/admin/courses/normalize";
import { formatStudentPassBenefitLabel } from "@/lib/pricing/student-pass-price";

function flag(value: boolean): string {
  return value ? "Yes" : "No";
}

export function CoursesListClient({
  courses,
  initialQuery,
}: {
  courses: AdminCourseListItem[];
  initialQuery: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [pendingId, setPendingId] = useState<string | null>(null);

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = query.trim();
    if (trimmed) params.set("q", trimmed);
    else params.delete("q");
    const qs = params.toString();
    router.push(qs ? `/admin/courses?${qs}` : "/admin/courses");
  }

  async function togglePublish(course: AdminCourseListItem) {
    setPendingId(course.id);
    await setCoursePublishedAction(course.id, !course.is_published);
    setPendingId(null);
    router.refresh();
  }

  return (
    <div className="admin-courses">
      <div className="admin-toolbar">
        <form className="admin-search" onSubmit={onSearch}>
          <label htmlFor="course-search" className="visually-hidden">
            Search courses
          </label>
          <input
            id="course-search"
            type="search"
            placeholder="Search by Arabic title, English title, or slug"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button type="submit" className="admin-btn-primary admin-btn-inline">
            Search
          </button>
        </form>
        <div className="admin-toolbar-actions">
          <Link href="/admin/courses/new" className="admin-btn-primary admin-btn-inline">
            Add Course
          </Link>
          <Link href="/admin/courses/import" className="admin-btn-ghost">
            Import Courses
          </Link>
        </div>
      </div>

      <div className="admin-table-wrap admin-panel">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Arabic title</th>
              <th>English title</th>
              <th>Price</th>
              <th>Published</th>
              <th>For sale</th>
              <th>Student Pass</th>
              <th>Historical</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {courses.length === 0 ? (
              <tr>
                <td colSpan={8} className="admin-table-empty">
                  No courses in the registry yet.
                </td>
              </tr>
            ) : (
              courses.map((course) => (
                <tr key={course.id}>
                  <td>{course.title_ar}</td>
                  <td>{course.title_en || "—"}</td>
                  <td>
                    {course.price_cents == null
                      ? "—"
                      : `${formatCentsForInput(course.price_cents)} ${course.currency}`}
                  </td>
                  <td>{flag(course.is_published)}</td>
                  <td>{flag(course.is_for_sale)}</td>
                  <td>
                    {formatStudentPassBenefitLabel({
                      studentPassIncluded: course.student_pass_included,
                      studentPassDiscountPercent:
                        course.student_pass_discount_percent ?? 0,
                    })}
                  </td>
                  <td>{flag(course.legacy_only)}</td>
                  <td>
                    <div className="admin-row-actions">
                      <Link href={`/admin/courses/${course.id}`}>Preview</Link>
                      <Link href={`/admin/courses/${course.id}/edit`}>Edit</Link>
                      <button
                        type="button"
                        className="admin-link-button"
                        disabled={pendingId === course.id}
                        onClick={() => togglePublish(course)}
                      >
                        {course.is_published ? "Unpublish" : "Publish"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
