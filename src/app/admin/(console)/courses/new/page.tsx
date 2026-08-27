import type { Metadata } from "next";
import Link from "next/link";
import { CourseFormClient } from "@/components/admin/CourseFormClient";

export const metadata: Metadata = {
  title: { absolute: "Add Course · Admin · Avatar Institut" },
};

export default function AdminNewCoursePage() {
  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <h1>Add Course</h1>
        <p>
          <Link href="/admin/courses">← Back to courses</Link>
        </p>
      </header>
      <section className="admin-panel">
        <CourseFormClient
          mode="create"
          initial={{
            title_ar: "",
            title_en: "",
            description_ar: "",
            description_en: "",
            slug: "",
            price: "",
            currency: "EUR",
            is_published: false,
            is_for_sale: false,
            student_pass_included: false,
            student_pass_discount_percent: "0",
            legacy_only: false,
            image_url: "",
          }}
        />
      </section>
    </div>
  );
}
