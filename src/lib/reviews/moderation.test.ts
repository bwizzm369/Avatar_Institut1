import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  applyStudentInsertGuarantees,
  canInsertStudentReviewForProfile,
  isOwnProfileReviewInsert,
  isPubliclyVisibleReview,
  isReviewModerationStatus,
  isValidReviewRating,
  matchesStudentInsertRls,
  parseReviewRating,
  publicationFieldsForStatus,
  reviewPublicationInvariantHolds,
  reviewRowIsSelectableBy,
} from "@/lib/reviews/moderation";

const sql = readFileSync(
  path.join(
    process.cwd(),
    "supabase/migrations/20260829120000_reviews_student_moderation.sql",
  ),
  "utf8",
);

const studentId = "11111111-1111-1111-1111-111111111111";
const otherId = "22222222-2222-2222-2222-222222222222";

describe("review rating validation", () => {
  it("accepts integers 1–5 and rejects everything else", () => {
    expect(parseReviewRating(1)).toBe(1);
    expect(parseReviewRating(5)).toBe(5);
    expect(parseReviewRating("3")).toBe(3);
    expect(isValidReviewRating(4)).toBe(true);
    expect(parseReviewRating(0)).toBeNull();
    expect(parseReviewRating(6)).toBeNull();
    expect(parseReviewRating(3.5)).toBeNull();
    expect(parseReviewRating(null)).toBeNull();
    expect(isValidReviewRating("")).toBe(false);
  });
});

describe("review moderation_status validation", () => {
  it("allows pending, approved, and rejected only", () => {
    expect(isReviewModerationStatus("pending")).toBe(true);
    expect(isReviewModerationStatus("approved")).toBe(true);
    expect(isReviewModerationStatus("rejected")).toBe(true);
    expect(isReviewModerationStatus("published")).toBe(false);
    expect(isReviewModerationStatus("unpublished")).toBe(false);
    expect(isReviewModerationStatus("")).toBe(false);
  });
});

describe("review public visibility", () => {
  it("does not treat a pending review as public", () => {
    expect(
      isPubliclyVisibleReview({
        is_published: false,
        moderation_status: "pending",
      }),
    ).toBe(false);
    expect(
      isPubliclyVisibleReview({
        is_published: true,
        moderation_status: "pending",
      }),
    ).toBe(false);
    expect(
      reviewPublicationInvariantHolds({
        is_published: false,
        moderation_status: "pending",
      }),
    ).toBe(true);
  });

  it("treats an approved and published review as public", () => {
    expect(
      isPubliclyVisibleReview({
        is_published: true,
        moderation_status: "approved",
      }),
    ).toBe(true);
    expect(publicationFieldsForStatus("approved")).toEqual({
      moderation_status: "approved",
      is_published: true,
    });
    expect(
      reviewPublicationInvariantHolds({
        is_published: true,
        moderation_status: "approved",
      }),
    ).toBe(true);
  });

  it("does not treat a rejected review as public", () => {
    expect(
      isPubliclyVisibleReview({
        is_published: false,
        moderation_status: "rejected",
      }),
    ).toBe(false);
    expect(
      isPubliclyVisibleReview({
        is_published: true,
        moderation_status: "rejected",
      }),
    ).toBe(false);
    expect(publicationFieldsForStatus("rejected")).toEqual({
      moderation_status: "rejected",
      is_published: false,
    });
  });
});

describe("review select RLS", () => {
  const ownPending = {
    profile_id: studentId,
    is_published: false,
    moderation_status: "pending",
  };
  const ownRejected = {
    profile_id: studentId,
    is_published: false,
    moderation_status: "rejected",
  };
  const otherPending = {
    profile_id: otherId,
    is_published: false,
    moderation_status: "pending",
  };
  const publicApproved = {
    profile_id: otherId,
    is_published: true,
    moderation_status: "approved",
  };

  it("lets a student read their own pending or rejected review", () => {
    expect(
      reviewRowIsSelectableBy({
        role: "authenticated",
        authUid: studentId,
        review: ownPending,
      }),
    ).toBe(true);
    expect(
      reviewRowIsSelectableBy({
        role: "authenticated",
        authUid: studentId,
        review: ownRejected,
      }),
    ).toBe(true);
  });

  it("does not let a student read another student's unpublished review", () => {
    expect(
      reviewRowIsSelectableBy({
        role: "authenticated",
        authUid: studentId,
        review: otherPending,
      }),
    ).toBe(false);
  });

  it("does not let anon read pending or rejected reviews", () => {
    expect(
      reviewRowIsSelectableBy({
        role: "anon",
        authUid: null,
        review: ownPending,
      }),
    ).toBe(false);
    expect(
      reviewRowIsSelectableBy({
        role: "anon",
        authUid: null,
        review: ownRejected,
      }),
    ).toBe(false);
  });

  it("lets anon and students read approved published reviews", () => {
    expect(
      reviewRowIsSelectableBy({
        role: "anon",
        authUid: null,
        review: publicApproved,
      }),
    ).toBe(true);
    expect(
      reviewRowIsSelectableBy({
        role: "authenticated",
        authUid: studentId,
        review: publicApproved,
      }),
    ).toBe(true);
  });
});

describe("student review insert rules", () => {
  it("allows insert only for the authenticated profile", () => {
    expect(isOwnProfileReviewInsert(studentId, studentId)).toBe(true);
    expect(isOwnProfileReviewInsert(otherId, studentId)).toBe(false);

    const impersonation = applyStudentInsertGuarantees({
      authUid: studentId,
      profileId: otherId,
      rating: 5,
    });
    expect(impersonation.ok).toBe(false);
    if (!impersonation.ok) {
      expect(impersonation.error).toBe("impersonation");
    }

    const own = applyStudentInsertGuarantees({
      authUid: studentId,
      profileId: studentId,
      rating: 4,
      isPublished: true,
      moderationStatus: "approved",
      reviewedBy: otherId,
    });
    expect(own.ok).toBe(true);
    if (own.ok) {
      expect(own.row.profile_id).toBe(studentId);
      expect(matchesStudentInsertRls(own.row, studentId)).toBe(true);
    }
  });

  it("never lets a student self-publish or self-approve", () => {
    const forced = applyStudentInsertGuarantees({
      authUid: studentId,
      profileId: studentId,
      rating: 5,
      isPublished: true,
      moderationStatus: "approved",
      reviewedBy: studentId,
      reviewedAt: "2026-08-29T08:00:00.000Z",
    });
    expect(forced.ok).toBe(true);
    if (forced.ok) {
      expect(forced.row.moderation_status).toBe("pending");
      expect(forced.row.is_published).toBe(false);
      expect(forced.row.reviewed_by).toBeNull();
      expect(forced.row.reviewed_at).toBeNull();
    }

    expect(
      matchesStudentInsertRls(
        {
          profile_id: studentId,
          moderation_status: "approved",
          is_published: true,
          reviewed_by: null,
          reviewed_at: null,
          rating: 5,
        },
        studentId,
      ),
    ).toBe(false);
  });

  it("allows only one student review per profile", () => {
    expect(
      canInsertStudentReviewForProfile({
        profileId: studentId,
        existingProfileIds: [null, otherId],
      }),
    ).toBe(true);
    expect(
      canInsertStudentReviewForProfile({
        profileId: studentId,
        existingProfileIds: [studentId],
      }),
    ).toBe(false);
  });
});

describe("reviews student moderation migration", () => {
  it("contains required RLS protections and insert guarantees", () => {
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS profile_id UUID/);
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS rating SMALLINT/);
    expect(sql).toMatch(
      /CHECK \(moderation_status IN \('pending', 'approved', 'rejected'\)\)/,
    );
    expect(sql).toMatch(/reviews_select_published/);
    expect(sql).toMatch(
      /USING \(is_published = true AND moderation_status = 'approved'\)/,
    );
    expect(sql).toMatch(/reviews_select_own/);
    expect(sql).toMatch(/USING \(profile_id = auth\.uid\(\)\)/);
    expect(sql).not.toMatch(
      /reviews_select_own[\s\S]{0,180}TO anon/,
    );
    expect(sql).not.toMatch(/reviews_update_student|reviews_delete_student/);
    expect(sql).toMatch(/reviews_insert_student/);
    expect(sql).toMatch(/profile_id = auth\.uid\(\)/);
    expect(sql).toMatch(/NEW\.profile_id := auth\.uid\(\)/);
    expect(sql).toMatch(/NEW\.moderation_status := 'pending'/);
    expect(sql).toMatch(/NEW\.is_published := false/);
    expect(sql).toMatch(/NEW\.reviewed_by := NULL/);
    expect(sql).toMatch(/NEW\.reviewed_at := NULL/);
    expect(sql).toMatch(/reviews_update_admin_only/);
    expect(sql).toMatch(/reviews_insert_admin/);
    expect(sql).toMatch(/reviews_update_admin/);
    expect(sql).toMatch(/reviews_delete_admin/);
    expect(sql).toMatch(/REVOKE INSERT, UPDATE, DELETE ON public\.reviews FROM anon/);
    expect(sql).not.toMatch(/GRANT INSERT ON public\.reviews TO anon/);
    expect(sql).toMatch(
      /CREATE UNIQUE INDEX IF NOT EXISTS reviews_one_review_per_profile_idx/,
    );
    expect(sql).toMatch(/WHERE profile_id IS NOT NULL/);
    expect(sql).not.toMatch(/stripe|student_pass|certificate|webhook|checkout/i);
  });
});
