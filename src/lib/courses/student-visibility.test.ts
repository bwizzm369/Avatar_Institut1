import { describe, expect, it } from "vitest";
import { isVisibleToEnrolledStudent } from "@/lib/courses/student-visibility";

describe("isVisibleToEnrolledStudent", () => {
  it("hides demonstration courses even when the student has an enrollment", () => {
    expect(isVisibleToEnrolledStudent({ is_demo: true })).toBe(false);
  });

  it("keeps a real unpublished course visible when the student is enrolled", () => {
    expect(isVisibleToEnrolledStudent({ is_demo: false })).toBe(true);
  });

  it("shows دورة الشكر and hides the three seeded demo courses", () => {
    const enrolled = [
      { slug: "sacred-symbolism", title_en: "Sacred Symbolism", is_demo: true },
      {
        slug: "consciousness-exploration",
        title_en: "Consciousness Exploration",
        is_demo: true,
      },
      {
        slug: "foundations-of-metaphysics",
        title_en: "Foundations of Metaphysics",
        is_demo: true,
      },
      { slug: "shukr", title_ar: "دورة الشكر", is_demo: false },
      { slug: "unpublished-real", title_en: "Real unpublished", is_demo: false },
    ];

    const visible = enrolled.filter(isVisibleToEnrolledStudent);

    expect(visible.map((course) => course.slug)).toEqual([
      "shukr",
      "unpublished-real",
    ]);
    expect(
      visible.some((course) => course.title_en === "Foundations of Metaphysics"),
    ).toBe(false);
  });
});
