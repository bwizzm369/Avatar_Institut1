import {
  STUDENT_PASS_STRIPE_PLAN_SPECS,
  isStudentPassStripePlan,
  type StudentPassStripePlan,
} from "@/lib/admin/student-pass/types";
import { getAppOrigin } from "@/lib/stripe/env";

export const STUDENT_PASS_STRIPE_PURPOSE = "student_pass";

export type StripePriceLike = {
  id?: string;
  unit_amount?: number | null;
  currency?: string | null;
  type?: string | null;
  recurring?: {
    interval?: string | null;
    interval_count?: number | null;
  } | null;
};

export type ParseStudentPassCheckoutRequestResult =
  | { ok: true; plan: StudentPassStripePlan }
  | {
      ok: false;
      error:
        | "unauthenticated"
        | "invalid_body"
        | "client_price_rejected"
        | "unknown_plan";
    };

export type StudentPassCheckoutKind = "student_pass" | "courses" | "unknown";

/**
 * Browser may send `{ purpose: "student_pass", plan: "monthly" | "semiannual" | "annual" }`.
 * Any client-supplied price/amount/user id/price_id is rejected.
 */
export function parseStudentPassCheckoutRequest(
  userId: string | null,
  body: unknown,
): ParseStudentPassCheckoutRequestResult {
  if (!userId) {
    return { ok: false, error: "unauthenticated" };
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { ok: false, error: "invalid_body" };
  }

  const record = body as Record<string, unknown>;

  if (
    "user_id" in record ||
    "userId" in record ||
    "user" in record ||
    "profile_id" in record ||
    "profileId" in record
  ) {
    return { ok: false, error: "invalid_body" };
  }

  if (
    "priceCents" in record ||
    "price_cents" in record ||
    "amount" in record ||
    "unit_amount" in record ||
    "currency" in record ||
    "prices" in record ||
    "price" in record ||
    "priceId" in record ||
    "price_id" in record
  ) {
    return { ok: false, error: "client_price_rejected" };
  }

  if (
    "purpose" in record &&
    record.purpose !== STUDENT_PASS_STRIPE_PURPOSE
  ) {
    return { ok: false, error: "invalid_body" };
  }

  const planRaw = record.plan;
  if (typeof planRaw !== "string" || !isStudentPassStripePlan(planRaw)) {
    return { ok: false, error: "unknown_plan" };
  }

  return { ok: true, plan: planRaw };
}

export function assertStudentPassStripePrice(
  price: StripePriceLike | null | undefined,
  plan: StudentPassStripePlan,
): { ok: true } | { ok: false; error: "invalid_price" } {
  if (!price || !isStudentPassStripePlan(plan)) {
    return { ok: false, error: "invalid_price" };
  }
  const spec = STUDENT_PASS_STRIPE_PLAN_SPECS[plan];
  if (price.unit_amount !== spec.cents) {
    return { ok: false, error: "invalid_price" };
  }
  if ((price.currency ?? "").toLowerCase() !== "eur") {
    return { ok: false, error: "invalid_price" };
  }
  if (price.type != null && price.type !== "recurring") {
    return { ok: false, error: "invalid_price" };
  }
  if (price.recurring?.interval !== spec.interval) {
    return { ok: false, error: "invalid_price" };
  }
  if (
    price.recurring.interval_count != null &&
    price.recurring.interval_count !== spec.intervalCount
  ) {
    return { ok: false, error: "invalid_price" };
  }
  return { ok: true };
}

export function buildStudentPassCheckoutSessionParams(input: {
  profileId: string;
  priceId: string;
  customerId: string;
  plan: StudentPassStripePlan;
}): {
  mode: "subscription";
  customer: string;
  client_reference_id: string;
  line_items: Array<{ price: string; quantity: number }>;
  success_url: string;
  cancel_url: string;
  metadata: {
    purpose: typeof STUDENT_PASS_STRIPE_PURPOSE;
    profile_id: string;
    plan: StudentPassStripePlan;
  };
  subscription_data: {
    metadata: {
      purpose: typeof STUDENT_PASS_STRIPE_PURPOSE;
      profile_id: string;
      plan: StudentPassStripePlan;
    };
  };
} {
  const origin = getAppOrigin();
  const metadata = {
    purpose: STUDENT_PASS_STRIPE_PURPOSE,
    profile_id: input.profileId,
    plan: input.plan,
  } as const;

  return {
    mode: "subscription",
    customer: input.customerId,
    client_reference_id: input.profileId,
    line_items: [{ price: input.priceId, quantity: 1 }],
    success_url: `${origin}/dashboard/student-pass?checkout=success`,
    cancel_url: `${origin}/dashboard/student-pass?checkout=cancelled`,
    metadata,
    subscription_data: { metadata },
  };
}

export function classifyCheckoutSession(session: {
  mode?: string | null;
  metadata?: Record<string, string> | null;
}): StudentPassCheckoutKind {
  const purpose = session.metadata?.purpose?.trim();
  if (purpose === STUDENT_PASS_STRIPE_PURPOSE) {
    return "student_pass";
  }
  const courseIds = session.metadata?.course_ids?.trim();
  if (courseIds) {
    return "courses";
  }
  if (session.mode === "subscription") {
    return "student_pass";
  }
  if (session.mode === "payment") {
    return "courses";
  }
  return "unknown";
}

export function parseProfileIdFromStripeObject(input: {
  metadata?: Record<string, string> | null;
  client_reference_id?: string | null;
}): string | null {
  const fromMeta = input.metadata?.profile_id?.trim();
  if (fromMeta) return fromMeta;
  const fromRef = input.client_reference_id?.trim();
  return fromRef || null;
}

export function isLiveStripeStudentPassStatus(status: string | null | undefined): boolean {
  return (
    status === "active" ||
    status === "trialing" ||
    status === "past_due"
  );
}
