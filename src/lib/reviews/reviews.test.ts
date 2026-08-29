import { describe, expect, it } from "vitest";
import {
  isPublicReviewComplete,
  reviewQuoteForLocale,
  reviewTitleForLocale,
} from "@/lib/reviews/display";
import { readReviewFormFields, validateReviewForm } from "@/lib/reviews/validation";

function asFormData(values: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }
  return formData;
}

describe("review form validation", () => {
  it("accepts an Arabic-only published testimonial", () => {
    const parsed = validateReviewForm(
      readReviewFormFields(
        asFormData({
          authorName: "ليلى ناصر",
          authorTitleAr: "دارسة",
          authorTitleEn: "",
          quoteAr: "تجربة عميقة ومنظمة.",
          quoteEn: "",
          isPublished: "on",
          sortOrder: "2",
        }),
      ),
    );
    expect(parsed.ok).toBe(true);
    expect(parsed.values?.quoteEn).toBe("");
    expect(parsed.values?.quoteAr).toBe("تجربة عميقة ومنظمة.");
    expect(parsed.values?.isPublished).toBe(true);
    expect(parsed.values?.sortOrder).toBe(2);
  });

  it("requires an author and at least one quote", () => {
    const parsed = validateReviewForm(
      readReviewFormFields(
        asFormData({
          authorName: " ",
          quoteEn: "",
          quoteAr: "",
          sortOrder: "0",
        }),
      ),
    );
    expect(parsed.ok).toBe(false);
    expect(parsed.errors.authorName).toBe("required");
    expect(parsed.errors.quote).toBe("required");
  });

  it("rejects an invalid sort order", () => {
    const parsed = validateReviewForm(
      readReviewFormFields(
        asFormData({
          authorName: "Lina",
          quoteEn: "Clear teaching.",
          sortOrder: "-1",
        }),
      ),
    );
    expect(parsed.ok).toBe(false);
    expect(parsed.errors.sortOrder).toBe("invalid");
  });
});

describe("review public display", () => {
  const bilingual = {
    author_name: "Lina Nasser",
    author_title_en: "Graduate",
    author_title_ar: "خريجة",
    quote_en: "A careful and grounded programme.",
    quote_ar: "برنامج متأنٍ وراسخ.",
  };

  it("uses the requested locale when copy exists", () => {
    expect(reviewQuoteForLocale(bilingual, "en")).toEqual({
      text: "A careful and grounded programme.",
      lang: "en",
      dir: "ltr",
    });
    expect(reviewQuoteForLocale(bilingual, "ar")).toEqual({
      text: "برنامج متأنٍ وراسخ.",
      lang: "ar",
      dir: "rtl",
    });
    expect(reviewTitleForLocale(bilingual, "ar").dir).toBe("rtl");
  });

  it("falls back to the other language without inventing a translation", () => {
    const arabicOnly = {
      ...bilingual,
      quote_en: "  ",
      author_title_en: "",
    };
    const quote = reviewQuoteForLocale(arabicOnly, "en");
    expect(quote.text).toBe("برنامج متأنٍ وراسخ.");
    expect(quote.lang).toBe("ar");
    expect(quote.dir).toBe("rtl");
    expect(reviewTitleForLocale(arabicOnly, "en")).toEqual({
      text: "خريجة",
      lang: "ar",
      dir: "rtl",
    });
  });

  it("marks incomplete rows as not displayable", () => {
    expect(
      isPublicReviewComplete({
        author_name: "Lina",
        quote_en: "",
        quote_ar: "",
      }),
    ).toBe(false);
    expect(
      isPublicReviewComplete({
        author_name: "Lina",
        quote_en: "Clear teaching.",
        quote_ar: "",
      }),
    ).toBe(true);
  });
});
