import { isLocale } from "@/lib/i18n";
import { parseReviewRating } from "@/lib/reviews/moderation";
import type {
  ReviewFormInput,
  ReviewFormValues,
  ReviewRating,
  StudentReviewFormInput,
} from "@/lib/reviews/types";
import type { Locale } from "@/types";

const MAX_AUTHOR = 120;
const MAX_TITLE = 160;
export const REVIEW_QUOTE_MAX = 2000;
const MAX_QUOTE = REVIEW_QUOTE_MAX;

export type ReviewFieldErrors = {
  authorName?: string;
  authorTitleEn?: string;
  authorTitleAr?: string;
  quote?: string;
  sortOrder?: string;
};

export function readReviewFormFields(formData: FormData): ReviewFormInput {
  return {
    authorName: String(formData.get("authorName") ?? ""),
    authorTitleEn: String(formData.get("authorTitleEn") ?? ""),
    authorTitleAr: String(formData.get("authorTitleAr") ?? ""),
    quoteEn: String(formData.get("quoteEn") ?? ""),
    quoteAr: String(formData.get("quoteAr") ?? ""),
    isPublished:
      formData.get("isPublished") === "on" ||
      formData.get("isPublished") === "true" ||
      formData.get("isPublished") === "1",
    sortOrder: String(formData.get("sortOrder") ?? "0"),
  };
}

export function validateReviewForm(input: ReviewFormInput): {
  ok: boolean;
  errors: ReviewFieldErrors;
  values: ReviewFormValues | null;
} {
  const errors: ReviewFieldErrors = {};
  const authorName = input.authorName.trim();
  const authorTitleEn = input.authorTitleEn.trim();
  const authorTitleAr = input.authorTitleAr.trim();
  const quoteEn = input.quoteEn.trim();
  const quoteAr = input.quoteAr.trim();

  if (!authorName) {
    errors.authorName = "required";
  } else if (authorName.length > MAX_AUTHOR) {
    errors.authorName = "tooLong";
  }

  if (authorTitleEn.length > MAX_TITLE) {
    errors.authorTitleEn = "tooLong";
  }
  if (authorTitleAr.length > MAX_TITLE) {
    errors.authorTitleAr = "tooLong";
  }

  if (!quoteEn && !quoteAr) {
    errors.quote = "required";
  } else {
    if (quoteEn.length > MAX_QUOTE) errors.quote = "tooLong";
    if (quoteAr.length > MAX_QUOTE) errors.quote = "tooLong";
  }

  const parsedOrder = Number.parseInt(input.sortOrder.trim() || "0", 10);
  if (!Number.isFinite(parsedOrder) || parsedOrder < 0 || parsedOrder > 9999) {
    errors.sortOrder = "invalid";
  }

  const ok = Object.keys(errors).length === 0;
  return {
    ok,
    errors,
    values: ok
      ? {
          authorName,
          authorTitleEn,
          authorTitleAr,
          quoteEn,
          quoteAr,
          isPublished: input.isPublished,
          sortOrder: parsedOrder,
        }
      : null,
  };
}

export type StudentReviewFieldErrors = {
  rating?: string;
  quote?: string;
};

export function readStudentReviewFormFields(
  formData: FormData,
): StudentReviewFormInput {
  return {
    rating: String(formData.get("rating") ?? ""),
    quote: String(formData.get("quote") ?? ""),
    locale: String(formData.get("locale") ?? ""),
  };
}

export function quotesForStudentLocale(
  locale: Locale,
  quote: string,
): { quote_en: string; quote_ar: string } {
  if (locale === "ar") {
    return { quote_en: "", quote_ar: quote };
  }
  return { quote_en: quote, quote_ar: "" };
}

export function validateStudentReviewForm(input: StudentReviewFormInput): {
  ok: boolean;
  errors: StudentReviewFieldErrors;
  values: { rating: ReviewRating; quote: string; locale: Locale } | null;
} {
  const errors: StudentReviewFieldErrors = {};
  const quote = input.quote.trim();
  const locale: Locale = isLocale(input.locale) ? input.locale : "en";
  const rating = parseReviewRating(input.rating);

  if (rating === null) {
    errors.rating = "required";
  }

  if (!quote) {
    errors.quote = "required";
  } else if (quote.length > MAX_QUOTE) {
    errors.quote = "tooLong";
  }

  const ok = Object.keys(errors).length === 0;
  return {
    ok,
    errors,
    values: ok && rating !== null ? { rating, quote, locale } : null,
  };
}
