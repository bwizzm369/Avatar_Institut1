import type { ReviewModerationStatus, ReviewRating } from "@/lib/reviews/types";

export const REVIEW_MODERATION_STATUSES = [
  "pending",
  "approved",
  "rejected",
] as const;

export function isReviewModerationStatus(
  value: unknown,
): value is ReviewModerationStatus {
  return (
    typeof value === "string" &&
    (REVIEW_MODERATION_STATUSES as readonly string[]).includes(value)
  );
}

export function parseReviewRating(value: unknown): ReviewRating | null {
  const numeric =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim() !== ""
        ? Number(value)
        : NaN;

  if (!Number.isInteger(numeric) || numeric < 1 || numeric > 5) {
    return null;
  }

  return numeric as ReviewRating;
}

export function isValidReviewRating(value: unknown): value is ReviewRating {
  return parseReviewRating(value) !== null;
}

export function reviewPublicationInvariantHolds(review: {
  moderation_status: unknown;
  is_published: boolean;
}): boolean {
  if (!isReviewModerationStatus(review.moderation_status)) {
    return false;
  }
  if (review.moderation_status === "approved") {
    return review.is_published === true;
  }
  return review.is_published === false;
}

export function isPubliclyVisibleReview(review: {
  is_published: boolean;
  moderation_status: unknown;
}): boolean {
  return (
    review.is_published === true && review.moderation_status === "approved"
  );
}

/**
 * Mirrors reviews SELECT RLS (excluding admin):
 * anon → approved+published only
 * authenticated → approved+published OR own profile_id
 */
export function reviewRowIsSelectableBy(options: {
  role: "anon" | "authenticated";
  authUid: string | null;
  review: {
    profile_id: string | null;
    is_published: boolean;
    moderation_status: unknown;
  };
}): boolean {
  if (isPubliclyVisibleReview(options.review)) {
    return true;
  }
  if (options.role !== "authenticated" || !options.authUid) {
    return false;
  }
  return options.review.profile_id === options.authUid;
}

export function isOwnProfileReviewInsert(
  profileId: string,
  authUid: string,
): boolean {
  return Boolean(profileId) && Boolean(authUid) && profileId === authUid;
}

export function canInsertStudentReviewForProfile(options: {
  profileId: string;
  existingProfileIds: Array<string | null | undefined>;
}): boolean {
  return !options.existingProfileIds.some((id) => id === options.profileId);
}

export function publicationFieldsForStatus(status: ReviewModerationStatus): {
  moderation_status: ReviewModerationStatus;
  is_published: boolean;
} {
  return {
    moderation_status: status,
    is_published: status === "approved",
  };
}

export type StudentReviewInsertAttempt = {
  authUid: string | null;
  profileId: string | null;
  rating: unknown;
  moderationStatus?: unknown;
  isPublished?: boolean;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
};

export type StudentReviewInsertRow = {
  profile_id: string;
  rating: ReviewRating;
  moderation_status: "pending";
  is_published: false;
  reviewed_by: null;
  reviewed_at: null;
};

/**
 * Mirrors prepare_review_write() for non-admin INSERT:
 * own profile, pending, unpublished, no reviewed_* metadata.
 */
export function applyStudentInsertGuarantees(
  attempt: StudentReviewInsertAttempt,
):
  | { ok: true; row: StudentReviewInsertRow }
  | {
      ok: false;
      error: "unauthenticated" | "impersonation" | "invalid_rating";
    } {
  if (!attempt.authUid) {
    return { ok: false, error: "unauthenticated" };
  }
  if (!attempt.profileId || attempt.profileId !== attempt.authUid) {
    return { ok: false, error: "impersonation" };
  }

  const rating = parseReviewRating(attempt.rating);
  if (rating === null) {
    return { ok: false, error: "invalid_rating" };
  }

  return {
    ok: true,
    row: {
      profile_id: attempt.authUid,
      rating,
      moderation_status: "pending",
      is_published: false,
      reviewed_by: null,
      reviewed_at: null,
    },
  };
}

/**
 * Mirrors reviews_insert_student WITH CHECK (row after trigger).
 */
export function matchesStudentInsertRls(
  row: {
    profile_id: string;
    moderation_status: unknown;
    is_published: boolean;
    reviewed_by: string | null;
    reviewed_at: string | null;
    rating: unknown;
  },
  authUid: string,
  isAdmin = false,
): boolean {
  if (isAdmin) return false;
  return (
    row.profile_id === authUid &&
    row.moderation_status === "pending" &&
    row.is_published === false &&
    row.reviewed_by === null &&
    row.reviewed_at === null &&
    isValidReviewRating(row.rating)
  );
}
