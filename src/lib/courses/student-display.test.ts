import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  studentCourseSummary,
  studentCourseTitle,
  studentLocalizedText,
} from "@/lib/courses/student-display";
import { isVisibleToEnrolledStudent } from "@/lib/courses/student-visibility";

const shukr = {
  title_en: "",
  title_ar: "دورة الشكر",
  summary_en: "",
  summary_ar: "",
  is_demo: false,
};

const englishCourse = {
  title_en: "Foundations of Consciousness",
  title_ar: "أسس الوعي",
  summary_en: "An English summary.",
  summary_ar: "ملخص عربي",
  is_demo: false,
};

describe("student dashboard EN↔AR fallback", () => {
  it("shows دورة الشكر in English locale via Arabic title fallback", () => {
    expect(studentCourseTitle(shukr, "en")).toBe("دورة الشكر");
    expect(studentCourseTitle(shukr, "ar")).toBe("دورة الشكر");
  });

  it("keeps a real English title when present", () => {
    expect(studentCourseTitle(englishCourse, "en")).toBe(
      "Foundations of Consciousness",
    );
    expect(studentCourseSummary(englishCourse, "en")).toBe(
      "An English summary.",
    );
  });

  it("prioritizes Arabic in AR locale", () => {
    expect(studentCourseTitle(englishCourse, "ar")).toBe("أسس الوعي");
    expect(studentCourseSummary(englishCourse, "ar")).toBe("ملخص عربي");
  });

  it("falls back from empty Arabic to English", () => {
    expect(
      studentCourseTitle({ title_en: "Gratitude Course", title_ar: "" }, "ar"),
    ).toBe("Gratitude Course");
    expect(
      studentCourseSummary(
        { summary_en: "English summary", summary_ar: "" },
        "ar",
      ),
    ).toBe("English summary");
  });

  it("falls back empty summaries the same way as titles", () => {
    expect(studentCourseSummary(shukr, "en")).toBe("");
    expect(
      studentLocalizedText("", "وصف الشكر", "en"),
    ).toBe("وصف الشكر");
  });

  it("does not unhide demo courses when applying display fallback", () => {
    const demo = {
      title_en: "Sacred Symbolism",
      title_ar: "الرمزية المقدسة",
      is_demo: true,
    };
    expect(isVisibleToEnrolledStudent(demo)).toBe(false);
    expect(studentCourseTitle(demo, "en")).toBe("Sacred Symbolism");
  });

  it("wires the fallback into dashboard and student reader clients", () => {
    const overview = readFileSync(
      path.resolve(process.cwd(), "src/components/DashboardOverviewClient.tsx"),
      "utf8",
    );
    const courses = readFileSync(
      path.resolve(process.cwd(), "src/components/DashboardCoursesClient.tsx"),
      "utf8",
    );
    const reader = readFileSync(
      path.resolve(process.cwd(), "src/components/StudentCourseClient.tsx"),
      "utf8",
    );
    const lesson = readFileSync(
      path.resolve(process.cwd(), "src/components/StudentLessonClient.tsx"),
      "utf8",
    );
    expect(overview).toMatch(/studentCourseTitle/);
    expect(overview).toMatch(/studentCourseSummary/);
    expect(courses).toMatch(/studentCourseTitle/);
    expect(courses).toMatch(/studentCourseSummary/);
    expect(reader).toMatch(/studentLocalizedText/);
    expect(lesson).toMatch(/studentLocalizedText/);
    expect(overview).not.toMatch(/locale === "ar" \? course.title_ar/);
    expect(courses).not.toMatch(/locale === "ar" \? course.title_ar/);
  });
});
