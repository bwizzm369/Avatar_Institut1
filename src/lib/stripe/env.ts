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
