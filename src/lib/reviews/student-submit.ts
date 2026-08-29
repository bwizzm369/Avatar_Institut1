import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  isReviewModerationStatus,
  parseReviewRating,
} from "@/lib/reviews/moderation";
import {
  isPostgresUniqueViolation,
  prepareStudentReviewInsert,
  reviewAuthorNameFromProfile,
  type StudentReviewSubmitError,
} from "@/lib/reviews/student-policy";
import { readStudentReviewFormFields } from "@/lib/reviews/validation";
import type {
  StudentOwnReviewView,
  StudentReviewPageState,
} from "@/lib/reviews/types";

type UserScopedClient = Awaited<ReturnType<typeof createServerSupabaseClient>>;

export type StudentReviewSubmitResult =
  | { ok: true }
  | {
      ok: false;
      error: StudentReviewSubmitError | "config" | "failed";
      fieldErrors?: { rating?: string; quote?: string };
    };

async function findOwnStudentReview(
  client: UserScopedClient,
  userId: string,
): Promise<StudentOwnReviewView | null> {
  const { data } = await client
    .from("reviews")
    .select("moderation_status, rating")
    .eq("profile_id", userId)
    .maybeSingle();

  if (!data || !isReviewModerationStatus(data.moderation_status)) {
    return null;
  }

  return {
    moderation_status: data.moderation_status,
    rating: parseReviewRating(data.rating),
  };
}

export async function getStudentReviewPageState(): Promise<StudentReviewPageState> {
  if (!isSupabaseConfigured()) {
    return { authenticated: false, displayName: null, existing: null };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { authenticated: false, displayName: null, existing: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", user.id)
    .maybeSingle();

  return {
    authenticated: true,
    displayName: reviewAuthorNameFromProfile(profile ?? {}),
    existing: await findOwnStudentReview(supabase, user.id),
  };
}

export async function submitStudentReview(
  formData: FormData,
): Promise<StudentReviewSubmitResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "config" };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "unauthenticated" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", user.id)
    .maybeSingle();

  const existing = await findOwnStudentReview(supabase, user.id);
  const prepared = prepareStudentReviewInsert({
    authUid: user.id,
    profileId: user.id,
    displayName: reviewAuthorNameFromProfile(profile ?? {}),
    form: readStudentReviewFormFields(formData),
    existingProfileIds: existing ? [user.id] : [],
  });

  if (!prepared.ok) {
    return {
      ok: false,
      error: prepared.error,
      fieldErrors: prepared.fieldErrors,
    };
  }

  const { error } = await supabase.from("reviews").insert({
    profile_id: prepared.row.profile_id,
    author_name: prepared.row.author_name,
    quote_en: prepared.row.quote_en,
    quote_ar: prepared.row.quote_ar,
    rating: prepared.row.rating,
    moderation_status: prepared.row.moderation_status,
    is_published: prepared.row.is_published,
    reviewed_by: prepared.row.reviewed_by,
    reviewed_at: prepared.row.reviewed_at,
  });

  if (error) {
    if (isPostgresUniqueViolation(error)) {
      return { ok: false, error: "alreadySubmitted" };
    }
    return { ok: false, error: "failed" };
  }

  return { ok: true };
}
