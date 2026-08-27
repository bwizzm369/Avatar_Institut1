import type { SupabaseClient } from "@supabase/supabase-js";
import { ensureUniqueSlug } from "@/lib/admin/courses/slug";
import type {
  CourseImportCommitResult,
  CoursePreviewRow,
} from "@/lib/admin/courses/types";
import type { Database } from "@/types/database";

type AdminClient = SupabaseClient<Database>;

/**
 * Commits READY + WARNING rows. Never imports ERROR or DUPLICATE.
 * Idempotent via unique slug + pre-checks (duplicates skipped).
 */
export async function commitCourseImport(options: {
  client: AdminClient;
  rows: CoursePreviewRow[];
  mode: "ready_only" | "ready_and_warnings";
}): Promise<CourseImportCommitResult> {
  const { client, rows, mode } = options;
  const importable = rows.filter((row) => {
    if (row.status === "READY") return true;
    if (row.status === "WARNING" && mode === "ready_and_warnings") return true;
    return false;
  });

  let coursesCreated = 0;
  let duplicatesSkipped = rows.filter((r) => r.status === "DUPLICATE").length;
  const errorsSkipped = rows.filter((r) => r.status === "ERROR").length;
  let warningsImported = 0;

  const { data: existing } = await client.from("courses").select("slug");
  const taken = new Set((existing ?? []).map((c) => c.slug.toLowerCase()));

  try {
    for (const row of importable) {
      const slug = ensureUniqueSlug(row.slug, taken);
      if (taken.has(slug.toLowerCase()) && slug !== row.slug) {
        // ensureUniqueSlug already avoids collisions
      }
      if (
        (existing ?? []).some((c) => c.slug.toLowerCase() === row.slug.toLowerCase())
      ) {
        duplicatesSkipped += 1;
        continue;
      }

      const { error } = await client.from("courses").insert({
        slug,
        title_ar: row.titleAr,
        title_en: row.titleEn || "",
        description_ar: row.descriptionAr || "",
        description_en: row.descriptionEn || "",
        price_cents: row.priceCents,
        currency: row.currency,
        is_published: row.isPublished,
        is_for_sale: row.isForSale,
        student_pass_included: row.studentPassIncluded,
        student_pass_discount_percent: row.studentPassDiscountPercent,
        legacy_only: row.legacyOnly,
        image_url: row.imageUrl,
        is_demo: false,
      });

      if (error) {
        if (error.code === "23505") {
          duplicatesSkipped += 1;
          continue;
        }
        return {
          ok: false,
          error: "Failed to create course.",
          rowsProcessed: rows.length,
          coursesCreated,
          duplicatesSkipped,
          errorsSkipped,
          warningsImported,
        };
      }

      taken.add(slug.toLowerCase());
      coursesCreated += 1;
      if (row.status === "WARNING") warningsImported += 1;
    }

    return {
      ok: true,
      rowsProcessed: rows.length,
      coursesCreated,
      duplicatesSkipped,
      errorsSkipped,
      warningsImported,
    };
  } catch {
    return {
      ok: false,
      error: "Import failed unexpectedly.",
      rowsProcessed: rows.length,
      coursesCreated,
      duplicatesSkipped,
      errorsSkipped,
      warningsImported,
    };
  }
}
