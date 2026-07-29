import { afterEach, describe, expect, it } from "vitest";
import {
  getStripeWebhookSecret,
  isStripeCheckoutConfigured,
  isStripePublishableConfigured,
} from "@/lib/stripe/env";

const KEYS = [
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
] as const;

const original = Object.fromEntries(
  KEYS.map((key) => [key, process.env[key]]),
) as Record<(typeof KEYS)[number], string | undefined>;

afterEach(() => {
  for (const key of KEYS) {
    if (original[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = original[key];
    }
  }
});

describe("Stripe env validation", () => {
  it("treats webhook secret as optional", () => {
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test_demo_key";
    process.env.STRIPE_SECRET_KEY = "sk_test_demo_key";
    delete process.env.STRIPE_WEBHOOK_SECRET;

    expect(isStripePublishableConfigured()).toBe(true);
    expect(isStripeCheckoutConfigured()).toBe(true);
    expect(getStripeWebhookSecret()).toBeNull();
  });

  it("rejects placeholder Stripe values", () => {
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test_your_publishable_key";
    process.env.STRIPE_SECRET_KEY = "sk_test_your_secret_key";
    expect(isStripeCheckoutConfigured()).toBe(false);
  });
});
