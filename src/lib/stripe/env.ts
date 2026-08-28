/**
 * Stripe environment helpers.
 * Publishable + secret keys are required for Checkout.
 * Webhook secret stays optional until generated via Stripe CLI / Dashboard.
 */

import type { StudentPassStripePlan } from "@/lib/admin/student-pass/types";
import { isStudentPassStripePlan } from "@/lib/admin/student-pass/types";

const PLACEHOLDER_MARKERS = [
  "pk_test_your_publishable_key",
  "sk_test_your_secret_key",
  "whsec_your_webhook_secret",
  "your_publishable_key",
  "your_secret_key",
  "your_webhook_secret",
  "price_your_student_pass_monthly",
  "price_your_student_pass_semiannual",
  "price_your_student_pass_annual",
];

function isFilled(value: string | undefined): value is string {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  return !PLACEHOLDER_MARKERS.some((marker) => trimmed.includes(marker));
}

export function getStripePublishableKey(): string | null {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!isFilled(key)) return null;
  return key.trim();
}

/** Browser-safe: only the publishable key is available client-side. */
export function isStripePublishableConfigured(): boolean {
  return getStripePublishableKey() !== null;
}

/** Server-only. Never expose to the browser. */
export function getStripeSecretKey(): string | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!isFilled(key)) return null;
  return key.trim();
}

/**
 * Server-only webhook signing secret.
 * Optional until `stripe listen` / Dashboard webhook endpoint is configured.
 */
export function getStripeWebhookSecret(): string | null {
  const key = process.env.STRIPE_WEBHOOK_SECRET;
  if (!isFilled(key)) return null;
  return key.trim();
}

const STUDENT_PASS_PRICE_ENV_KEYS: Record<StudentPassStripePlan, string> = {
  monthly: "STRIPE_STUDENT_PASS_MONTHLY_PRICE_ID",
  semiannual: "STRIPE_STUDENT_PASS_SEMIANNUAL_PRICE_ID",
  annual: "STRIPE_STUDENT_PASS_ANNUAL_PRICE_ID",
};

function readStripePriceId(value: string | undefined): string | null {
  if (!isFilled(value)) return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith("price_")) return null;
  return trimmed;
}

/**
 * Server-only Stripe Price ID for a Student Pass plan.
 * Never expose to the browser. The amount lives on the Stripe Price, not in Checkout.
 * Monthly still accepts the legacy STRIPE_STUDENT_PASS_PRICE_ID if the named var is unset.
 */
export function getStripeStudentPassPriceId(
  plan: StudentPassStripePlan,
): string | null {
  if (!isStudentPassStripePlan(plan)) return null;
  const named = readStripePriceId(process.env[STUDENT_PASS_PRICE_ENV_KEYS[plan]]);
  if (named) return named;
  if (plan === "monthly") {
    return readStripePriceId(process.env.STRIPE_STUDENT_PASS_PRICE_ID);
  }
  return null;
}

export function getStripeStudentPassPriceEnvKey(
  plan: StudentPassStripePlan,
): string {
  return STUDENT_PASS_PRICE_ENV_KEYS[plan];
}

/** Server-side: publishable + secret required for creating Checkout sessions. */
export function isStripeCheckoutConfigured(): boolean {
  return getStripePublishableKey() !== null && getStripeSecretKey() !== null;
}

/** Server-side: course Checkout config + all three Student Pass Price IDs. */
export function isStripeStudentPassCheckoutConfigured(): boolean {
  return (
    isStripeCheckoutConfigured() &&
    getStripeStudentPassPriceId("monthly") !== null &&
    getStripeStudentPassPriceId("semiannual") !== null &&
    getStripeStudentPassPriceId("annual") !== null
  );
}

export function assertStripeCheckoutConfigured(): {
  publishableKey: string;
  secretKey: string;
} {
  const publishableKey = getStripePublishableKey();
  const secretKey = getStripeSecretKey();
  if (!publishableKey || !secretKey) {
    throw new Error("STRIPE_NOT_CONFIGURED");
  }
  return { publishableKey, secretKey };
}

/**
 * Origin used for Stripe Checkout success_url / cancel_url.
 *
 * Priority:
 * 1. Vercel Preview → current deployment host (`VERCEL_URL`), never localhost
 * 2. Explicit `NEXT_PUBLIC_APP_URL` (local or production canonical)
 * 3. Other Vercel deployments without explicit URL → `VERCEL_URL`
 * 4. Local fallback → http://localhost:3000
 */
export function getAppOrigin(): string {
  const vercelEnv = process.env.VERCEL_ENV;
  const vercelHost = normalizeHost(process.env.VERCEL_URL);

  // Preview URLs are unique per deployment; always return here so a
  // mis-set NEXT_PUBLIC_APP_URL=http://localhost:3000 cannot break Checkout.
  if (vercelEnv === "preview" && vercelHost) {
    return `https://${vercelHost}`;
  }

  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (configured) {
    return configured;
  }

  if (vercelHost) {
    return `https://${vercelHost}`;
  }

  return "http://localhost:3000";
}

function normalizeHost(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}
