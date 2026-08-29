import { getDirection } from "@/lib/i18n";
import { parseReviewRating } from "@/lib/reviews/moderation";
import type { PublicReview, ReviewRating } from "@/lib/reviews/types";
import type { Locale } from "@/types";

export type LocalizedReviewCopy = {
  text: string;
  lang: Locale;
  dir: "ltr" | "rtl";
};

function pickLocalized(
  en: string,
  ar: string,
  locale: Locale,
): LocalizedReviewCopy {
  const english = en.trim();
  const arabic = ar.trim();

  if (locale === "ar" && arabic) {
    return { text: arabic, lang: "ar", dir: "rtl" };
  }
  if (locale === "en" && english) {
    return { text: english, lang: "en", dir: "ltr" };
  }
  if (arabic) {
    return { text: arabic, lang: "ar", dir: "rtl" };
  }
  return { text: english, lang: "en", dir: getDirection("en") };
}

export function reviewQuoteForLocale(
  review: Pick<PublicReview, "quote_en" | "quote_ar">,
  locale: Locale,
): LocalizedReviewCopy {
  return pickLocalized(review.quote_en, review.quote_ar, locale);
}

export function reviewTitleForLocale(
  review: Pick<PublicReview, "author_title_en" | "author_title_ar">,
  locale: Locale,
): LocalizedReviewCopy {
  return pickLocalized(review.author_title_en, review.author_title_ar, locale);
}

export function isPublicReviewComplete(
  review: Pick<PublicReview, "author_name" | "quote_en" | "quote_ar">,
): boolean {
  return Boolean(
    review.author_name.trim() &&
      (review.quote_en.trim() || review.quote_ar.trim()),
  );
}

export function publicReviewRating(
  review: Pick<PublicReview, "rating">,
): ReviewRating | null {
  return parseReviewRating(review.rating);
}
