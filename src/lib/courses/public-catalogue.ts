import {
  courseSlugsEqual,
  resolveCourseSlugParam,
} from "@/lib/courses/course-slug";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Course } from "@/types";
import type { CourseRow } from "@/types/database";

export type PublicCatalogueRow = Pick<
  CourseRow,
  | "id"
  | "slug"
  | "title_en"
  | "title_ar"
  | "summary_en"
  | "summary_ar"
  | "description_en"
  | "description_ar"
  | "price_cents"
  | "currency"
  | "duration_weeks"
  | "level_en"
  | "level_ar"
  | "is_published"
  | "image_url"
  | "is_for_sale"
  | "student_pass_included"
  | "student_pass_discount_percent"
  | "legacy_only"
>;

export const PUBLIC_CATALOGUE_COLUMNS =
  "id, slug, title_en, title_ar, summary_en, summary_ar, description_en, description_ar, price_cents, currency, duration_weeks, level_en, level_ar, is_published, image_url, is_for_sale, student_pass_included, student_pass_discount_percent, legacy_only";

/** Public storefront: published and not historical-only. */
export function isVisibleInPublicCatalogue(
  row: Pick<PublicCatalogueRow, "is_published" | "legacy_only">,
): boolean {
  return row.is_published === true && row.legacy_only !== true;
}

export function asCourseCurrency(value: string): Course["currency"] {
  const upper = value.trim().toUpperCase();
  if (upper === "EUR" || upper === "USD" || upper === "CHF") return upper;
  return "EUR";
}

function fallbackPair(en: string, ar: string): Course["title"] {
  const english = en.trim();
  const arabic = ar.trim();
  return {
    en: english || arabic,
    ar: arabic || english,
  };
}

export function hasPublicCourseTitle(
  row: Pick<PublicCatalogueRow, "title_en" | "title_ar">,
): boolean {
  return Boolean(row.title_en.trim() || row.title_ar.trim());
}

export function publicImageUrl(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("/")) return trimmed;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      return trimmed;
    }
  } catch {
    return null;
  }
  return null;
}

export function mapPublicCourseRow(row: PublicCatalogueRow): Course {
  const descriptionEn = row.description_en.trim();
  const descriptionAr = row.description_ar.trim();
  const summaryEn = row.summary_en.trim() || descriptionEn;
  const summaryAr = row.summary_ar.trim() || descriptionAr;
  const title = fallbackPair(row.title_en, row.title_ar);
  const description = fallbackPair(descriptionEn, descriptionAr);
  const summary = fallbackPair(summaryEn, summaryAr);

  return {
    id: row.id,
    slug: row.slug,
    title,
    summary,
    description,
    priceCents: row.price_cents ?? 0,
    currency: asCourseCurrency(row.currency),
    durationWeeks: row.duration_weeks,
    level: { en: row.level_en, ar: row.level_ar },
    isDemo: false,
    modules: [],
    skills: { en: [], ar: [] },
    imageUrl: publicImageUrl(row.image_url),
    studentPassIncluded: row.student_pass_included,
    studentPassDiscountPercent: row.student_pass_discount_percent ?? 0,
  };
}

export function selectPublicCatalogueCourses(
  rows: PublicCatalogueRow[],
): Course[] {
  return rows
    .filter(isVisibleInPublicCatalogue)
    .filter(hasPublicCourseTitle)
    .map(mapPublicCourseRow)
    .sort((a, b) => a.title.en.localeCompare(b.title.en, "en"));
}

export function resolvePublicCourseBySlug(
  rows: PublicCatalogueRow[],
  slug: string,
): Course | null {
  const normalized = resolveCourseSlugParam(slug);
  if (!normalized) return null;
  const row = rows.find((item) => courseSlugsEqual(item.slug, normalized));
  if (!row || !isVisibleInPublicCatalogue(row) || !hasPublicCourseTitle(row)) {
    return null;
  }
  return mapPublicCourseRow(row);
}

export async function listPublicCourses(): Promise<Course[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("courses")
    .select(PUBLIC_CATALOGUE_COLUMNS)
    .eq("is_published", true)
    .eq("legacy_only", false)
    .order("title_en", { ascending: true });

  if (error || !data) return [];
  return selectPublicCatalogueCourses(data);
}

export async function getPublicCourseBySlug(
  slug: string,
): Promise<Course | null> {
  const normalized = resolveCourseSlugParam(slug);
  if (!normalized) return null;
  if (!isSupabaseConfigured()) return null;

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("courses")
    .select(PUBLIC_CATALOGUE_COLUMNS)
    .eq("slug", normalized)
    .maybeSingle();

  if (error || !data) return null;
  return resolvePublicCourseBySlug([data], normalized);
}
