import {
  applyStudentInsertGuarantees,
  canInsertStudentReviewForProfile,
  isReviewModerationStatus,
  parseReviewRating,
} from "@/lib/reviews/moderation";
import { quotesForStudentLocale, validateStudentReviewForm } from "@/lib/reviews/validation";
import type {
  ReviewRating,
  StudentOwnReviewView,
  StudentReviewFormInput,
} from "@/lib/reviews/types";

export type StudentReviewSubmitError =
  | "unauthenticated"
  | "impersonation"
  | "rating"
  | "quote"
  | "tooLong"
  | "alreadySubmitted"
  | "noName";

export type PreparedStudentReviewInsert = {
  profile_id: string;
  author_name: string;
  quote_en: string;
  quote_ar: string;
  rating: ReviewRating;
  moderation_status: "pending";
  is_published: false;
  reviewed_by: null;
  reviewed_at: null;
};

export function reviewAuthorNameFromProfile(profile: {
  first_name?: string | null;
  last_name?: string | null;
}): string {
  return [profile.first_name, profile.last_name]
    .map((part) => (part ?? "").trim())
    .filter(Boolean)
    .join(" ")
    .trim();
}

export function prepareStudentReviewInsert(options: {
  authUid: string | null;
  profileId: string | null;
  displayName: string;
  form: StudentReviewFormInput;
  existingProfileIds: Array<string | null | undefined>;
}):
  | { ok: true; row: PreparedStudentReviewInsert }
  | { ok: false; error: StudentReviewSubmitError; fieldErrors?: { rating?: string; quote?: string } } {
  if (!options.authUid) {
    return { ok: false, error: "unauthenticated" };
  }

  const parsed = validateStudentReviewForm(options.form);
  if (!parsed.ok || !parsed.values) {
    const quoteError = parsed.errors.quote;
    if (parsed.errors.rating) {
      return { ok: false, error: "rating", fieldErrors: parsed.errors };
    }
    if (quoteError === "tooLong") {
      return { ok: false, error: "tooLong", fieldErrors: parsed.errors };
    }
    return { ok: false, error: "quote", fieldErrors: parsed.errors };
  }

  const guarantees = applyStudentInsertGuarantees({
    authUid: options.authUid,
    profileId: options.profileId,
    rating: parsed.values.rating,
    isPublished: true,
    moderationStatus: "approved",
  });
  if (!guarantees.ok) {
    return { ok: false, error: guarantees.error === "invalid_rating" ? "rating" : guarantees.error };
  }

  if (
    !canInsertStudentReviewForProfile({
      profileId: guarantees.row.profile_id,
      existingProfileIds: options.existingProfileIds,
    })
  ) {
    return { ok: false, error: "alreadySubmitted" };
  }

  const authorName = options.displayName.trim();
  if (!authorName) {
    return { ok: false, error: "noName" };
  }

  const quotes = quotesForStudentLocale(parsed.values.locale, parsed.values.quote);

  return {
    ok: true,
    row: {
      profile_id: guarantees.row.profile_id,
      author_name: authorName,
      quote_en: quotes.quote_en,
      quote_ar: quotes.quote_ar,
      rating: guarantees.row.rating,
      moderation_status: "pending",
      is_published: false,
      reviewed_by: null,
      reviewed_at: null,
    },
  };
}

export function isPostgresUniqueViolation(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code === "23505") return true;
  return (error.message ?? "").toLowerCase().includes("reviews_one_review_per_profile");
}

export function existingReviewForProfile(
  rows: Array<{
    profile_id: string | null;
    moderation_status: unknown;
    rating: unknown;
  }>,
  profileId: string,
): StudentOwnReviewView | null {
  const match = rows.find((row) => row.profile_id === profileId);
  if (!match || !isReviewModerationStatus(match.moderation_status)) {
    return null;
  }
  return {
    moderation_status: match.moderation_status,
    rating: parseReviewRating(match.rating),
  };
}
