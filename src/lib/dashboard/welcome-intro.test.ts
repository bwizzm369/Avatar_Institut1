import { describe, expect, it } from "vitest";
import {
  dashboardIntroMessageKey,
  hasConfirmedCoursePayment,
} from "@/lib/dashboard/welcome-intro";

describe("dashboard welcome intro", () => {
  it("uses a plain welcome after signup with no payment", () => {
    expect(
      dashboardIntroMessageKey({
        hasConfirmedCoursePayment: false,
        hasActiveMembership: false,
      }),
    ).toBe("dashboard.intro");
  });

  it("thanks for payment only after a confirmed enrollment or active Pass", () => {
    expect(
      dashboardIntroMessageKey({
        hasConfirmedCoursePayment: true,
        hasActiveMembership: false,
      }),
    ).toBe("dashboard.introPaid");
    expect(
      dashboardIntroMessageKey({
        hasConfirmedCoursePayment: false,
        hasActiveMembership: true,
      }),
    ).toBe("dashboard.introPaid");
  });

  it("does not treat an empty account as a confirmed payment", () => {
    expect(hasConfirmedCoursePayment([])).toBe(false);
    expect(
      hasConfirmedCoursePayment([
        { enrollment: { payment_confirmed_at: null } },
      ]),
    ).toBe(false);
    expect(
      hasConfirmedCoursePayment([
        { enrollment: { payment_confirmed_at: "2026-08-29T10:00:00.000Z" } },
      ]),
    ).toBe(true);
  });
});
