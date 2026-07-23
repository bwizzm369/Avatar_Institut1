import { describe, expect, it } from "vitest";
import {
  DEMO_COURSES,
  countLessons,
  formatPrice,
  getCourseBySlug,
} from "@/lib/courses";

describe("courses catalogue", () => {
  it("exposes three clearly marked demonstration courses", () => {
    expect(DEMO_COURSES).toHaveLength(3);
    expect(DEMO_COURSES.every((course) => course.isDemo)).toBe(true);
  });

  it("resolves courses by slug", () => {
    const course = getCourseBySlug("consciousness-exploration");
    expect(course?.id).toBe("demo-course-consciousness");
    expect(getCourseBySlug("missing")).toBeUndefined();
  });

  it("counts lessons and formats euro prices", () => {
    const course = DEMO_COURSES[0];
    expect(countLessons(course)).toBeGreaterThan(0);
    expect(formatPrice(9900, "EUR", "en")).toContain("99");
  });
});
