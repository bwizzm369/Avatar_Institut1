import type { Metadata } from "next";
import Link from "next/link";
import { CoursesImportClient } from "@/components/admin/CoursesImportClient";

export const metadata: Metadata = {
  title: { absolute: "Import Courses · Admin · Avatar Institut" },
};

export default function AdminCoursesImportPage() {
  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <h1>Import Courses</h1>
        <p>
          <Link href="/admin/courses">← Back to courses</Link>
        </p>
        <p>
          Upload an Excel or CSV file from the academy. Preview and confirm
          before any registry write. Google Sheets can be plugged into the same
          validation pipeline later.
        </p>
      </header>
      <CoursesImportClient />
    </div>
  );
}
