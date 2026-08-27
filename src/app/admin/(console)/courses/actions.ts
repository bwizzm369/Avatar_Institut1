"use server";

import { revalidatePath } from "next/cache";
import { getAdminAccess } from "@/lib/admin/access";
import { commitCourseImport } from "@/lib/admin/courses/commit";
import { listCourseRegistryEntries } from "@/lib/admin/courses/list";
import { parseCourseImportBuffer } from "@/lib/admin/courses/parse-file";
import {
  buildCoursePreviewReport,
  validateManualCourseForm,
} from "@/lib/admin/courses/preview";
import { ensureUniqueSlug, generateCourseSlug } from "@/lib/admin/courses/slug";
import type {
  AdminCourseFormInput,
  CourseImportCommitResult,
  CoursePreviewReport,
  CoursePreviewRow,
} from "@/lib/admin/courses/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const access = await getAdminAccess();
  if (access.status !== "ok") {
    return { error: "Access denied." as const, client: null };
  }
  const client = await createServerSupabaseClient();
  return { error: null, client };
}

export type CoursePreviewActionResult =
  | { ok: true; report: CoursePreviewReport }
  | { ok: false; error: string; report?: CoursePreviewReport };

export type CourseConfirmActionResult =
  | { ok: true; result: CourseImportCommitResult }
  | { ok: false; error: string; result?: CourseImportCommitResult };

export type CourseMutationResult =
  | { ok: true; id: string }
  | { ok: false; error: string; fieldErrors?: string[] };

export async function previewCoursesImportAction(
  formData: FormData,
): Promise<CoursePreviewActionResult> {
  const gate = await requireAdmin();
  if (gate.error || !gate.client) {
    return { ok: false, error: gate.error ?? "Access denied." };
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, error: "No file uploaded." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const parsed = parseCourseImportBuffer(buffer, file.name || "upload.csv");
  if (!parsed.ok) {
    return {
      ok: false,
      error: parsed.errors[0] ?? "Invalid file.",
      report: {
        ok: false,
        sourceLabel: parsed.sourceLabel,
        totalRows: 0,
        readyCount: 0,
        warningCount: 0,
        errorCount: 0,
        duplicateCount: 0,
        rows: [],
        parseErrors: parsed.errors,
      },
    };
  }

  const registry = await listCourseRegistryEntries();
  const report = buildCoursePreviewReport({
    sourceLabel: parsed.sourceLabel,
    rows: parsed.rows,
    registry,
  });
  return { ok: true, report };
}

export async function confirmCoursesImportAction(input: {
  rows: CoursePreviewRow[];
  mode: "ready_only" | "ready_and_warnings";
}): Promise<CourseConfirmActionResult> {
  const gate = await requireAdmin();
  if (gate.error || !gate.client) {
    return { ok: false, error: gate.error ?? "Access denied." };
  }

  if (!Array.isArray(input.rows) || input.rows.length === 0) {
    return { ok: false, error: "Nothing to import. Run preview first." };
  }

  const registry = await listCourseRegistryEntries();
  // Re-check duplicates server-side before write.
  const refreshed = buildCoursePreviewReport({
    sourceLabel: "confirm",
    rows: input.rows.map((row) => ({
      title_ar: row.titleAr === "(missing)" ? "" : row.titleAr,
      title_en: row.titleEn,
      description_ar: row.descriptionAr,
      description_en: row.descriptionEn,
      slug: row.slug,
      price:
        row.priceCents == null ? "" : (row.priceCents / 100).toFixed(2),
      currency: row.currency,
      is_published: String(row.isPublished),
      is_for_sale: String(row.isForSale),
      student_pass_included: String(row.studentPassIncluded),
      legacy_only: String(row.legacyOnly),
      image_url: row.imageUrl ?? "",
    })),
    registry,
  });

  const result = await commitCourseImport({
    client: gate.client,
    rows: refreshed.rows,
    mode: input.mode,
  });

  revalidatePath("/admin/courses");
  revalidatePath("/courses");
  if (!result.ok) {
    return { ok: false, error: result.error ?? "Import failed.", result };
  }
  return { ok: true, result };
}

function formDataToInput(formData: FormData): AdminCourseFormInput {
  return {
    title_ar: String(formData.get("title_ar") ?? ""),
    title_en: String(formData.get("title_en") ?? ""),
    description_ar: String(formData.get("description_ar") ?? ""),
    description_en: String(formData.get("description_en") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    price: String(formData.get("price") ?? ""),
    currency: String(formData.get("currency") ?? "EUR"),
    is_published: formData.get("is_published") === "on",
    is_for_sale: formData.get("is_for_sale") === "on",
    student_pass_included: formData.get("student_pass_included") === "on",
    student_pass_discount_percent: String(
      formData.get("student_pass_discount_percent") ?? "0",
    ),
    legacy_only: formData.get("legacy_only") === "on",
    image_url: String(formData.get("image_url") ?? ""),
  };
}

export async function createCourseAction(
  formData: FormData,
): Promise<CourseMutationResult> {
  const gate = await requireAdmin();
  if (gate.error || !gate.client) {
    return { ok: false, error: gate.error ?? "Access denied." };
  }

  const input = formDataToInput(formData);
  const registry = await listCourseRegistryEntries();
  const validated = validateManualCourseForm(input, { registry });
  if (!validated.ok) {
    return {
      ok: false,
      error: "Validation failed.",
      fieldErrors: validated.errors,
    };
  }

  const taken = new Set(registry.map((c) => c.slug.toLowerCase()));
  const slug = ensureUniqueSlug(
    generateCourseSlug({
      titleAr: validated.values.titleAr,
      titleEn: validated.values.titleEn,
      explicitSlug: input.slug,
    }),
    taken,
  );

  const { data, error } = await gate.client
    .from("courses")
    .insert({
      slug,
      title_ar: validated.values.titleAr,
      title_en: validated.values.titleEn || "",
      description_ar: validated.values.descriptionAr || "",
      description_en: validated.values.descriptionEn || "",
      price_cents: validated.values.priceCents,
      currency: validated.values.currency,
      is_published: validated.values.isPublished,
      is_for_sale: validated.values.isForSale,
      student_pass_included: validated.values.studentPassIncluded,
      student_pass_discount_percent:
        validated.values.studentPassDiscountPercent,
      legacy_only: validated.values.legacyOnly,
      image_url: validated.values.imageUrl,
      is_demo: false,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: "Failed to create course." };
  }

  revalidatePath("/admin/courses");
  revalidatePath("/courses");
  return { ok: true, id: data.id };
}

export async function updateCourseAction(
  courseId: string,
  formData: FormData,
): Promise<CourseMutationResult> {
  const gate = await requireAdmin();
  if (gate.error || !gate.client) {
    return { ok: false, error: gate.error ?? "Access denied." };
  }

  const input = formDataToInput(formData);
  const registry = await listCourseRegistryEntries();
  const validated = validateManualCourseForm(input, {
    existingId: courseId,
    registry,
  });
  if (!validated.ok) {
    return {
      ok: false,
      error: "Validation failed.",
      fieldErrors: validated.errors,
    };
  }

  const taken = new Set(
    registry
      .filter((c) => c.id !== courseId)
      .map((c) => c.slug.toLowerCase()),
  );
  const slug = ensureUniqueSlug(
    generateCourseSlug({
      titleAr: validated.values.titleAr,
      titleEn: validated.values.titleEn,
      explicitSlug: input.slug || validated.values.slug,
    }),
    taken,
  );

  const { error } = await gate.client
    .from("courses")
    .update({
      slug,
      title_ar: validated.values.titleAr,
      title_en: validated.values.titleEn || "",
      description_ar: validated.values.descriptionAr || "",
      description_en: validated.values.descriptionEn || "",
      price_cents: validated.values.priceCents,
      currency: validated.values.currency,
      is_published: validated.values.isPublished,
      is_for_sale: validated.values.isForSale,
      student_pass_included: validated.values.studentPassIncluded,
      student_pass_discount_percent:
        validated.values.studentPassDiscountPercent,
      legacy_only: validated.values.legacyOnly,
      image_url: validated.values.imageUrl,
    })
    .eq("id", courseId);

  if (error) {
    return { ok: false, error: "Failed to update course." };
  }

  revalidatePath("/admin/courses");
  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath("/courses");
  revalidatePath(`/courses/${slug}`);
  return { ok: true, id: courseId };
}

export async function setCoursePublishedAction(
  courseId: string,
  published: boolean,
): Promise<CourseMutationResult> {
  const gate = await requireAdmin();
  if (gate.error || !gate.client) {
    return { ok: false, error: gate.error ?? "Access denied." };
  }

  const { error } = await gate.client
    .from("courses")
    .update({ is_published: published })
    .eq("id", courseId);

  if (error) {
    return { ok: false, error: "Failed to update publish state." };
  }

  revalidatePath("/admin/courses");
  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath("/courses");
  return { ok: true, id: courseId };
}
