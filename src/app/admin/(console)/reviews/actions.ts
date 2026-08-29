"use server";

import { revalidatePath } from "next/cache";
import { getAdminAccess } from "@/lib/admin/access";
import {
  createReview,
  deleteReview,
  setReviewModerationStatus,
  setReviewPublished,
  updateReview,
  type ReviewMutationResult,
} from "@/lib/admin/reviews/mutations";
import type { ReviewModerationStatus } from "@/lib/reviews/types";
import { readReviewFormFields } from "@/lib/reviews/validation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const access = await getAdminAccess();
  if (access.status !== "ok") {
    return { error: "Access denied." as const, client: null };
  }
  const client = await createServerSupabaseClient();
  return { error: null, client };
}

function revalidateReviews() {
  revalidatePath("/admin/reviews");
  revalidatePath("/reviews");
  revalidatePath("/");
}

export async function createReviewAction(
  formData: FormData,
): Promise<ReviewMutationResult> {
  const gate = await requireAdmin();
  if (gate.error || !gate.client) {
    return { ok: false, error: gate.error ?? "Access denied." };
  }

  const result = await createReview({
    client: gate.client,
    input: readReviewFormFields(formData),
  });

  if (result.ok) {
    revalidateReviews();
  }
  return result;
}

export async function updateReviewAction(
  id: string,
  formData: FormData,
): Promise<ReviewMutationResult> {
  const gate = await requireAdmin();
  if (gate.error || !gate.client) {
    return { ok: false, error: gate.error ?? "Access denied." };
  }

  const result = await updateReview({
    client: gate.client,
    id,
    input: readReviewFormFields(formData),
  });

  if (result.ok) {
    revalidateReviews();
  }
  return result;
}

export async function setReviewPublishedAction(
  id: string,
  isPublished: boolean,
): Promise<ReviewMutationResult> {
  const gate = await requireAdmin();
  if (gate.error || !gate.client) {
    return { ok: false, error: gate.error ?? "Access denied." };
  }

  const result = await setReviewPublished({
    client: gate.client,
    id,
    isPublished,
  });

  if (result.ok) {
    revalidateReviews();
  }
  return result;
}

export async function setReviewModerationAction(
  id: string,
  status: ReviewModerationStatus,
): Promise<ReviewMutationResult> {
  const gate = await requireAdmin();
  if (gate.error || !gate.client) {
    return { ok: false, error: gate.error ?? "Access denied." };
  }

  const result = await setReviewModerationStatus({
    client: gate.client,
    id,
    status,
  });

  if (result.ok) {
    revalidateReviews();
  }
  return result;
}

export async function deleteReviewAction(
  id: string,
): Promise<ReviewMutationResult> {
  const gate = await requireAdmin();
  if (gate.error || !gate.client) {
    return { ok: false, error: gate.error ?? "Access denied." };
  }

  const result = await deleteReview({
    client: gate.client,
    id,
  });

  if (result.ok) {
    revalidateReviews();
  }
  return result;
}
