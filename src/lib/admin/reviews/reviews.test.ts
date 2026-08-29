import { describe, expect, it } from "vitest";
import { publicationFieldsForStatus } from "@/lib/reviews/moderation";
import { validateReviewForm } from "@/lib/reviews/validation";
import { readReviewFormFields } from "@/lib/reviews/validation";

describe("admin review mutation guards", () => {
  it("does not publish an empty testimonial from form data", () => {
    const formData = new FormData();
    formData.set("authorName", "");
    formData.set("quoteEn", "");
    formData.set("quoteAr", "");
    formData.set("isPublished", "true");
    const parsed = validateReviewForm(readReviewFormFields(formData));
    expect(parsed.ok).toBe(false);
  });

  it("allows unpublished drafts with a quote in one language", () => {
    const formData = new FormData();
    formData.set("authorName", "Lina Nasser");
    formData.set("quoteEn", "The teaching is clear.");
    formData.set("isPublished", "");
    formData.set("sortOrder", "0");
    const parsed = validateReviewForm(readReviewFormFields(formData));
    expect(parsed.ok).toBe(true);
    expect(parsed.values?.isPublished).toBe(false);
  });

  it("maps approve and reject to the Lot A publication invariant", () => {
    expect(publicationFieldsForStatus("approved").is_published).toBe(true);
    expect(publicationFieldsForStatus("rejected").is_published).toBe(false);
  });
});
