import { describe, expect, it } from "vitest";
import {
  computeCourseProgress,
  deriveLessonProgressStatus,
  isActiveEnrollmentRow,
} from "@/lib/learning/progress";

describe("lesson progress status", () => {
  it("marks missing rows as not started", () => {
    expect(deriveLessonProgressStatus(null)).toBe("not_started");
    expect(deriveLessonProgressStatus(undefined)).toBe("not_started");
    expect(deriveLessonProgressStatus({ hasRow: false })).toBe("not_started");
  });

  it("marks incomplete rows as in progress", () => {
    expect(
      deriveLessonProgressStatus({ hasRow: true, completed: false }),
    ).toBe("in_progress");
  });

  it("marks completed rows as completed", () => {
    expect(
      deriveLessonProgressStatus({ hasRow: true, completed: true }),
    ).toBe("completed");
  });
});

describe("course progress", () => {
  it("computes floored percent", () => {
    expect(computeCourseProgress(5, 0)).toEqual({
      totalLessons: 5,
      completedLessons: 0,
      percent: 0,
    });
    expect(computeCourseProgress(5, 2)).toEqual({
      totalLessons: 5,
      completedLessons: 2,
      percent: 40,
    });
    expect(computeCourseProgress(5, 5)).toEqual({
      totalLessons: 5,
      completedLessons: 5,
      percent: 100,
    });
  });

  it("handles empty courses and clamps completed", () => {
    expect(computeCourseProgress(0, 0).percent).toBe(0);
    expect(computeCourseProgress(3, 9)).toEqual({
      totalLessons: 3,
      completedLessons: 3,
      percent: 100,
    });
  });
});

describe("active enrollment gate", () => {
  it("requires active status and payment confirmation", () => {
    expect(
      isActiveEnrollmentRow({
        status: "active",
        payment_confirmed_at: "2026-07-27T09:29:42.541Z",
      }),
    ).toBe(true);
    expect(
      isActiveEnrollmentRow({
        status: "active",
        payment_confirmed_at: null,
      }),
    ).toBe(false);
    expect(
      isActiveEnrollmentRow({
        status: "pending_payment",
        payment_confirmed_at: "2026-07-27T09:29:42.541Z",
      }),
    ).toBe(false);
    expect(isActiveEnrollmentRow(null)).toBe(false);
  });
});
