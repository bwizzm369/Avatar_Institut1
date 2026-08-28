import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  STUDENT_PASS_STRIPE_PLAN_SPECS,
  type StudentPassStripePlan,
} from "@/lib/admin/student-pass/types";
import {
  assertStudentPassStripePrice,
  buildStudentPassCheckoutSessionParams,
  classifyCheckoutSession,
  parseStudentPassCheckoutRequest,
  STUDENT_PASS_STRIPE_PURPOSE,
} from "@/lib/stripe/student-pass-checkout";
import { getStripeStudentPassPriceId } from "@/lib/stripe/env";

describe("Student Pass Checkout request validation", () => {
  it("refuses unauthenticated students", () => {
    expect(parseStudentPassCheckoutRequest(null, { plan: "monthly" })).toEqual({
      ok: false,
      error: "unauthenticated",
    });
  });

  it("accepts a controlled plan from an authenticated student", () => {
    expect(
      parseStudentPassCheckoutRequest("profile-1", {
        purpose: STUDENT_PASS_STRIPE_PURPOSE,
        plan: "monthly",
      }),
    ).toEqual({ ok: true, plan: "monthly" });
    expect(
      parseStudentPassCheckoutRequest("profile-1", { plan: "semiannual" }),
    ).toEqual({ ok: true, plan: "semiannual" });
    expect(
      parseStudentPassCheckoutRequest("profile-1", { plan: "annual" }),
    ).toEqual({ ok: true, plan: "annual" });
  });

  it("rejects an unknown plan", () => {
    expect(parseStudentPassCheckoutRequest("profile-1", {})).toEqual({
      ok: false,
      error: "unknown_plan",
    });
    expect(
      parseStudentPassCheckoutRequest("profile-1", { plan: "weekly" }),
    ).toEqual({ ok: false, error: "unknown_plan" });
    expect(
      parseStudentPassCheckoutRequest("profile-1", { plan: "lifetime" }),
    ).toEqual({ ok: false, error: "unknown_plan" });
  });

  it("rejects client-supplied prices, price ids, and profile ids", () => {
    expect(
      parseStudentPassCheckoutRequest("profile-1", {
        plan: "monthly",
        priceCents: 1,
      }),
    ).toEqual({ ok: false, error: "client_price_rejected" });
    expect(
      parseStudentPassCheckoutRequest("profile-1", {
        plan: "monthly",
        price_id: "price_injected",
      }),
    ).toEqual({ ok: false, error: "client_price_rejected" });
    expect(
      parseStudentPassCheckoutRequest("profile-1", {
        plan: "annual",
        priceId: "price_injected",
      }),
    ).toEqual({ ok: false, error: "client_price_rejected" });
    expect(
      parseStudentPassCheckoutRequest("profile-1", {
        plan: "monthly",
        profile_id: "attacker",
      }),
    ).toEqual({ ok: false, error: "invalid_body" });
    expect(
      parseStudentPassCheckoutRequest("profile-1", {
        plan: "monthly",
        user_id: "attacker",
      }),
    ).toEqual({ ok: false, error: "invalid_body" });
  });
});

describe("Student Pass Stripe Price mapping", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("maps monthly, semiannual, and annual to distinct server Price IDs", () => {
    vi.stubEnv("STRIPE_STUDENT_PASS_MONTHLY_PRICE_ID", "price_monthly_12");
    vi.stubEnv("STRIPE_STUDENT_PASS_SEMIANNUAL_PRICE_ID", "price_semi_72");
    vi.stubEnv("STRIPE_STUDENT_PASS_ANNUAL_PRICE_ID", "price_annual_144");

    const monthly = parseStudentPassCheckoutRequest("profile-1", {
      plan: "monthly",
    });
    const semiannual = parseStudentPassCheckoutRequest("profile-1", {
      plan: "semiannual",
    });
    const annual = parseStudentPassCheckoutRequest("profile-1", {
      plan: "annual",
    });
    expect(monthly).toEqual({ ok: true, plan: "monthly" });
    expect(semiannual).toEqual({ ok: true, plan: "semiannual" });
    expect(annual).toEqual({ ok: true, plan: "annual" });
    if (!monthly.ok || !semiannual.ok || !annual.ok) return;

    expect(getStripeStudentPassPriceId(monthly.plan)).toBe("price_monthly_12");
    expect(getStripeStudentPassPriceId(semiannual.plan)).toBe("price_semi_72");
    expect(getStripeStudentPassPriceId(annual.plan)).toBe("price_annual_144");
    expect(getStripeStudentPassPriceId("monthly")).not.toBe(
      getStripeStudentPassPriceId("annual"),
    );
  });
});

describe("Student Pass Stripe Price validation", () => {
  const prices: Record<
    StudentPassStripePlan,
    {
      id: string;
      unit_amount: number;
      currency: string;
      type: string;
      recurring: { interval: string; interval_count: number };
    }
  > = {
    monthly: {
      id: "price_monthly",
      unit_amount: STUDENT_PASS_STRIPE_PLAN_SPECS.monthly.cents,
      currency: "eur",
      type: "recurring",
      recurring: { interval: "month", interval_count: 1 },
    },
    semiannual: {
      id: "price_semi",
      unit_amount: STUDENT_PASS_STRIPE_PLAN_SPECS.semiannual.cents,
      currency: "eur",
      type: "recurring",
      recurring: { interval: "month", interval_count: 6 },
    },
    annual: {
      id: "price_annual",
      unit_amount: STUDENT_PASS_STRIPE_PLAN_SPECS.annual.cents,
      currency: "eur",
      type: "recurring",
      recurring: { interval: "year", interval_count: 1 },
    },
  };

  it("accepts 12 EUR / month, 72 EUR / 6 months, and 144 EUR / year", () => {
    expect(assertStudentPassStripePrice(prices.monthly, "monthly")).toEqual({
      ok: true,
    });
    expect(
      assertStudentPassStripePrice(prices.semiannual, "semiannual"),
    ).toEqual({ ok: true });
    expect(assertStudentPassStripePrice(prices.annual, "annual")).toEqual({
      ok: true,
    });
  });

  it("rejects a Price that does not match the selected plan", () => {
    expect(
      assertStudentPassStripePrice(prices.annual, "monthly"),
    ).toEqual({ ok: false, error: "invalid_price" });
    expect(
      assertStudentPassStripePrice(
        { ...prices.monthly, unit_amount: 1199 },
        "monthly",
      ),
    ).toEqual({ ok: false, error: "invalid_price" });
    expect(
      assertStudentPassStripePrice(
        { ...prices.semiannual, recurring: { interval: "month", interval_count: 1 } },
        "semiannual",
      ),
    ).toEqual({ ok: false, error: "invalid_price" });
    expect(
      assertStudentPassStripePrice(
        { ...prices.annual, currency: "usd" },
        "annual",
      ),
    ).toEqual({ ok: false, error: "invalid_price" });
  });
});

describe("Student Pass Checkout session params", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("builds a subscription session with quantity 1 and the server Price ID", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
    vi.stubEnv("VERCEL_ENV", "");
    vi.stubEnv("VERCEL_URL", "");

    const params = buildStudentPassCheckoutSessionParams({
      profileId: "profile-42",
      priceId: "price_annual_144",
      customerId: "cus_test",
      plan: "annual",
    });

    expect(params.mode).toBe("subscription");
    expect(params.line_items).toEqual([
      { price: "price_annual_144", quantity: 1 },
    ]);
    expect(params.customer).toBe("cus_test");
    expect(params.client_reference_id).toBe("profile-42");
    expect(params.metadata).toEqual({
      purpose: "student_pass",
      profile_id: "profile-42",
      plan: "annual",
    });
    expect(params.subscription_data.metadata).toEqual(params.metadata);
    expect(params.success_url).toBe(
      "http://localhost:3000/dashboard/student-pass?checkout=success",
    );
    expect(params.cancel_url).toBe(
      "http://localhost:3000/dashboard/student-pass?checkout=cancelled",
    );
    expect(JSON.stringify(params)).not.toMatch(/unit_amount|price_data/);
  });
});

describe("Checkout session classification", () => {
  it("distinguishes Student Pass subscriptions from course payments", () => {
    expect(
      classifyCheckoutSession({
        mode: "subscription",
        metadata: { purpose: "student_pass", profile_id: "p1", plan: "annual" },
      }),
    ).toBe("student_pass");

    expect(
      classifyCheckoutSession({
        mode: "payment",
        metadata: { user_id: "p1", course_ids: "course-1" },
      }),
    ).toBe("courses");
  });
});

describe("Student Pass Checkout route and dashboard boundaries", () => {
  it("creates Checkout from a dedicated server route with session auth", () => {
    const route = readFileSync(
      path.join(
        process.cwd(),
        "src/app/api/stripe/student-pass/checkout/route.ts",
      ),
      "utf8",
    );
    expect(route).toMatch(/auth\.getUser\(\)/);
    expect(route).toMatch(/buildStudentPassCheckoutSessionParams/);
    expect(route).toMatch(/getStripeStudentPassPriceId\(parsed\.plan\)/);
    expect(route).toMatch(/assertStudentPassStripePrice\(price, parsed\.plan\)/);
    expect(route).not.toMatch(/unit_amount/);
    expect(route).not.toMatch(/sk_live|sk_test/);
    expect(route).toMatch(/createServerSupabaseClient/);
  });

  it("does not activate Student Pass from the success URL", () => {
    const page = readFileSync(
      path.join(process.cwd(), "src/app/dashboard/student-pass/page.tsx"),
      "utf8",
    );
    const client = readFileSync(
      path.join(
        process.cwd(),
        "src/components/DashboardStudentPassClient.tsx",
      ),
      "utf8",
    );
    const button = readFileSync(
      path.join(
        process.cwd(),
        "src/components/StudentPassSubscribeButton.tsx",
      ),
      "utf8",
    );
    expect(`${page}\n${client}`).toMatch(/checkout=success|checkout === "success"/);
    expect(`${page}\n${client}`).not.toMatch(
      /activateStudentPass|status:\s*"active"/,
    );
    expect(button).toMatch(/\/api\/stripe\/student-pass\/checkout/);
    expect(button).toMatch(/plan: "monthly"|plan }/);
    expect(button).toMatch(/studentPassChooseMonthly/);
    expect(button).toMatch(/studentPassChooseSemiannual/);
    expect(button).toMatch(/studentPassChooseAnnual/);
    expect(button).not.toMatch(/price_id|priceId/);
    expect(button).not.toMatch(/sk_live|sk_test/);
    expect(client).not.toMatch(/studentPassPrice/);
    expect(client).not.toMatch(/12 € \/ month/);
  });

  it("keeps course Checkout on mode payment", () => {
    const courseCheckout = readFileSync(
      path.join(process.cwd(), "src/lib/stripe/checkout.ts"),
      "utf8",
    );
    expect(courseCheckout).toMatch(/mode: "payment"/);
    expect(courseCheckout).not.toMatch(/student_pass/);
  });
});
