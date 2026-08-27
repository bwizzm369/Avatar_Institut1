"use server";

import { getAdminAccess } from "@/lib/admin/access";
import { commitLegacyImport, buildErrorCsv } from "@/lib/admin/import/commit";
import { parseImportBuffer } from "@/lib/admin/import/parse";
import {
  applyConfirmImportGuards,
  buildPreviewReport,
} from "@/lib/admin/import/preview";
import type {
  ConfirmImportMode,
  CourseMatch,
  ImportCommitResult,
  PreviewReport,
  PreviewRow,
} from "@/lib/admin/import/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type PreviewActionResult =
  | { ok: true; report: PreviewReport }
  | { ok: false; error: string; report?: PreviewReport };

export type ConfirmActionResult =
  | { ok: true; result: ImportCommitResult; errorCsv: string }
  | { ok: false; error: string; result?: ImportCommitResult; errorCsv?: string };

async function requireAdminClient() {
  const access = await getAdminAccess();
  if (access.status !== "ok") {
    return { error: "Access denied." as const, client: null };
  }
  const client = await createServerSupabaseClient();
  return { error: null, client };
}

async function loadCourses(client: Awaited<ReturnType<typeof createServerSupabaseClient>>): Promise<CourseMatch[]> {
  const { data } = await client
    .from("courses")
    .select("id, title_en, title_ar");
  return (data ?? []).map((course) => ({
    id: course.id,
    titleEn: course.title_en,
    titleAr: course.title_ar,
  }));
}

async function loadExistingFingerprints(
  client: Awaited<ReturnType<typeof createServerSupabaseClient>>,
): Promise<Set<string>> {
  const { data } = await client
    .from("legacy_course_completions")
    .select("import_fingerprint");
  return new Set((data ?? []).map((row) => row.import_fingerprint));
}

async function loadExistingEmails(
  client: Awaited<ReturnType<typeof createServerSupabaseClient>>,
): Promise<Set<string>> {
  const { data } = await client
    .from("legacy_students")
    .select("email")
    .not("email", "is", null);
  return new Set(
    (data ?? [])
      .map((row) => row.email)
      .filter((email): email is string => Boolean(email)),
  );
}

export async function previewImportAction(
  formData: FormData,
): Promise<PreviewActionResult> {
  const gate = await requireAdminClient();
  if (gate.error || !gate.client) {
    return { ok: false, error: gate.error ?? "Access denied." };
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, error: "No file uploaded." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const parsed = parseImportBuffer(buffer, file.name || "upload.csv");

  if (!parsed.ok) {
    return {
      ok: false,
      error: parsed.errors[0] ?? "Invalid file.",
      report: {
        ok: false,
        fileName: parsed.fileName,
        totalRows: 0,
        readyCount: 0,
        warningCount: 0,
        errorCount: 0,
        duplicateCount: 0,
        existingCount: 0,
        invalidCount: 0,
        rows: [],
        parseErrors: parsed.errors,
      },
    };
  }

  const courses = await loadCourses(gate.client);
  const existingFingerprints = await loadExistingFingerprints(gate.client);
  const existingEmails = await loadExistingEmails(gate.client);
  const report = buildPreviewReport({
    fileName: parsed.fileName,
    rows: parsed.rows,
    courses,
    existingFingerprints,
    existingEmails,
  });

  return { ok: true, report };
}

export async function confirmImportAction(input: {
  rows: PreviewRow[];
  mode: ConfirmImportMode;
}): Promise<ConfirmActionResult> {
  const gate = await requireAdminClient();
  if (gate.error || !gate.client) {
    return { ok: false, error: gate.error ?? "Access denied." };
  }

  if (!Array.isArray(input.rows) || input.rows.length === 0) {
    return { ok: false, error: "Nothing to import. Run preview first." };
  }

  if (input.mode !== "ready_only" && input.mode !== "ready_and_warnings") {
    return { ok: false, error: "Invalid import mode." };
  }

  // Re-validate emails + fingerprints against DB before write (server-side).
  const existingFingerprints = await loadExistingFingerprints(gate.client);
  const existingEmails = await loadExistingEmails(gate.client);
  const rows: PreviewRow[] = applyConfirmImportGuards(input.rows, {
    existingEmails,
    existingFingerprints,
  });

  const result = await commitLegacyImport({
    client: gate.client,
    rows,
    mode: input.mode,
  });

  const errorCsv = buildErrorCsv(result.errorRows);

  if (!result.ok) {
    return {
      ok: false,
      error: result.error ?? "Import failed.",
      result,
      errorCsv,
    };
  }

  return { ok: true, result, errorCsv };
}
