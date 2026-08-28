import type Stripe from "stripe";
import {
  grantEnrollmentsAfterPayment,
  parseCourseIdsFromMetadata,
  parseUserIdFromSession,
  type EnrollmentGrantClient,
} from "@/lib/enrollments/grant";
import { getStripeWebhookSecret } from "@/lib/stripe/env";
import {
  classifyCheckoutSession,
  parseProfileIdFromStripeObject,
} from "@/lib/stripe/student-pass-checkout";
import {
  isStudentPassStripeSubscription,
  parseSubscriptionIdFromInvoice,
  snapshotStripeSubscription,
  syncStudentPassFromStripeSubscription,
  type StudentPassSyncClient,
} from "@/lib/stripe/student-pass-sync";

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

export type StripeWebhookDispatchResult =
  | {
      ok: true;
      action: string;
      grantedCourseIds?: string[];
      profileId?: string;
      ignored?: boolean;
    }
  | { ok: false; error: string };

const processedEventIds = new Set<string>();

const STUDENT_PASS_SUBSCRIPTION_EVENTS = new Set([
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
]);

const STUDENT_PASS_INVOICE_EVENTS = new Set([
  "invoice.paid",
  "invoice.payment_failed",
]);

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

export type RetrieveStripeSubscription = (
  subscriptionId: string,
) => Promise<{
  id: string;
  status: string;
  customer?: string | { id?: string | null } | null;
  start_date?: number | null;
  canceled_at?: number | null;
  current_period_end?: number | null;
  items?: { data?: Array<{ current_period_end?: number | null }> } | null;
  metadata?: Record<string, string> | null;
} | null>;

async function syncFromSubscriptionObject(input: {
  eventId: string;
  supabase: StudentPassSyncClient;
  subscription: Parameters<typeof snapshotStripeSubscription>[0];
  fallbackProfileId?: string | null;
}): Promise<StripeWebhookDispatchResult> {
  if (processedEventIds.has(input.eventId)) {
    return { ok: true, action: "already_processed" };
  }

  const snapshot = snapshotStripeSubscription(input.subscription);
  const { data: bySub } = await input.supabase
    .from("student_pass_subscriptions")
    .select("profile_id")
    .eq("stripe_subscription_id", snapshot.id)
    .maybeSingle();

  if (
    !isStudentPassStripeSubscription(snapshot) &&
    !input.fallbackProfileId &&
    !bySub?.profile_id
  ) {
    return { ok: true, action: "ignored", ignored: true };
  }

  const profileId =
    snapshot.metadata.profile_id?.trim() ||
    input.fallbackProfileId?.trim() ||
    bySub?.profile_id ||
    null;

  if (!profileId) {
    return { ok: false, error: "missing_profile_id" };
  }

  const synced = await syncStudentPassFromStripeSubscription({
    supabase: input.supabase,
    snapshot,
    profileId,
  });

  if (!synced.ok) {
    return synced;
  }

  processedEventIds.add(input.eventId);
  return {
    ok: true,
    action: synced.action,
    profileId: synced.profileId,
  };
}

async function processStudentPassCheckoutCompleted(input: {
  event: Stripe.Event;
  supabase: StudentPassSyncClient;
  retrieveSubscription?: RetrieveStripeSubscription;
}): Promise<StripeWebhookDispatchResult> {
  if (processedEventIds.has(input.event.id)) {
    return { ok: true, action: "already_processed" };
  }

  const session = input.event.data.object as Stripe.Checkout.Session;
  const profileId = parseProfileIdFromStripeObject({
    metadata: session.metadata,
    client_reference_id: session.client_reference_id,
  });

  const subscriptionRef = session.subscription;
  const subscriptionId =
    typeof subscriptionRef === "string"
      ? subscriptionRef
      : subscriptionRef && typeof subscriptionRef === "object"
        ? subscriptionRef.id
        : null;

  if (!subscriptionId) {
    return { ok: true, action: "ignored", ignored: true };
  }

  let subscription: Parameters<typeof snapshotStripeSubscription>[0] | null =
    typeof subscriptionRef === "object" && subscriptionRef
      ? (subscriptionRef as Parameters<typeof snapshotStripeSubscription>[0])
      : null;

  if (!subscription && input.retrieveSubscription) {
    subscription = await input.retrieveSubscription(subscriptionId);
  }

  if (!subscription) {
    return { ok: false, error: "missing_subscription" };
  }

  return syncFromSubscriptionObject({
    eventId: input.event.id,
    supabase: input.supabase,
    subscription,
    fallbackProfileId: profileId,
  });
}

/**
 * Single dispatcher for the existing `/api/stripe/webhook` route.
 * Course Checkout and Student Pass subscriptions share signature verification;
 * they do not share grant logic.
 */
export async function dispatchStripeWebhookEvent(input: {
  event: Stripe.Event;
  supabase: EnrollmentGrantClient & StudentPassSyncClient;
  retrieveSubscription?: RetrieveStripeSubscription;
}): Promise<StripeWebhookDispatchResult> {
  const { event } = input;

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const kind = classifyCheckoutSession(session);

    if (kind === "student_pass") {
      return processStudentPassCheckoutCompleted({
        event,
        supabase: input.supabase,
        retrieveSubscription: input.retrieveSubscription,
      });
    }

    const enrolled = await processCheckoutSessionCompleted({
      event,
      supabase: input.supabase,
    });
    if (!enrolled.ok) return enrolled;
    return {
      ok: true,
      action: enrolled.action,
      grantedCourseIds: enrolled.grantedCourseIds,
    };
  }

  if (STUDENT_PASS_SUBSCRIPTION_EVENTS.has(event.type)) {
    const subscription = event.data.object as Stripe.Subscription;
    return syncFromSubscriptionObject({
      eventId: event.id,
      supabase: input.supabase,
      subscription,
    });
  }

  if (STUDENT_PASS_INVOICE_EVENTS.has(event.type)) {
    if (processedEventIds.has(event.id)) {
      return { ok: true, action: "already_processed" };
    }
    const invoice = event.data.object as Stripe.Invoice;
    const subscriptionId = parseSubscriptionIdFromInvoice(invoice);
    if (!subscriptionId) {
      return { ok: true, action: "ignored", ignored: true };
    }
    if (!input.retrieveSubscription) {
      return { ok: true, action: "ignored", ignored: true };
    }
    const subscription = await input.retrieveSubscription(subscriptionId);
    if (!subscription) {
      return { ok: true, action: "ignored", ignored: true };
    }
    return syncFromSubscriptionObject({
      eventId: event.id,
      supabase: input.supabase,
      subscription,
    });
  }

  return { ok: true, action: "ignored", ignored: true };
}
