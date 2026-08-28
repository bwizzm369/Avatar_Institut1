import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { hasActiveStudentPass } from "@/lib/admin/student-pass/types";
import { DEMO_COURSE_DB_IDS } from "@/lib/courses/demoDbIds";
import {
  mapStripeSubscriptionToStudentPassStatus,
  syncStudentPassFromStripeSubscription,
  type StripeSubscriptionSnapshot,
} from "@/lib/stripe/student-pass-sync";
import {
  dispatchStripeWebhookEvent,
  resetProcessedStripeEventsForTests,
  verifyStripeWebhookEvent,
} from "@/lib/stripe/webhook";

type SubRow = {
  id: string;
  profile_id: string;
  status: string;
  started_at: string;
  expires_at: string | null;
  cancelled_at: string | null;
  source: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
};

function createSyncMock(seed: SubRow[] = []) {
  const rows = new Map<string, SubRow>(
    seed.map((row) => [row.profile_id, { ...row }]),
  );
  const enrollments: Array<Record<string, unknown>> = [];

  const client = {
    from(table: string) {
      if (table === "enrollments") {
        return {
          upsert(payload: Record<string, unknown>) {
            enrollments.push(payload);
            return Promise.resolve({ error: null });
          },
        };
      }

      return {
        select() {
          return {
            eq(column: string, value: string) {
              return {
                maybeSingle: async () => {
                  if (column === "profile_id") {
                    return { data: rows.get(value) ?? null, error: null };
                  }
                  if (column === "stripe_subscription_id") {
                    const row =
                      [...rows.values()].find(
                        (item) => item.stripe_subscription_id === value,
                      ) ?? null;
                    return { data: row, error: null };
                  }
                  return { data: null, error: { message: "bad eq" } };
                },
              };
            },
          };
        },
        insert(payload: Record<string, unknown>) {
          const profileId = String(payload.profile_id);
          const row: SubRow = {
            id: `sub-${rows.size + 1}`,
            profile_id: profileId,
            status: String(payload.status),
            started_at: String(payload.started_at),
            expires_at: (payload.expires_at as string | null) ?? null,
            cancelled_at: (payload.cancelled_at as string | null) ?? null,
            source: (payload.source as string | null) ?? null,
            stripe_customer_id:
              (payload.stripe_customer_id as string | null) ?? null,
            stripe_subscription_id:
              (payload.stripe_subscription_id as string | null) ?? null,
          };
          rows.set(profileId, row);
          return Promise.resolve({ data: row, error: null });
        },
        update(payload: Record<string, unknown>) {
          return {
            eq(column: string, value: string) {
              return Promise.resolve().then(() => {
                const existing =
                  column === "id"
                    ? [...rows.values()].find((row) => row.id === value)
                    : column === "profile_id"
                      ? rows.get(value)
                      : undefined;
                if (!existing) {
                  return { data: null, error: { message: "not found" } };
                }
                const next: SubRow = { ...existing, ...payload } as SubRow;
                rows.set(next.profile_id, next);
                return { data: next, error: null };
              });
            },
          };
        },
      };
    },
  };

  return { rows, enrollments, client };
}

function snapshot(overrides: Partial<StripeSubscriptionSnapshot> = {}): StripeSubscriptionSnapshot {
  return {
    id: "sub_test",
    status: "active",
    customerId: "cus_test",
    startDateUnix: 1_785_542_400,
    currentPeriodEndUnix: 1_790_467_200,
    canceledAtUnix: null,
    metadata: { purpose: "student_pass", profile_id: "profile-1" },
    ...overrides,
  };
}

describe("Stripe → Student Pass status mapping", () => {
  it("activates live Stripe statuses and cancels deleted ones", () => {
    expect(mapStripeSubscriptionToStudentPassStatus("active")).toBe("active");
    expect(mapStripeSubscriptionToStudentPassStatus("trialing")).toBe("active");
    expect(mapStripeSubscriptionToStudentPassStatus("past_due")).toBe("active");
    expect(mapStripeSubscriptionToStudentPassStatus("canceled")).toBe(
      "cancelled",
    );
    expect(mapStripeSubscriptionToStudentPassStatus("unpaid")).toBe("expired");
    expect(mapStripeSubscriptionToStudentPassStatus("incomplete")).toBe(
      "inactive",
    );
  });
});

describe("syncStudentPassFromStripeSubscription", () => {
  const now = new Date("2026-08-27T12:00:00.000Z");

  it("activates Student Pass from an active Stripe subscription", async () => {
    const mock = createSyncMock();
    const result = await syncStudentPassFromStripeSubscription({
      supabase: mock.client as never,
      snapshot: snapshot(),
      profileId: "profile-1",
      now,
    });

    expect(result).toMatchObject({
      ok: true,
      action: "activated",
      profileId: "profile-1",
      status: "active",
    });
    const row = mock.rows.get("profile-1")!;
    expect(row.source).toBe("stripe");
    expect(row.stripe_customer_id).toBe("cus_test");
    expect(row.stripe_subscription_id).toBe("sub_test");
    expect(row.started_at).toBe("2026-08-01T00:00:00.000Z");
    expect(row.expires_at).toBe("2026-09-27T00:00:00.000Z");
    expect(hasActiveStudentPass(row, now)).toBe(true);
  });

  it("is idempotent for the same active subscription", async () => {
    const mock = createSyncMock();
    const first = await syncStudentPassFromStripeSubscription({
      supabase: mock.client as never,
      snapshot: snapshot(),
      profileId: "profile-1",
      now,
    });
    const second = await syncStudentPassFromStripeSubscription({
      supabase: mock.client as never,
      snapshot: snapshot({
        currentPeriodEndUnix: 1_793_059_200,
      }),
      profileId: "profile-1",
      now,
    });

    expect(first.ok && first.action).toBe("activated");
    expect(second.ok && second.action).toBe("updated");
    expect(mock.rows.size).toBe(1);
    expect(mock.rows.get("profile-1")?.started_at).toBe(
      "2026-08-01T00:00:00.000Z",
    );
    expect(mock.rows.get("profile-1")?.expires_at).toBe(
      "2026-10-27T00:00:00.000Z",
    );
  });

  it("cancels Student Pass when the Stripe subscription is deleted", async () => {
    const mock = createSyncMock();
    await syncStudentPassFromStripeSubscription({
      supabase: mock.client as never,
      snapshot: snapshot(),
      profileId: "profile-1",
      now,
    });

    const cancelled = await syncStudentPassFromStripeSubscription({
      supabase: mock.client as never,
      snapshot: snapshot({
        status: "canceled",
        canceledAtUnix: 1_787_184_000,
      }),
      profileId: "profile-1",
      now,
    });

    expect(cancelled).toMatchObject({
      ok: true,
      action: "cancelled",
      status: "cancelled",
    });
    const row = mock.rows.get("profile-1")!;
    expect(row.cancelled_at).toBe("2026-08-20T00:00:00.000Z");
    expect(hasActiveStudentPass(row, now)).toBe(false);
  });

  it("does not create enrollments", async () => {
    const mock = createSyncMock();
    await syncStudentPassFromStripeSubscription({
      supabase: mock.client as never,
      snapshot: snapshot(),
      profileId: "profile-1",
      now,
    });
    expect(mock.enrollments).toEqual([]);
  });
});

describe("Student Pass webhook dispatch", () => {
  afterEach(() => {
    resetProcessedStripeEventsForTests();
    vi.unstubAllEnvs();
  });

  it("requires a webhook signature", async () => {
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_test_secret_for_unit_tests");
    const stripe = {
      webhooks: { constructEvent: vi.fn() },
    };
    const result = verifyStripeWebhookEvent({
      stripe: stripe as never,
      rawBody: "{}",
      signature: null,
    });
    expect(result).toEqual({ ok: false, error: "missing_signature" });
  });

  it("activates from checkout.session.completed without granting courses", async () => {
    const mock = createSyncMock();
    const retrieveSubscription = vi.fn(async () => ({
      id: "sub_test",
      status: "active",
      customer: "cus_test",
      start_date: 1_785_542_400,
      current_period_end: 1_790_467_200,
      metadata: { purpose: "student_pass", profile_id: "profile-1" },
    }));

    const result = await dispatchStripeWebhookEvent({
      event: {
        id: "evt_pass_checkout",
        type: "checkout.session.completed",
        data: {
          object: {
            mode: "subscription",
            payment_status: "paid",
            client_reference_id: "profile-1",
            subscription: "sub_test",
            metadata: {
              purpose: "student_pass",
              profile_id: "profile-1",
            },
          },
        },
      } as never,
      supabase: mock.client as never,
      retrieveSubscription,
    });

    expect(result).toMatchObject({
      ok: true,
      action: "activated",
      profileId: "profile-1",
    });
    expect(mock.enrollments).toHaveLength(0);
    expect(mock.rows.get("profile-1")?.source).toBe("stripe");
    expect(retrieveSubscription).toHaveBeenCalledWith("sub_test");
  });

  it("replays the same Student Pass event without a second write action", async () => {
    const mock = createSyncMock();
    const event = {
      id: "evt_pass_replay",
      type: "customer.subscription.created",
      data: {
        object: {
          id: "sub_test",
          status: "active",
          customer: "cus_test",
          start_date: 1_785_542_400,
          current_period_end: 1_790_467_200,
          metadata: { purpose: "student_pass", profile_id: "profile-1" },
        },
      },
    } as never;

    const first = await dispatchStripeWebhookEvent({
      event,
      supabase: mock.client as never,
    });
    const second = await dispatchStripeWebhookEvent({
      event,
      supabase: mock.client as never,
    });

    expect(first.ok && first.action).toBe("activated");
    expect(second).toEqual({ ok: true, action: "already_processed" });
  });

  it("updates Student Pass on customer.subscription.updated", async () => {
    const mock = createSyncMock();
    await dispatchStripeWebhookEvent({
      event: {
        id: "evt_created",
        type: "customer.subscription.created",
        data: {
          object: {
            id: "sub_test",
            status: "active",
            customer: "cus_test",
            start_date: 1_785_542_400,
            current_period_end: 1_790_467_200,
            metadata: { purpose: "student_pass", profile_id: "profile-1" },
          },
        },
      } as never,
      supabase: mock.client as never,
    });

    const updated = await dispatchStripeWebhookEvent({
      event: {
        id: "evt_updated",
        type: "customer.subscription.updated",
        data: {
          object: {
            id: "sub_test",
            status: "active",
            customer: "cus_test",
            start_date: 1_785_542_400,
            current_period_end: 1_793_059_200,
            metadata: { purpose: "student_pass", profile_id: "profile-1" },
          },
        },
      } as never,
      supabase: mock.client as never,
    });

    expect(updated.ok && updated.action).toBe("updated");
    expect(mock.rows.get("profile-1")?.expires_at).toBe(
      "2026-10-27T00:00:00.000Z",
    );
  });

  it("cancels Student Pass on customer.subscription.deleted", async () => {
    const mock = createSyncMock();
    await dispatchStripeWebhookEvent({
      event: {
        id: "evt_created",
        type: "customer.subscription.created",
        data: {
          object: {
            id: "sub_test",
            status: "active",
            customer: "cus_test",
            start_date: 1_785_542_400,
            current_period_end: 1_790_467_200,
            metadata: { purpose: "student_pass", profile_id: "profile-1" },
          },
        },
      } as never,
      supabase: mock.client as never,
    });

    const deleted = await dispatchStripeWebhookEvent({
      event: {
        id: "evt_deleted",
        type: "customer.subscription.deleted",
        data: {
          object: {
            id: "sub_test",
            status: "canceled",
            customer: "cus_test",
            start_date: 1_785_542_400,
            canceled_at: 1_787_184_000,
            metadata: { purpose: "student_pass", profile_id: "profile-1" },
          },
        },
      } as never,
      supabase: mock.client as never,
    });

    expect(deleted).toMatchObject({ ok: true, action: "cancelled" });
    expect(mock.rows.get("profile-1")?.status).toBe("cancelled");
  });

  it("does not enroll courses from a Student Pass checkout", async () => {
    const mock = createSyncMock();
    await dispatchStripeWebhookEvent({
      event: {
        id: "evt_pass_no_courses",
        type: "checkout.session.completed",
        data: {
          object: {
            mode: "subscription",
            payment_status: "paid",
            subscription: "sub_test",
            metadata: {
              purpose: "student_pass",
              profile_id: "profile-1",
            },
          },
        },
      } as never,
      supabase: mock.client as never,
      retrieveSubscription: async () => ({
        id: "sub_test",
        status: "active",
        customer: "cus_test",
        start_date: 1_785_542_400,
        current_period_end: 1_790_467_200,
        metadata: { purpose: "student_pass", profile_id: "profile-1" },
      }),
    });

    expect(mock.enrollments).toEqual([]);
  });

  it("still enrolls a course Checkout and does not write Student Pass", async () => {
    const mock = createSyncMock();
    const courseId = DEMO_COURSE_DB_IDS["sacred-symbolism"];

    const result = await dispatchStripeWebhookEvent({
      event: {
        id: "evt_course_paid",
        type: "checkout.session.completed",
        data: {
          object: {
            mode: "payment",
            payment_status: "paid",
            metadata: {
              user_id: "user-9",
              course_ids: courseId,
            },
            client_reference_id: "user-9",
          },
        },
      } as never,
      supabase: mock.client as never,
    });

    expect(result).toMatchObject({
      ok: true,
      action: "enrolled",
      grantedCourseIds: [courseId],
    });
    expect(mock.enrollments).toHaveLength(1);
    expect(mock.rows.size).toBe(0);
  });

  it("activates the same Student Pass for an annual plan", async () => {
    const mock = createSyncMock();
    const result = await dispatchStripeWebhookEvent({
      event: {
        id: "evt_pass_annual",
        type: "checkout.session.completed",
        data: {
          object: {
            mode: "subscription",
            payment_status: "paid",
            subscription: "sub_annual",
            metadata: {
              purpose: "student_pass",
              profile_id: "profile-1",
              plan: "annual",
            },
          },
        },
      } as never,
      supabase: mock.client as never,
      retrieveSubscription: async () => ({
        id: "sub_annual",
        status: "active",
        customer: "cus_test",
        start_date: 1_785_542_400,
        current_period_end: 1_790_467_200,
        metadata: {
          purpose: "student_pass",
          profile_id: "profile-1",
          plan: "annual",
        },
      }),
    });

    expect(result).toMatchObject({
      ok: true,
      action: "activated",
      profileId: "profile-1",
    });
    expect(mock.rows.get("profile-1")?.source).toBe("stripe");
    expect(mock.rows.get("profile-1")?.status).toBe("active");
    expect(mock.enrollments).toEqual([]);
  });
});

describe("Digital Membership still follows has_active_student_pass", () => {
  it("does not add a second entitlement helper", () => {
    const sync = readFileSync(
      path.join(process.cwd(), "src/lib/stripe/student-pass-sync.ts"),
      "utf8",
    );
    const membership = readFileSync(
      path.join(process.cwd(), "src/lib/student-pass/membership.ts"),
      "utf8",
    );
    expect(sync).toMatch(/source: STUDENT_PASS_STRIPE_SOURCE/);
    expect(membership).toMatch(/hasActiveStudentPass/);
    expect(membership).not.toMatch(/stripe_subscription_id/);
  });
});
