"use client";

import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import {
  publicReviewRating,
  reviewQuoteForLocale,
  reviewTitleForLocale,
} from "@/lib/reviews/display";
import { ReviewStars } from "@/components/ReviewStars";
import { msg, msgReplace } from "@/lib/i18n";
import type { PublicReview } from "@/lib/reviews/types";

export function ReviewsGallery({
  reviews,
  showViewAll = false,
}: {
  reviews: PublicReview[];
  showViewAll?: boolean;
}) {
  const { locale } = useLocale();

  if (reviews.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-mark" aria-hidden="true" />
        <p className="muted reviews-empty">{msg("reviews.empty", locale)}</p>
      </div>
    );
  }

  return (
    <div className="reviews-gallery-wrap">
      <div className="reviews-grid">
        {reviews.map((review) => {
          const quote = reviewQuoteForLocale(review, locale);
          const title = reviewTitleForLocale(review, locale);
          const rating = publicReviewRating(review);
          const ratingLabel = rating
            ? msgReplace("reviews.ratingAria", locale, { n: rating })
            : null;
          return (
            <article key={review.id} className="review-card">
              {rating && ratingLabel ? (
                <ReviewStars rating={rating} label={ratingLabel} />
              ) : null}
              <blockquote
                className="review-quote"
                lang={quote.lang}
                dir={quote.dir}
              >
                <p>{quote.text}</p>
              </blockquote>
              <footer className="review-meta">
                <cite className="review-author" dir="auto">
                  {review.author_name}
                </cite>
                {title.text ? (
                  <p
                    className="review-role muted small"
                    lang={title.lang}
                    dir={title.dir}
                  >
                    {title.text}
                  </p>
                ) : null}
              </footer>
            </article>
          );
        })}
      </div>
      {showViewAll ? (
        <div className="reviews-more">
          <Link href="/reviews" className="btn btn-ghost">
            {msg("reviews.viewAll", locale)}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
