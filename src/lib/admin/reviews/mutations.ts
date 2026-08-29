import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  isReviewModerationStatus,
  publicationFieldsForStatus,
} from "@/lib/reviews/moderation";
import { validateReviewForm } from "@/lib/reviews/validation";
import type { ReviewFormInput, ReviewModerationStatus } from "@/lib/reviews/types";

type AdminDb = SupabaseClient<Database>;

export type ReviewMutationResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

function rowFromValues(values: NonNullable<ReturnType<typeof validateReviewForm>["values"]>) {
  return {
    author_name: values.authorName,
    author_title_en: values.authorTitleEn,
    author_title_ar: values.authorTitleAr,
    quote_en: values.quoteEn,
    quote_ar: values.quoteAr,
    is_published: values.isPublished,
    sort_order: values.sortOrder,
  };
}

export async function createReview(options: {
  client: AdminDb;
  input: ReviewFormInput;
}): Promise<ReviewMutationResult> {
  const parsed = validateReviewForm(options.input);
  if (!parsed.ok || !parsed.values) {
    return { ok: false, error: "Please complete the testimonial fields." };
  }

  const { data, error } = await options.client
    .from("reviews")
    .insert(rowFromValues(parsed.values))
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: "Unable to create this testimonial." };
  }

  return { ok: true, id: data.id };
}

export async function updateReview(options: {
  client: AdminDb;
  id: string;
  input: ReviewFormInput;
}): Promise<ReviewMutationResult> {
  const parsed = validateReviewForm(options.input);
  if (!parsed.ok || !parsed.values) {
    return { ok: false, error: "Please complete the testimonial fields." };
  }

  const { error } = await options.client
    .from("reviews")
    .update(rowFromValues(parsed.values))
    .eq("id", options.id);

  if (error) {
    return { ok: false, error: "Unable to update this testimonial." };
  }

  return { ok: true, id: options.id };
}

export async function setReviewPublished(options: {
  client: AdminDb;
  id: string;
  isPublished: boolean;
}): Promise<ReviewMutationResult> {
  const { error } = await options.client
    .from("reviews")
    .update({ is_published: options.isPublished })
    .eq("id", options.id);

  if (error) {
    return { ok: false, error: "Unable to update publication." };
  }

  return { ok: true, id: options.id };
}

export async function setReviewModerationStatus(options: {
  client: AdminDb;
  id: string;
  status: ReviewModerationStatus;
}): Promise<ReviewMutationResult> {
  if (!isReviewModerationStatus(options.status)) {
    return { ok: false, error: "Invalid moderation status." };
  }

  const { error } = await options.client
    .from("reviews")
    .update(publicationFieldsForStatus(options.status))
    .eq("id", options.id);

  if (error) {
    return { ok: false, error: "Unable to update moderation." };
  }

  return { ok: true, id: options.id };
}

export async function deleteReview(options: {
  client: AdminDb;
  id: string;
}): Promise<ReviewMutationResult> {
  const { error } = await options.client
    .from("reviews")
    .delete()
    .eq("id", options.id);

  if (error) {
    return { ok: false, error: "Unable to delete this testimonial." };
  }

  return { ok: true, id: options.id };
}
