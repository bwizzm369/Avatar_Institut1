import type { SupabaseClient } from "@supabase/supabase-js";
import type { CheckoutCourseSource } from "@/lib/stripe/checkout";
import type { Database } from "@/types/database";

/**
 * Reloads course commercial fields from Supabase for Checkout.
 * Never uses browser-supplied prices or discount percents.
 */
export async function loadCheckoutCourseSources(
  client: SupabaseClient<Database>,
  slugs: string[],
): Promise<CheckoutCourseSource[]> {
  if (slugs.length === 0) return [];

  const { data, error } = await client
    .from("courses")
    .select(
      "id, slug, title_en, price_cents, currency, student_pass_included, student_pass_discount_percent",
    )
    .in("slug", slugs);

  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    id: row.id,
    slug: row.slug,
    titleEn: row.title_en,
    priceCents: row.price_cents,
    currency: row.currency,
    studentPassIncluded: row.student_pass_included,
    studentPassDiscountPercent: row.student_pass_discount_percent ?? 0,
  }));
}
