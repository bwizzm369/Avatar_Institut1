import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  StudentPassStatus,
} from "@/lib/admin/student-pass/types";
import { STUDENT_PASS_STRIPE_SOURCE } from "@/lib/admin/student-pass/types";
import { assertCanMutateStudentPass } from "@/lib/admin/student-pass/types";
import { STUDENT_PASS_STRIPE_PURPOSE } from "@/lib/stripe/student-pass-checkout";
import type { Database } from "@/types/database";

export type StudentPassSyncClient = SupabaseClient<Database>;

export type StripeSubscriptionSnapshot = {
  id: string;
  status: string;
  customerId: string | null;
  startDateUnix: number | null;
  currentPeriodEndUnix: number | null;
  canceledAtUnix: number | null;
  metadata: Record<string, string>;
};

export type SyncStudentPassResult =
  | {
      ok: true;
      action: "activated" | "updated" | "cancelled" | "ignored";
      profileId: string;
      status: StudentPassStatus;
    }
  | { ok: false; error: string };

type SubscriptionRow = Database["public"]["Tables"]["student_pass_subscriptions"]["Row"];

function unixToIso(unix: number | null | undefined): string | null {
  if (unix == null || !Number.isFinite(unix) || unix <= 0) return null;
  return new Date(unix * 1000).toISOString();
}

function asMetadata(
  value: Record<string, string> | null | undefined,
): Record<string, string> {
  return value ?? {};
}

function customerIdFrom(
  customer: string | { id?: string | null } | null | undefined,
): string | null {
  if (typeof customer === "string" && customer.trim()) return customer.trim();
  if (customer && typeof customer === "object" && customer.id?.trim()) {
    return customer.id.trim();
  }
  return null;
}

function periodEndUnixFrom(subscription: {
  current_period_end?: number | null;
  items?: { data?: Array<{ current_period_end?: number | null }> } | null;
}): number | null {
  if (typeof subscription.current_period_end === "number") {
    return subscription.current_period_end;
  }
  const fromItem = subscription.items?.data?.[0]?.current_period_end;
  return typeof fromItem === "number" ? fromItem : null;
}

/**
 * Maps a Stripe Subscription into a plain snapshot (API-version tolerant).
 */
export function snapshotStripeSubscription(subscription: {
  id: string;
  status: string;
  customer?: string | { id?: string | null } | null;
  start_date?: number | null;
  canceled_at?: number | null;
  current_period_end?: number | null;
  items?: { data?: Array<{ current_period_end?: number | null }> } | null;
  metadata?: Record<string, string> | null;
}): StripeSubscriptionSnapshot {
  return {
    id: subscription.id,
    status: subscription.status,
    customerId: customerIdFrom(subscription.customer),
    startDateUnix: subscription.start_date ?? null,
    currentPeriodEndUnix: periodEndUnixFrom(subscription),
    canceledAtUnix: subscription.canceled_at ?? null,
    metadata: asMetadata(subscription.metadata),
  };
}

export function isStudentPassStripeSubscription(
  snapshot: Pick<StripeSubscriptionSnapshot, "metadata">,
): boolean {
  return snapshot.metadata.purpose === STUDENT_PASS_STRIPE_PURPOSE;
}

/**
 * Stripe status → existing Student Pass statuses.
 * Active/trialing/past_due keep entitlement; canceled maps to cancelled.
 */
export function mapStripeSubscriptionToStudentPassStatus(
  stripeStatus: string,
): StudentPassStatus {
  switch (stripeStatus) {
    case "active":
    case "trialing":
    case "past_due":
      return "active";
    case "canceled":
      return "cancelled";
    case "unpaid":
    case "incomplete_expired":
      return "expired";
    case "incomplete":
    case "paused":
    default:
      return "inactive";
  }
}

export function parseSubscriptionIdFromInvoice(invoice: {
  subscription?: string | { id?: string | null } | null;
  parent?: {
    subscription_details?: {
      subscription?: string | { id?: string | null } | null;
    } | null;
  } | null;
}): string | null {
  const candidates = [
    invoice.subscription,
    invoice.parent?.subscription_details?.subscription,
  ];
  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (value && typeof value === "object" && value.id?.trim()) {
      return value.id.trim();
    }
  }
  return null;
}

async function loadByProfile(
  client: StudentPassSyncClient,
  profileId: string,
): Promise<{ row: SubscriptionRow | null; error: string | null }> {
  const { data, error } = await client
    .from("student_pass_subscriptions")
    .select(
      "id, profile_id, status, started_at, expires_at, cancelled_at, source, stripe_customer_id, stripe_subscription_id, created_at, updated_at",
    )
    .eq("profile_id", profileId)
    .maybeSingle();

  if (error) return { row: null, error: error.message };
  return { row: (data as SubscriptionRow | null) ?? null, error: null };
}

async function loadByStripeSubscriptionId(
  client: StudentPassSyncClient,
  subscriptionId: string,
): Promise<{ row: SubscriptionRow | null; error: string | null }> {
  const { data, error } = await client
    .from("student_pass_subscriptions")
    .select(
      "id, profile_id, status, started_at, expires_at, cancelled_at, source, stripe_customer_id, stripe_subscription_id, created_at, updated_at",
    )
    .eq("stripe_subscription_id", subscriptionId)
    .maybeSingle();

  if (error) return { row: null, error: error.message };
  return { row: (data as SubscriptionRow | null) ?? null, error: null };
}

export async function resolveStudentPassProfileId(input: {
  supabase: StudentPassSyncClient;
  snapshot: StripeSubscriptionSnapshot;
  fallbackProfileId?: string | null;
}): Promise<string | null> {
  const fromMeta = input.snapshot.metadata.profile_id?.trim();
  if (fromMeta) return fromMeta;
  const fallback = input.fallbackProfileId?.trim();
  if (fallback) return fallback;

  const bySub = await loadByStripeSubscriptionId(
    input.supabase,
    input.snapshot.id,
  );
  if (bySub.row?.profile_id) return bySub.row.profile_id;
  return null;
}

/**
 * Central Stripe subscription → Student Pass synchronisation.
 * Idempotent upsert on profile_id. Never called from a success_url.
 */
export async function syncStudentPassFromStripeSubscription(input: {
  supabase: StudentPassSyncClient;
  snapshot: StripeSubscriptionSnapshot;
  profileId: string;
  now?: Date;
}): Promise<SyncStudentPassResult> {
  assertCanMutateStudentPass("service_role");

  const profileId = input.profileId.trim();
  if (!profileId) {
    return { ok: false, error: "missing_profile_id" };
  }
  if (!input.snapshot.id) {
    return { ok: false, error: "missing_subscription_id" };
  }

  const status = mapStripeSubscriptionToStudentPassStatus(input.snapshot.status);
  const now = input.now ?? new Date();
  const startedAt =
    unixToIso(input.snapshot.startDateUnix) ?? now.toISOString();
  const expiresAt = unixToIso(input.snapshot.currentPeriodEndUnix);
  const cancelledAt =
    status === "cancelled"
      ? unixToIso(input.snapshot.canceledAtUnix) ?? now.toISOString()
      : null;

  const { row, error: loadError } = await loadByProfile(
    input.supabase,
    profileId,
  );
  if (loadError) {
    return { ok: false, error: loadError };
  }

  const payload = {
    profile_id: profileId,
    status,
    started_at:
      row?.status === "active" && status === "active" && row.started_at
        ? row.started_at
        : startedAt,
    expires_at: expiresAt,
    cancelled_at: cancelledAt,
    source: STUDENT_PASS_STRIPE_SOURCE,
    stripe_customer_id: input.snapshot.customerId ?? row?.stripe_customer_id ?? null,
    stripe_subscription_id: input.snapshot.id,
  };

  if (row) {
    const { error } = await input.supabase
      .from("student_pass_subscriptions")
      .update(payload)
      .eq("id", row.id);

    if (error) {
      return { ok: false, error: error.message };
    }
  } else {
    const { error } = await input.supabase
      .from("student_pass_subscriptions")
      .insert(payload);

    if (error) {
      return { ok: false, error: error.message };
    }
  }

  const previousActive = row?.status === "active";
  const action =
    status === "cancelled"
      ? "cancelled"
      : status === "active" && !previousActive
        ? "activated"
        : "updated";

  return { ok: true, action, profileId, status };
}
