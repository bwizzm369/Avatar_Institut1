import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { publicReviewRating } from "@/lib/reviews/display";
import {
  isPubliclyVisibleReview,
  publicationFieldsForStatus,
} from "@/lib/reviews/moderation";
import {
  existingReviewForProfile,
  prepareStudentReviewInsert,
  reviewAuthorNameFromProfile,
} from "@/lib/reviews/student-policy";
import {
  quotesForStudentLocale,
  REVIEW_QUOTE_MAX,
  validateStudentReviewForm,
} from "@/lib/reviews/validation";

const studentId = "11111111-1111-1111-1111-111111111111";
const otherId = "22222222-2222-2222-2222-222222222222";

function form(overrides: Partial<{ rating: string; quote: string; locale: string }> = {}) {
  return {
    rating: "5",
    quote: "The teaching is clear and grounded.",
    locale: "en",
    ...overrides,
  };
}

describe("student review submission", () => {
  it("does not allow an unauthenticated visitor to submit", () => {
    const result = prepareStudentReviewInsert({
      authUid: null,
      profileId: null,
      displayName: "Lina Nasser",
      form: form(),
      existingProfileIds: [],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("unauthenticated");
  });

  it("lets an authenticated profile submit their own review", () => {
    const result = prepareStudentReviewInsert({
      authUid: studentId,
      profileId: studentId,
      displayName: "Lina Nasser",
      form: form({ locale: "en" }),
      existingProfileIds: [],
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.row.profile_id).toBe(studentId);
      expect(result.row.author_name).toBe("Lina Nasser");
      expect(result.row.quote_en).toBe("The teaching is clear and grounded.");
      expect(result.row.quote_ar).toBe("");
    }
  });

  it("requires a rating from 1 to 5", () => {
    expect(
      validateStudentReviewForm(form({ rating: "" })).errors.rating,
    ).toBe("required");
    expect(validateStudentReviewForm(form({ rating: "0" })).ok).toBe(false);
    expect(validateStudentReviewForm(form({ rating: "6" })).ok).toBe(false);
    expect(validateStudentReviewForm(form({ rating: "3" })).values?.rating).toBe(
      3,
    );
  });

  it("requires review text and respects the quote limit", () => {
    expect(validateStudentReviewForm(form({ quote: "  " })).errors.quote).toBe(
      "required",
    );
    expect(
      validateStudentReviewForm(
        form({ quote: "a".repeat(REVIEW_QUOTE_MAX + 1) }),
      ).errors.quote,
    ).toBe("tooLong");
  });

  it("stores the submitted text in the current locale without translating it", () => {
    const arabic = quotesForStudentLocale("ar", "تجربة عميقة ومنظمة.");
    expect(arabic.quote_ar).toBe("تجربة عميقة ومنظمة.");
    expect(arabic.quote_en).toBe("");
    const english = quotesForStudentLocale("en", "Clear teaching.");
    expect(english.quote_en).toBe("Clear teaching.");
    expect(english.quote_ar).toBe("");
  });

  it("allows only one review per profile", () => {
    const result = prepareStudentReviewInsert({
      authUid: studentId,
      profileId: studentId,
      displayName: "Lina Nasser",
      form: form(),
      existingProfileIds: [studentId],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("alreadySubmitted");
  });

  it("keeps a successful submission pending and unpublished", () => {
    const result = prepareStudentReviewInsert({
      authUid: studentId,
      profileId: studentId,
      displayName: "Lina Nasser",
      form: form(),
      existingProfileIds: [null, otherId],
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.row.moderation_status).toBe("pending");
      expect(result.row.is_published).toBe(false);
      expect(result.row.reviewed_by).toBeNull();
      expect(result.row.reviewed_at).toBeNull();
    }
  });

  it("detects a student's existing review and status", () => {
    expect(
      existingReviewForProfile(
        [
          {
            profile_id: studentId,
            moderation_status: "pending",
            rating: 4,
          },
        ],
        studentId,
      ),
    ).toEqual({ moderation_status: "pending", rating: 4 });
    expect(existingReviewForProfile([], studentId)).toBeNull();
    expect(
      reviewAuthorNameFromProfile({ first_name: "Lina", last_name: "Nasser" }),
    ).toBe("Lina Nasser");
  });
});

describe("public review visibility and rating", () => {
  it("hides pending and rejected rows and shows approved published ones", () => {
    expect(
      isPubliclyVisibleReview({
        is_published: false,
        moderation_status: "pending",
      }),
    ).toBe(false);
    expect(
      isPubliclyVisibleReview({
        is_published: false,
        moderation_status: "rejected",
      }),
    ).toBe(false);
    expect(
      isPubliclyVisibleReview({
        is_published: true,
        moderation_status: "approved",
      }),
    ).toBe(true);
  });

  it("exposes a 1–5 rating for public student reviews and none for unrated testimonials", () => {
    expect(publicReviewRating({ rating: 5 })).toBe(5);
    expect(publicReviewRating({ rating: 1 })).toBe(1);
    expect(publicReviewRating({ rating: null })).toBeNull();
    expect(publicReviewRating({ rating: 9 })).toBeNull();
  });

  it("queries only approved published reviews for the public gallery", () => {
    const source = readFileSync(
      path.join(process.cwd(), "src/lib/reviews/public.ts"),
      "utf8",
    );
    expect(source).toMatch(/\.eq\("is_published", true\)/);
    expect(source).toMatch(/\.eq\("moderation_status", "approved"\)/);
    expect(source).not.toMatch(/reviewed_by|profile_id|email|phone/);
  });
});

describe("admin review moderation", () => {
  it("approves by publishing and rejects by unpublishing", () => {
    expect(publicationFieldsForStatus("approved")).toEqual({
      moderation_status: "approved",
      is_published: true,
    });
    expect(publicationFieldsForStatus("rejected")).toEqual({
      moderation_status: "rejected",
      is_published: false,
    });
    expect(publicationFieldsForStatus("pending")).toEqual({
      moderation_status: "pending",
      is_published: false,
    });
  });

  it("keeps admin review actions behind server admin access", () => {
    const actions = readFileSync(
      path.join(
        process.cwd(),
        "src/app/admin/(console)/reviews/actions.ts",
      ),
      "utf8",
    );
    expect(actions).toMatch(/getAdminAccess/);
    expect(actions).toMatch(/setReviewModerationStatus/);
    expect(actions).not.toMatch(/createBrowserSupabaseClient/);
    expect(actions).not.toMatch(/createServiceRoleSupabaseClient/);
  });
});

describe("student review status lookup", () => {
  it("loads own review status with the user-scoped client, not the secret key", () => {
    const source = readFileSync(
      path.join(process.cwd(), "src/lib/reviews/student-submit.ts"),
      "utf8",
    );
    expect(source).toMatch(/createServerSupabaseClient/);
    expect(source).not.toMatch(/createServiceRoleSupabaseClient/);
    expect(source).not.toMatch(/getSupabaseSecretKey/);
  });
});

describe("reviews chrome", () => {
  it("adds Reviews to the public Header for desktop and mobile", () => {
    const header = readFileSync(
      path.join(process.cwd(), "src/components/Header.tsx"),
      "utf8",
    );
    expect(header).toMatch(/href: "\/reviews"/);
    expect(header).toMatch(/msg\("nav.reviews"/);
  });
});
