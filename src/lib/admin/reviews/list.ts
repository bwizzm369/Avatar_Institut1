import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { normalizeWhitespace } from "@/lib/admin/import/normalize";
import type { AdminReview } from "@/lib/reviews/types";

export async function listAdminReviews(searchQuery = ""): Promise<{
  reviews: AdminReview[];
  query: string;
}> {
  const query = normalizeWhitespace(searchQuery);
  if (!isSupabaseConfigured()) {
    return { reviews: [], query };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("reviews")
    .select(
      "id, author_name, author_title_en, author_title_ar, quote_en, quote_ar, is_published, sort_order, created_at, updated_at, profile_id, rating, moderation_status, reviewed_at, reviewed_by",
    )
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error || !data) {
    return { reviews: [], query };
  }

  const reviews = query
    ? data.filter((row) => {
        const hay =
          `${row.author_name} ${row.author_title_en} ${row.author_title_ar} ${row.quote_en} ${row.quote_ar}`.toLowerCase();
        return hay.includes(query.toLowerCase());
      })
    : data;

  return { reviews: reviews as AdminReview[], query };
}

export async function getAdminReviewById(
  id: string,
): Promise<AdminReview | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("reviews")
    .select(
      "id, author_name, author_title_en, author_title_ar, quote_en, quote_ar, is_published, sort_order, created_at, updated_at, profile_id, rating, moderation_status, reviewed_at, reviewed_by",
    )
    .eq("id", id)
    .maybeSingle();
  return (data as AdminReview | null) ?? null;
}
