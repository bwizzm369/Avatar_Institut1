"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import {
  createReviewAction,
  deleteReviewAction,
  setReviewModerationAction,
  setReviewPublishedAction,
  updateReviewAction,
} from "@/app/admin/(console)/reviews/actions";
import type { AdminReview, ReviewModerationStatus } from "@/lib/reviews/types";

function moderationLabel(status: ReviewModerationStatus): string {
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  return "Pending";
}

function moderationClass(status: ReviewModerationStatus): string {
  if (status === "approved") return "admin-status admin-status-ready";
  if (status === "rejected") return "admin-status admin-status-error";
  return "admin-status admin-status-warning";
}

function submittedDate(value: string): string {
  return value.slice(0, 10);
}

function ReviewEditorForm({
  review,
  onSubmit,
  pending,
  submitLabel,
}: {
  review?: AdminReview;
  onSubmit: (formData: FormData) => void;
  pending: boolean;
  submitLabel: string;
}) {
  return (
    <form
      className="admin-form admin-review-form"
      onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        onSubmit(new FormData(event.currentTarget));
      }}
    >
      <div className="admin-field">
        <label htmlFor={`authorName-${review?.id ?? "new"}`}>Author name *</label>
        <input
          id={`authorName-${review?.id ?? "new"}`}
          name="authorName"
          required
          defaultValue={review?.author_name ?? ""}
        />
      </div>
      <div className="admin-field-row">
        <div className="admin-field">
          <label htmlFor={`authorTitleEn-${review?.id ?? "new"}`}>
            Title (English)
          </label>
          <input
            id={`authorTitleEn-${review?.id ?? "new"}`}
            name="authorTitleEn"
            defaultValue={review?.author_title_en ?? ""}
          />
        </div>
        <div className="admin-field">
          <label htmlFor={`authorTitleAr-${review?.id ?? "new"}`}>
            Title (Arabic)
          </label>
          <input
            id={`authorTitleAr-${review?.id ?? "new"}`}
            name="authorTitleAr"
            defaultValue={review?.author_title_ar ?? ""}
            dir="rtl"
            lang="ar"
          />
        </div>
      </div>
      <div className="admin-field">
        <label htmlFor={`quoteEn-${review?.id ?? "new"}`}>Quote (English)</label>
        <textarea
          id={`quoteEn-${review?.id ?? "new"}`}
          name="quoteEn"
          rows={4}
          defaultValue={review?.quote_en ?? ""}
        />
      </div>
      <div className="admin-field">
        <label htmlFor={`quoteAr-${review?.id ?? "new"}`}>Quote (Arabic)</label>
        <textarea
          id={`quoteAr-${review?.id ?? "new"}`}
          name="quoteAr"
          rows={4}
          defaultValue={review?.quote_ar ?? ""}
          dir="rtl"
          lang="ar"
        />
        <p className="admin-field-hint">
          At least one language is required. Empty copy falls back to the other
          language on the public site.
        </p>
      </div>
      <div className="admin-field-row">
        <div className="admin-field">
          <label htmlFor={`sortOrder-${review?.id ?? "new"}`}>Sort order</label>
          <input
            id={`sortOrder-${review?.id ?? "new"}`}
            name="sortOrder"
            type="number"
            min={0}
            max={9999}
            defaultValue={review?.sort_order ?? 0}
          />
        </div>
        <label className="admin-check">
          <input
            type="checkbox"
            name="isPublished"
            value="true"
            defaultChecked={review?.is_published ?? false}
          />
          Published
        </label>
      </div>
      <div className="admin-form-actions">
        <button
          type="submit"
          className="admin-btn-primary admin-btn-inline"
          disabled={pending}
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

export function ReviewsClient({ reviews }: { reviews: AdminReview[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formEpoch, setFormEpoch] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState(false);

  function run(
    action: () => Promise<{ ok: boolean; error?: string }>,
    successMessage: string,
    resetCreate = false,
  ) {
    setFeedback(null);
    setFeedbackError(false);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setFeedbackError(true);
        setFeedback(result.error ?? "Unable to save.");
        return;
      }
      setFeedbackError(false);
      setFeedback(successMessage);
      setEditingId(null);
      if (resetCreate) setFormEpoch((value) => value + 1);
      router.refresh();
    });
  }

  return (
    <div className="admin-reviews">
      {feedback ? (
        <div
          className={
            feedbackError
              ? "admin-alert admin-alert-error"
              : "admin-alert admin-alert-success"
          }
          role="status"
        >
          <p>{feedback}</p>
        </div>
      ) : null}

      <section className="admin-panel" aria-label="New testimonial">
        <h2>New testimonial</h2>
        <ReviewEditorForm
          key={formEpoch}
          pending={pending}
          submitLabel="Create"
          onSubmit={(formData) =>
            run(() => createReviewAction(formData), "Testimonial created.", true)
          }
        />
      </section>

      <div className="admin-table-wrap admin-panel">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Author</th>
              <th>Rating</th>
              <th>Quote</th>
              <th>Status</th>
              <th>Submitted</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reviews.length === 0 ? (
              <tr>
                <td colSpan={6} className="admin-table-empty">
                  No testimonials yet.
                </td>
              </tr>
            ) : (
              reviews.map((review) => (
                <tr key={review.id}>
                  <td>
                    {review.author_name}
                    <p className="admin-table-note">
                      {review.author_title_en || review.author_title_ar || "—"}
                    </p>
                    <p className="admin-table-note">Order {review.sort_order}</p>
                  </td>
                  <td>{review.rating ? `${review.rating} / 5` : "—"}</td>
                  <td>
                    <p
                      className="admin-request-message"
                      dir={review.quote_en ? "ltr" : "rtl"}
                    >
                      {review.quote_en || review.quote_ar}
                    </p>
                    {editingId === review.id ? (
                      <div className="admin-request-detail">
                        <ReviewEditorForm
                          review={review}
                          pending={pending}
                          submitLabel="Save"
                          onSubmit={(formData) =>
                            run(
                              () => updateReviewAction(review.id, formData),
                              "Testimonial updated.",
                            )
                          }
                        />
                      </div>
                    ) : null}
                  </td>
                  <td>
                    <span className={moderationClass(review.moderation_status)}>
                      {moderationLabel(review.moderation_status)}
                    </span>
                  </td>
                  <td>{submittedDate(review.created_at)}</td>
                  <td>
                    <div className="admin-inline-actions">
                      {review.moderation_status === "pending" ? (
                        <>
                          <button
                            type="button"
                            className="admin-btn-primary admin-btn-inline"
                            disabled={pending}
                            onClick={() =>
                              run(
                                () =>
                                  setReviewModerationAction(
                                    review.id,
                                    "approved",
                                  ),
                                "Approved.",
                              )
                            }
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="admin-btn-ghost admin-btn-inline"
                            disabled={pending}
                            onClick={() =>
                              run(
                                () =>
                                  setReviewModerationAction(
                                    review.id,
                                    "rejected",
                                  ),
                                "Rejected.",
                              )
                            }
                          >
                            Reject
                          </button>
                        </>
                      ) : null}
                      {review.moderation_status === "approved" ? (
                        <button
                          type="button"
                          className="admin-btn-primary admin-btn-inline"
                          disabled={pending}
                          onClick={() =>
                            run(
                              () =>
                                setReviewPublishedAction(review.id, false),
                              "Unpublished.",
                            )
                          }
                        >
                          Unpublish
                        </button>
                      ) : null}
                      {review.moderation_status === "rejected" ? (
                        <button
                          type="button"
                          className="admin-btn-primary admin-btn-inline"
                          disabled={pending}
                          onClick={() =>
                            run(
                              () =>
                                setReviewModerationAction(
                                  review.id,
                                  "approved",
                                ),
                              "Approved.",
                            )
                          }
                        >
                          Approve
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="admin-btn-ghost admin-btn-inline"
                        onClick={() =>
                          setEditingId(
                            editingId === review.id ? null : review.id,
                          )
                        }
                      >
                        {editingId === review.id ? "Close" : "Edit"}
                      </button>
                      <button
                        type="button"
                        className="admin-btn-ghost admin-btn-inline"
                        disabled={pending}
                        onClick={() => {
                          if (
                            !window.confirm(
                              `Delete the testimonial by ${review.author_name}?`,
                            )
                          ) {
                            return;
                          }
                          run(
                            () => deleteReviewAction(review.id),
                            "Testimonial deleted.",
                          );
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
