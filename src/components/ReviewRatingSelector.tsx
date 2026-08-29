"use client";

import { useLocale } from "@/components/LocaleProvider";
import { msg, msgReplace } from "@/lib/i18n";

export function ReviewRatingSelector({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (rating: number) => void;
}) {
  const { locale } = useLocale();

  return (
    <fieldset className="review-rating-fieldset">
      <legend className="review-rating-legend">
        {msg("reviews.form.rating", locale)}
      </legend>
      <div
        className="review-star-group"
        role="radiogroup"
        aria-label={msg("reviews.form.rating", locale)}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const selected = value === star;
          const filled = value !== null && star <= value;
          const starLabel = msgReplace("reviews.form.ratingStar", locale, {
            n: star,
          });
          return (
            <label
              key={star}
              className={
                filled
                  ? "review-star-option is-filled"
                  : "review-star-option"
              }
            >
              <input
                className="visually-hidden"
                type="radio"
                name="rating"
                value={star}
                checked={selected}
                onChange={() => onChange(star)}
              />
              <span className="review-star-button" aria-hidden="true">
                {filled ? "★" : "☆"}
              </span>
              <span className="visually-hidden">{starLabel}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
