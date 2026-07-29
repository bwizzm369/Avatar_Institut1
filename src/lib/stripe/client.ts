import Stripe from "stripe";
import { assertStripeCheckoutConfigured } from "@/lib/stripe/env";

let stripeClient: Stripe | null = null;

/** Server-only Stripe SDK client (secret key). */
export function getStripeClient(): Stripe {
  if (stripeClient) return stripeClient;
  const { secretKey } = assertStripeCheckoutConfigured();
  stripeClient = new Stripe(secretKey);
  return stripeClient;
}

/** Test helper — resets the cached client. */
export function resetStripeClientForTests(): void {
  stripeClient = null;
}
