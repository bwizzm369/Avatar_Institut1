import { afterEach, describe, expect, it } from "vitest";
import {
  getAppOrigin,
  getStripeStudentPassPriceId,
  getStripeWebhookSecret,
  isStripeCheckoutConfigured,
  isStripePublishableConfigured,
  isStripeStudentPassCheckoutConfigured,
} from "@/lib/stripe/env";

const KEYS = [
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_STUDENT_PASS_PRICE_ID",
  "STRIPE_STUDENT_PASS_MONTHLY_PRICE_ID",
  "STRIPE_STUDENT_PASS_SEMIANNUAL_PRICE_ID",
  "STRIPE_STUDENT_PASS_ANNUAL_PRICE_ID",
  "NEXT_PUBLIC_APP_URL",
  "VERCEL_ENV",
  "VERCEL_URL",
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

  it("requires real Student Pass Price IDs for all three plans", () => {
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test_demo_key";
    process.env.STRIPE_SECRET_KEY = "sk_test_demo_key";
    process.env.STRIPE_STUDENT_PASS_MONTHLY_PRICE_ID =
      "price_your_student_pass_monthly";
    process.env.STRIPE_STUDENT_PASS_SEMIANNUAL_PRICE_ID =
      "price_your_student_pass_semiannual";
    process.env.STRIPE_STUDENT_PASS_ANNUAL_PRICE_ID =
      "price_your_student_pass_annual";
    expect(getStripeStudentPassPriceId("monthly")).toBeNull();
    expect(isStripeStudentPassCheckoutConfigured()).toBe(false);

    process.env.STRIPE_STUDENT_PASS_MONTHLY_PRICE_ID = "price_test_monthly_12";
    process.env.STRIPE_STUDENT_PASS_SEMIANNUAL_PRICE_ID = "price_test_semi_72";
    process.env.STRIPE_STUDENT_PASS_ANNUAL_PRICE_ID = "price_test_annual_144";
    expect(getStripeStudentPassPriceId("monthly")).toBe("price_test_monthly_12");
    expect(getStripeStudentPassPriceId("semiannual")).toBe("price_test_semi_72");
    expect(getStripeStudentPassPriceId("annual")).toBe("price_test_annual_144");
    expect(isStripeStudentPassCheckoutConfigured()).toBe(true);
  });
});

describe("getAppOrigin for Stripe redirect URLs", () => {
  it("falls back to localhost when no Vercel or app URL is set", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.VERCEL_ENV;
    delete process.env.VERCEL_URL;

    expect(getAppOrigin()).toBe("http://localhost:3000");
  });

  it("uses NEXT_PUBLIC_APP_URL locally", () => {
    delete process.env.VERCEL_ENV;
    delete process.env.VERCEL_URL;
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000/";

    expect(getAppOrigin()).toBe("http://localhost:3000");
  });

  it("prefers the current Preview deployment host over a localhost app URL", () => {
    process.env.VERCEL_ENV = "preview";
    process.env.VERCEL_URL =
      "avatar-institut-platform-qs9c4nnjv-avatar313.vercel.app";
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";

    expect(getAppOrigin()).toBe(
      "https://avatar-institut-platform-qs9c4nnjv-avatar313.vercel.app",
    );
  });

  it("uses NEXT_PUBLIC_APP_URL on production when configured", () => {
    process.env.VERCEL_ENV = "production";
    process.env.VERCEL_URL = "avatar-institut-platform.vercel.app";
    process.env.NEXT_PUBLIC_APP_URL = "https://avatar-institut-platform.vercel.app";

    expect(getAppOrigin()).toBe("https://avatar-institut-platform.vercel.app");
  });

  it("falls back to VERCEL_URL on production without NEXT_PUBLIC_APP_URL", () => {
    process.env.VERCEL_ENV = "production";
    process.env.VERCEL_URL = "avatar-institut-platform.vercel.app";
    delete process.env.NEXT_PUBLIC_APP_URL;

    expect(getAppOrigin()).toBe("https://avatar-institut-platform.vercel.app");
  });
});
