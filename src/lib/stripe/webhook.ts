import type Stripe from "stripe";
import {
  grantEnrollmentsAfterPayment,
  parseCourseIdsFromMetadata,
  parseUserIdFromSession,
  type EnrollmentGrantClient,
} from "@/lib/enrollments/grant";
import { getStripeWebhookSecret } from "@/lib/stripe/env";

export type WebhookVerifyResult =
  | { ok: true; event: Stripe.Event }
  | {
      ok: false;
      error: "missing_secret" | "missing_signature" | "invalid_signature";
    };

export type ProcessCheckoutCompletedResult =
  | {
      ok: true;
      action: "enrolled" | "ignored_unpaid" | "already_processed";
      grantedCourseIds: string[];
    }
  | { ok: false; error: string };

const processedEventIds = new Set<string>();

/** Test helper — clears in-memory idempotency keys. */
export function resetProcessedStripeEventsForTests(): void {
  processedEventIds.clear();
}

export function verifyStripeWebhookEvent(input: {
  stripe: Stripe;
  rawBody: string | Buffer;
  signature: string | null;
}): WebhookVerifyResult {
  const secret = getStripeWebhookSecret();
  if (!secret) {
    return { ok: false, error: "missing_secret" };
  }
  if (!input.signature) {
    return { ok: false, error: "missing_signature" };
  }

  try {
    const event = input.stripe.webhooks.constructEvent(
      input.rawBody,
      input.signature,
      secret,
    );
    return { ok: true, event };
  } catch {
    return { ok: false, error: "invalid_signature" };
  }
}

/**
 * Handles checkout.session.completed.
 * Grants access only when payment_status === "paid".
 * Never grants from success redirects.
 */
export async function processCheckoutSessionCompleted(input: {
  event: Stripe.Event;
  supabase: EnrollmentGrantClient;
}): Promise<ProcessCheckoutCompletedResult> {
  if (input.event.type !== "checkout.session.completed") {
    return { ok: true, action: "ignored_unpaid", grantedCourseIds: [] };
  }

  if (processedEventIds.has(input.event.id)) {
    return { ok: true, action: "already_processed", grantedCourseIds: [] };
  }

  const session = input.event.data.object as Stripe.Checkout.Session;

  if (session.payment_status !== "paid") {
    return { ok: true, action: "ignored_unpaid", grantedCourseIds: [] };
  }

  const userId = parseUserIdFromSession(session);
  const courseIds = parseCourseIdsFromMetadata(session.metadata);

  if (!userId || courseIds.length === 0) {
    return { ok: false, error: "missing_metadata" };
  }

  const grant = await grantEnrollmentsAfterPayment({
    supabase: input.supabase,
    userId,
    courseIds,
  });

  if (!grant.ok) {
    return { ok: false, error: grant.error };
  }

  processedEventIds.add(input.event.id);

  return {
    ok: true,
    action: "enrolled",
    grantedCourseIds: grant.grantedCourseIds,
  };
}
