"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ReviewRatingSelector } from "@/components/ReviewRatingSelector";
import { ReviewStars } from "@/components/ReviewStars";
import { useLocale } from "@/components/LocaleProvider";
import { submitStudentReviewAction } from "@/app/reviews/actions";
import { msg, msgReplace } from "@/lib/i18n";
import type { StudentReviewPageState } from "@/lib/reviews/types";

function errorMessageKey(
  error: string,
): string {
  if (error === "unauthenticated") return "reviews.error.unauthenticated";
  if (error === "rating") return "reviews.error.ratingRequired";
  if (error === "quote") return "reviews.error.textRequired";
  if (error === "tooLong") return "reviews.error.tooLong";
  if (error === "alreadySubmitted") return "reviews.error.alreadySubmitted";
  if (error === "config") return "reviews.error.failed";
  return "reviews.error.failed";
}

export function ReviewSubmitSection({
  state,
}: {
  state: StudentReviewPageState;
}) {
  const { locale } = useLocale();
  const router = useRouter();
  const [rating, setRating] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const [localSubmitted, setLocalSubmitted] = useState(false);
  const [feedbackKey, setFeedbackKey] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    rating?: string;
    quote?: string;
  }>({});

  if (!state.authenticated) {
    return (
      <section className="section reviews-submit-section">
        <div className="container">
          <div className="consultation-form reviews-submit-card">
            <h2 className="display">{msg("reviews.form.loginTitle", locale)}</h2>
            <p className="muted">{msg("reviews.form.loginBody", locale)}</p>
            <Link href="/login?next=/reviews" className="btn btn-primary">
              {msg("reviews.form.loginCta", locale)}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (state.existing || localSubmitted) {
    const status = state.existing?.moderation_status ?? "pending";
    const titleKey =
      status === "approved"
        ? "reviews.status.approvedTitle"
        : status === "rejected"
          ? "reviews.status.rejectedTitle"
          : "reviews.status.pendingTitle";
    const bodyKey =
      status === "approved"
        ? "reviews.status.approvedBody"
        : status === "rejected"
          ? "reviews.status.rejectedBody"
          : "reviews.status.pendingBody";
    const ratingValue = state.existing?.rating ?? rating;
    const ratingLabel = msgReplace("reviews.ratingAria", locale, {
      n: ratingValue ?? 0,
    });

    return (
      <section className="section reviews-submit-section">
        <div className="container">
          <div className="consultation-form reviews-submit-card" role="status">
            <h2 className="display">{msg(titleKey, locale)}</h2>
            <p>{msg(bodyKey, locale)}</p>
            {ratingValue ? (
              <ReviewStars rating={ratingValue} label={ratingLabel} />
            ) : null}
          </div>
        </div>
      </section>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedbackKey(null);
    setFieldErrors({});

    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("locale", locale);
    if (rating !== null) {
      formData.set("rating", String(rating));
    }

    setPending(true);
    try {
      const result = await submitStudentReviewAction(formData);
      if (!result.ok) {
        setFieldErrors(result.fieldErrors ?? {});
        setFeedbackKey(errorMessageKey(result.error));
        return;
      }
      setLocalSubmitted(true);
      form.reset();
      router.refresh();
    } catch {
      setFeedbackKey("reviews.error.failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="section reviews-submit-section">
      <div className="container">
        <form
          className="form-stack consultation-form reviews-submit-card"
          onSubmit={handleSubmit}
          noValidate
        >
          <h2 className="display">{msg("reviews.form.title", locale)}</h2>
          <p className="muted">{msg("reviews.form.lead", locale)}</p>
          {state.displayName ? (
            <p className="small">
              {msgReplace("reviews.form.as", locale, {
                name: state.displayName,
              })}
            </p>
          ) : null}

          <ReviewRatingSelector value={rating} onChange={setRating} />
          {fieldErrors.rating ? (
            <p className="form-error" role="alert">
              {msg("reviews.error.ratingRequired", locale)}
            </p>
          ) : null}

          <div className="form-field">
            <label htmlFor="student-review-quote">
              {msg("reviews.form.text", locale)}
            </label>
            <textarea
              id="student-review-quote"
              name="quote"
              rows={5}
              maxLength={2000}
              required
              dir={locale === "ar" ? "rtl" : "ltr"}
              lang={locale}
            />
            {fieldErrors.quote ? (
              <p className="form-error" role="alert">
                {fieldErrors.quote === "tooLong"
                  ? msg("reviews.error.tooLong", locale)
                  : msg("reviews.error.textRequired", locale)}
              </p>
            ) : null}
          </div>

          {feedbackKey ? (
            <p className="form-error" role="alert">
              {msg(feedbackKey, locale)}
            </p>
          ) : null}

          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending
              ? msg("reviews.form.submitting", locale)
              : msg("reviews.form.submit", locale)}
          </button>
        </form>
      </div>
    </section>
  );
}
