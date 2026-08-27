import type { Metadata } from "next";
import Link from "next/link";
import { ImportClient } from "@/components/admin/ImportClient";

export const metadata: Metadata = {
  title: { absolute: "Import Students · Admin · Avatar Institut" },
};

export default function AdminImportPage() {
  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <h1>Import Students</h1>
        <p>
          <Link href="/admin/students">← Back to students</Link>
        </p>
        <p>
          Upload historical Excel or CSV data, preview validation, then confirm
          before writing anything to Supabase. Creates new legacy students or
          attaches new historical completions to an existing email — no Auth
          accounts, Student Pass, or certificates.
        </p>
      </header>
      <ImportClient />
    </div>
  );
}
