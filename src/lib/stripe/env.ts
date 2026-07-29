/**
 * Stripe environment helpers.
 * Publishable + secret keys are required for Checkout.
 * Webhook secret stays optional until generated via Stripe CLI / Dashboard.
 */

const PLACEHOLDER_MARKERS = [
  "pk_test_your_publishable_key",
  "sk_test_your_secret_key",
  "whsec_your_webhook_secret",
  "your_publishable_key",
  "your_secret_key",
  "your_webhook_secret",
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

/** Server-side: publishable + secret required for creating Checkout sessions. */
export function isStripeCheckoutConfigured(): boolean {
  return getStripePublishableKey() !== null && getStripeSecretKey() !== null;
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

export function getAppOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}
