import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { isPublicReviewComplete } from "@/lib/reviews/display";
import type { PublicReview } from "@/lib/reviews/types";

export async function listPublishedReviews(): Promise<PublicReview[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("reviews")
    .select(
      "id, author_name, author_title_en, author_title_ar, quote_en, quote_ar, sort_order, rating",
    )
    .eq("is_published", true)
    .eq("moderation_status", "approved")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.filter(isPublicReviewComplete);
}
