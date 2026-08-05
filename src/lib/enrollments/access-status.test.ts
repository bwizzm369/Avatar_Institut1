import { describe, expect, it } from "vitest";
import {
  ACCESS_POLL_MAX_MS,
  deriveAccessUiState,
  resolveAccessFromSessionCourses,
  resolveAccessTimeline,
  shouldContinueAccessPolling,
} from "@/lib/enrollments/access-status";

describe("deriveAccessUiState", () => {
  it("returns waiting while inactive and under the timeout", () => {
    expect(
      deriveAccessUiState({ activated: false, elapsedMs: 0 }),
    ).toBe("waiting");
    expect(
      deriveAccessUiState({ activated: false, elapsedMs: 59_999 }),
    ).toBe("waiting");
  });

  it("returns activated as soon as enrollment is confirmed", () => {
    expect(
      deriveAccessUiState({ activated: true, elapsedMs: 0 }),
    ).toBe("activated");
    expect(
      deriveAccessUiState({ activated: true, elapsedMs: ACCESS_POLL_MAX_MS }),
    ).toBe("activated");
  });

  it("returns delayed after the timeout without activation", () => {
    expect(
      deriveAccessUiState({
        activated: false,
        elapsedMs: ACCESS_POLL_MAX_MS,
      }),
    ).toBe("delayed");
    expect(
      deriveAccessUiState({
        activated: false,
        elapsedMs: ACCESS_POLL_MAX_MS + 1,
      }),
    ).toBe("delayed");
  });

  it("keeps auto-polling while delayed and stops only when activated", () => {
    expect(shouldContinueAccessPolling("waiting")).toBe(true);
    expect(shouldContinueAccessPolling("delayed")).toBe(true);
    expect(shouldContinueAccessPolling("activated")).toBe(false);
  });
});

describe("resolveAccessFromSessionCourses", () => {
  const courses = [
    { id: "course-a", slug: "foundations-of-metaphysics" },
    { id: "course-b", slug: "consciousness-exploration" },
  ];

  it("activates immediately when a matching enrollment is already present", () => {
    const status = resolveAccessFromSessionCourses({
      expectedCourseIds: ["course-a"],
      enrollments: [{ course_id: "course-a" }],
      courses,
    });

    expect(status).toEqual({
      activated: true,
      courseSlug: "foundations-of-metaphysics",
      courseSlugs: ["foundations-of-metaphysics"],
    });
    expect(
      deriveAccessUiState({ activated: status.activated, elapsedMs: 0 }),
    ).toBe("activated");
  });

  it("stays inactive until a matching enrollment appears, then activates", () => {
    const before = resolveAccessFromSessionCourses({
      expectedCourseIds: ["course-a"],
      enrollments: [],
      courses,
    });
    const after = resolveAccessFromSessionCourses({
      expectedCourseIds: ["course-a"],
      enrollments: [{ course_id: "course-a" }],
      courses,
    });

    expect(before.activated).toBe(false);
    expect(after.activated).toBe(true);
    expect(after.courseSlug).toBe("foundations-of-metaphysics");

    expect(
      resolveAccessTimeline({
        checks: [
          { elapsedMs: 0, activated: before.activated },
          { elapsedMs: 5_000, activated: before.activated },
          { elapsedMs: 10_000, activated: after.activated },
        ],
      }),
    ).toEqual(["waiting", "waiting", "activated"]);
  });

  it("shows genuine delay when no matching enrollment appears", () => {
    const status = resolveAccessFromSessionCourses({
      expectedCourseIds: ["course-a"],
      enrollments: [{ course_id: "course-b" }],
      courses,
    });

    expect(status.activated).toBe(false);
    expect(
      resolveAccessTimeline({
        checks: [
          { elapsedMs: 0, activated: false },
          { elapsedMs: 30_000, activated: false },
          { elapsedMs: ACCESS_POLL_MAX_MS, activated: false },
          { elapsedMs: ACCESS_POLL_MAX_MS + 15_000, activated: false },
        ],
      }),
    ).toEqual(["waiting", "waiting", "delayed", "delayed"]);
    expect(shouldContinueAccessPolling("delayed")).toBe(true);
  });

  it("never activates from course_ids alone without an enrollment row", () => {
    expect(
      resolveAccessFromSessionCourses({
        expectedCourseIds: ["course-a", "course-b"],
        enrollments: [],
        courses,
      }),
    ).toEqual({ activated: false, courseSlug: null, courseSlugs: [] });
  });
});
