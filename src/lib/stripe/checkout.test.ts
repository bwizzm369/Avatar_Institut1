import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildCheckoutSessionParams,
  parseCheckoutRequest,
  resolveCheckoutCourses,
  resolveCheckoutCoursesForUser,
  type CheckoutCourseSource,
} from "@/lib/stripe/checkout";
import { DEMO_COURSE_DB_IDS } from "@/lib/courses/demoDbIds";
import { readFileSync } from "node:fs";
import path from "node:path";

describe("Stripe checkout request validation", () => {
  it("refuses unauthenticated users", () => {
    const result = parseCheckoutRequest(null, {
      slugs: ["foundations-of-metaphysics"],
    });
    expect(result).toEqual({ ok: false, error: "unauthenticated" });
  });

  it("rejects client-supplied prices", () => {
    const result = parseCheckoutRequest("user-1", {
      slugs: ["foundations-of-metaphysics"],
      priceCents: 1,
    });
    expect(result).toEqual({ ok: false, error: "client_price_rejected" });
  });

  it("rejects browser-supplied user ids", () => {
    expect(
      parseCheckoutRequest("user-1", {
        slugs: ["foundations-of-metaphysics"],
        user_id: "attacker",
      }),
    ).toEqual({ ok: false, error: "invalid_body" });

    expect(
      parseCheckoutRequest("user-1", {
        slugs: ["foundations-of-metaphysics"],
        userId: "attacker",
      }).ok,
    ).toBe(false);
  });

  it("rejects amount fields from the browser", () => {
    expect(
      parseCheckoutRequest("user-1", {
        slugs: ["foundations-of-metaphysics"],
        amount: 100,
      }).ok,
    ).toBe(false);
  });

  it("resolves trusted server prices and ignores cart display amounts", () => {
    const parsed = parseCheckoutRequest("user-1", {
      slugs: ["foundations-of-metaphysics", "sacred-symbolism"],
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const resolved = resolveCheckoutCourses(parsed.slugs);
    expect(resolved.ok).toBe(true);
    if (!resolved.ok) return;

    expect(resolved.courses).toEqual([
      expect.objectContaining({
        slug: "foundations-of-metaphysics",
        priceCents: 9900,
        dbId: DEMO_COURSE_DB_IDS["foundations-of-metaphysics"],
      }),
      expect.objectContaining({
        slug: "sacred-symbolism",
        priceCents: 7900,
        dbId: DEMO_COURSE_DB_IDS["sacred-symbolism"],
      }),
    ]);
  });

  it("builds Checkout session params with server amounts and metadata", () => {
    const resolved = resolveCheckoutCourses(["consciousness-exploration"]);
    expect(resolved.ok).toBe(true);
    if (!resolved.ok) return;

    const params = buildCheckoutSessionParams({
      userId: "user-42",
      courses: resolved.courses,
      customerEmail: "student@example.com",
    });

    expect(params.mode).toBe("payment");
    expect(params.line_items[0]?.price_data.unit_amount).toBe(14900);
    expect(params.metadata.user_id).toBe("user-42");
    expect(params.metadata.course_ids).toBe(
      DEMO_COURSE_DB_IDS["consciousness-exploration"],
    );
    expect(params.success_url).toContain("/cart/success");
    expect(params.cancel_url).toContain("/cart");
    expect(params).not.toHaveProperty("payment_method_types");
  });

  it("does not trust client-supplied prices in the request body", () => {
    expect(
      parseCheckoutRequest("user-1", {
        slugs: ["foundations-of-metaphysics"],
        priceCents: 1,
        student_pass_discount_percent: 90,
      }).ok,
    ).toBe(false);
  });

  it("resolveCheckoutCoursesForUser reloads trusted sources and Pass status", () => {
    const sources: CheckoutCourseSource[] = [
      {
        id: DEMO_COURSE_DB_IDS["consciousness-exploration"],
        slug: "consciousness-exploration",
        titleEn: "Consciousness Exploration",
        priceCents: 14900,
        currency: "EUR",
        studentPassIncluded: false,
        studentPassDiscountPercent: 20,
      },
    ];

    const withPass = resolveCheckoutCoursesForUser({
      slugs: ["consciousness-exploration"],
      sources,
      hasActiveStudentPass: true,
    });
    expect(withPass.ok).toBe(true);
    if (!withPass.ok) return;
    expect(withPass.courses[0]?.priceCents).toBe(11920);
    expect(withPass.hasActiveStudentPass).toBe(true);

    const withoutPass = resolveCheckoutCoursesForUser({
      slugs: ["consciousness-exploration"],
      sources,
      hasActiveStudentPass: false,
    });
    expect(withoutPass.ok).toBe(true);
    if (!withoutPass.ok) return;
    expect(withoutPass.courses[0]?.priceCents).toBe(14900);
  });

  it("refuses checkout when Pass includes the course", () => {
    const result = resolveCheckoutCoursesForUser({
      slugs: ["foundations-of-metaphysics"],
      sources: [
        {
          id: DEMO_COURSE_DB_IDS["foundations-of-metaphysics"],
          slug: "foundations-of-metaphysics",
          titleEn: "Foundations",
          priceCents: 9900,
          currency: "EUR",
          studentPassIncluded: true,
          studentPassDiscountPercent: 50,
        },
      ],
      hasActiveStudentPass: true,
    });
    expect(result).toMatchObject({
      ok: false,
      error: "included_with_pass",
      redirectSlug: "foundations-of-metaphysics",
    });
  });

  it("checkout route reloads courses and Student Pass on the server", () => {
    const routePath = path.resolve(
      process.cwd(),
      "src/app/api/stripe/checkout/route.ts",
    );
    const source = readFileSync(routePath, "utf8");
    expect(source).toMatch(/loadCheckoutCourseSources/);
    expect(source).toMatch(/hasActiveStudentPassForProfile/);
    expect(source).toMatch(/resolveCheckoutCoursesForUser/);
    expect(source).not.toMatch(/resolveCheckoutCourses\(/);
  });

  it("builds success/cancel URLs from the Preview deployment host", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv(
      "VERCEL_URL",
      "avatar-institut-platform-preview.vercel.app",
    );
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");

    try {
      const resolved = resolveCheckoutCourses(["consciousness-exploration"]);
      expect(resolved.ok).toBe(true);
      if (!resolved.ok) return;

      const params = buildCheckoutSessionParams({
        userId: "user-42",
        courses: resolved.courses,
      });

      expect(params.success_url).toBe(
        "https://avatar-institut-platform-preview.vercel.app/cart/success?session_id={CHECKOUT_SESSION_ID}",
      );
      expect(params.cancel_url).toBe(
        "https://avatar-institut-platform-preview.vercel.app/cart",
      );
    } finally {
      vi.unstubAllEnvs();
    }
  });
});

describe("Stripe webhook handling", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("refuses webhooks without a signature", async () => {
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_test_secret_for_unit_tests");
    const { verifyStripeWebhookEvent } = await import("@/lib/stripe/webhook");

    const stripe = {
      webhooks: {
        constructEvent: vi.fn(),
      },
    };

    const result = verifyStripeWebhookEvent({
      stripe: stripe as never,
      rawBody: "{}",
      signature: null,
    });

    expect(result).toEqual({ ok: false, error: "missing_signature" });
    expect(stripe.webhooks.constructEvent).not.toHaveBeenCalled();
  });

  it("refuses webhooks with an invalid signature", async () => {
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_test_secret_for_unit_tests");
    const { verifyStripeWebhookEvent } = await import("@/lib/stripe/webhook");

    const stripe = {
      webhooks: {
        constructEvent: vi.fn(() => {
          throw new Error("bad sig");
        }),
      },
    };

    const result = verifyStripeWebhookEvent({
      stripe: stripe as never,
      rawBody: "{}",
      signature: "t=1,v1=bad",
    });

    expect(result).toEqual({ ok: false, error: "invalid_signature" });
  });

  it("does not enroll when payment_status is not paid", async () => {
    const {
      processCheckoutSessionCompleted,
      resetProcessedStripeEventsForTests,
    } = await import("@/lib/stripe/webhook");
    resetProcessedStripeEventsForTests();

    const upsert = vi.fn();
    const supabase = {
      from: vi.fn(() => ({ upsert })),
    };

    const result = await processCheckoutSessionCompleted({
      event: {
        id: "evt_unpaid",
        type: "checkout.session.completed",
        data: {
          object: {
            payment_status: "unpaid",
            metadata: {
              user_id: "user-1",
              course_ids: DEMO_COURSE_DB_IDS["foundations-of-metaphysics"],
            },
            client_reference_id: "user-1",
          },
        },
      } as never,
      supabase: supabase as never,
    });

    expect(result).toEqual({
      ok: true,
      action: "ignored_unpaid",
      grantedCourseIds: [],
    });
    expect(upsert).not.toHaveBeenCalled();
  });

  it("creates an enrollment for a paid checkout session", async () => {
    const {
      processCheckoutSessionCompleted,
      resetProcessedStripeEventsForTests,
    } = await import("@/lib/stripe/webhook");
    resetProcessedStripeEventsForTests();

    const upsert = vi.fn().mockResolvedValue({ error: null });
    const supabase = {
      from: vi.fn(() => ({ upsert })),
    };

    const courseId = DEMO_COURSE_DB_IDS["sacred-symbolism"];
    const result = await processCheckoutSessionCompleted({
      event: {
        id: "evt_paid_1",
        type: "checkout.session.completed",
        data: {
          object: {
            payment_status: "paid",
            metadata: {
              user_id: "user-9",
              course_ids: courseId,
              course_slugs: "sacred-symbolism",
            },
            client_reference_id: "user-9",
          },
        },
      } as never,
      supabase: supabase as never,
    });

    expect(result).toEqual({
      ok: true,
      action: "enrolled",
      grantedCourseIds: [courseId],
    });
    expect(supabase.from).toHaveBeenCalledWith("enrollments");
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-9",
        course_id: courseId,
        status: "active",
        payment_confirmed_at: expect.any(String),
      }),
      { onConflict: "user_id,course_id" },
    );
  });

  it("replays the same webhook event without duplicating grants", async () => {
    const {
      processCheckoutSessionCompleted,
      resetProcessedStripeEventsForTests,
    } = await import("@/lib/stripe/webhook");
    resetProcessedStripeEventsForTests();

    const upsert = vi.fn().mockResolvedValue({ error: null });
    const supabase = {
      from: vi.fn(() => ({ upsert })),
    };

    const event = {
      id: "evt_paid_replay",
      type: "checkout.session.completed",
      data: {
        object: {
          payment_status: "paid",
          metadata: {
            user_id: "user-2",
            course_ids: DEMO_COURSE_DB_IDS["consciousness-exploration"],
          },
          client_reference_id: "user-2",
        },
      },
    } as never;

    const first = await processCheckoutSessionCompleted({
      event,
      supabase: supabase as never,
    });
    const second = await processCheckoutSessionCompleted({
      event,
      supabase: supabase as never,
    });

    expect(first.ok && first.action).toBe("enrolled");
    expect(second).toEqual({
      ok: true,
      action: "already_processed",
      grantedCourseIds: [],
    });
    expect(upsert).toHaveBeenCalledTimes(1);
  });
});
