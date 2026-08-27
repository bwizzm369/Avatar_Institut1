import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { normalizeWhitespace } from "@/lib/admin/import/normalize";
import type { CourseRow } from "@/types/database";

export type AdminCourseListItem = Pick<
  CourseRow,
  | "id"
  | "slug"
  | "title_ar"
  | "title_en"
  | "price_cents"
  | "currency"
  | "is_published"
  | "is_for_sale"
  | "student_pass_included"
  | "student_pass_discount_percent"
  | "legacy_only"
  | "updated_at"
>;

export async function listAdminCourses(searchQuery = ""): Promise<{
  courses: AdminCourseListItem[];
  query: string;
}> {
  const query = normalizeWhitespace(searchQuery);
  if (!isSupabaseConfigured()) {
    return { courses: [], query };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("courses")
    .select(
      "id, slug, title_ar, title_en, price_cents, currency, is_published, is_for_sale, student_pass_included, student_pass_discount_percent, legacy_only, updated_at",
    )
    .order("updated_at", { ascending: false });

  if (error || !data) {
    return { courses: [], query };
  }

  const courses = query
    ? data.filter((course) => {
        const hay =
          `${course.title_ar} ${course.title_en} ${course.slug}`.toLowerCase();
        return hay.includes(query.toLowerCase());
      })
    : data;

  return { courses, query };
}

export async function getAdminCourseById(
  id: string,
): Promise<CourseRow | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("courses")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as CourseRow | null) ?? null;
}

export async function listCourseRegistryEntries(): Promise<
  Array<{ id: string; slug: string; title_ar: string; title_en: string }>
> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("courses")
    .select("id, slug, title_ar, title_en");
  return data ?? [];
}
