import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  courseSlugsEqual,
  dashboardCoursePath,
  dashboardLessonPath,
  encodeCourseSlugParam,
  publicCoursePath,
  resolveCourseSlugParam,
} from "@/lib/courses/course-slug";
import { isVisibleToEnrolledStudent } from "@/lib/courses/student-visibility";
import { isActiveEnrollmentRow } from "@/lib/learning/progress";

const ARABIC_SLUG = "دورة-الشكر";
const ARABIC_ENCODED = encodeURIComponent(ARABIC_SLUG);
const LATIN_SLUG = "foundations-of-metaphysics";

const shukr = {
  slug: ARABIC_SLUG,
  is_demo: false,
};

const demo = {
  slug: LATIN_SLUG,
  is_demo: true,
};

type LookupKind = "not_found" | "forbidden" | "ok";

function lookupStudentCourse(input: {
  param: string;
  courses: Array<{ slug: string; is_demo: boolean }>;
  enrolledSlugs: string[];
  enrollmentStatus?: "active" | "pending_payment";
  paymentConfirmed?: boolean;
}): LookupKind {
  const slug = resolveCourseSlugParam(input.param);
  const course = input.courses.find((row) => courseSlugsEqual(row.slug, slug));
  if (!course || !isVisibleToEnrolledStudent(course)) {
    return "not_found";
  }

  const enrolled = input.enrolledSlugs.some((value) =>
    courseSlugsEqual(value, course.slug),
  );
  const enrollmentActive = isActiveEnrollmentRow(
    enrolled
      ? {
          status: input.enrollmentStatus ?? "active",
          payment_confirmed_at: input.paymentConfirmed === false ? null : "2026-08-20T10:28:20.465Z",
        }
      : undefined,
  );
  return enrollmentActive ? "ok" : "forbidden";
}

describe("resolveCourseSlugParam", () => {
  it("keeps the Arabic slug دورة-الشكر unchanged when already decoded", () => {
    expect(resolveCourseSlugParam(ARABIC_SLUG)).toBe(ARABIC_SLUG);
  });

  it("decodes a percent-encoded Arabic slug to دورة-الشكر", () => {
    expect(ARABIC_ENCODED).toMatch(/%D8%/i);
    expect(resolveCourseSlugParam(ARABIC_ENCODED)).toBe(ARABIC_SLUG);
    expect(
      resolveCourseSlugParam(
        "%D8%AF%D9%88%D8%B1%D8%A9-%D8%A7%D9%84%D8%B4%D9%83%D8%B1",
      ),
    ).toBe(ARABIC_SLUG);
  });

  it("leaves latin slugs unchanged", () => {
    expect(resolveCourseSlugParam(LATIN_SLUG)).toBe(LATIN_SLUG);
    expect(resolveCourseSlugParam(` ${LATIN_SLUG} `)).toBe(LATIN_SLUG);
  });
});

describe("encoded course hrefs", () => {
  it("encodes دورة-الشكر for public and dashboard links", () => {
    expect(encodeCourseSlugParam(ARABIC_SLUG)).toBe(ARABIC_ENCODED);
    expect(publicCoursePath(ARABIC_SLUG)).toBe(`/courses/${ARABIC_ENCODED}`);
    expect(dashboardCoursePath(ARABIC_SLUG)).toBe(
      `/dashboard/courses/${ARABIC_ENCODED}`,
    );
    expect(dashboardLessonPath(ARABIC_SLUG, "lesson-1")).toBe(
      `/dashboard/courses/${ARABIC_ENCODED}/lessons/lesson-1`,
    );
  });

  it("does not double-encode an already percent-encoded Arabic slug", () => {
    expect(publicCoursePath(ARABIC_ENCODED)).toBe(`/courses/${ARABIC_ENCODED}`);
    expect(dashboardCoursePath(ARABIC_ENCODED)).toBe(
      `/dashboard/courses/${ARABIC_ENCODED}`,
    );
  });

  it("leaves latin slugs unchanged in hrefs", () => {
    expect(publicCoursePath(LATIN_SLUG)).toBe(`/courses/${LATIN_SLUG}`);
    expect(dashboardCoursePath(LATIN_SLUG)).toBe(
      `/dashboard/courses/${LATIN_SLUG}`,
    );
  });
});

describe("student course open by slug", () => {
  it("finds دورة-الشكر for an enrolled student", () => {
    expect(
      lookupStudentCourse({
        param: ARABIC_SLUG,
        courses: [shukr, demo],
        enrolledSlugs: [ARABIC_SLUG],
      }),
    ).toBe("ok");
  });

  it("finds دورة-الشكر when Next provides the URL-encoded param", () => {
    expect(
      lookupStudentCourse({
        param: ARABIC_ENCODED,
        courses: [shukr],
        enrolledSlugs: [ARABIC_SLUG],
      }),
    ).toBe("ok");
  });

  it("keeps latin slug lookup unchanged", () => {
    const live = { slug: LATIN_SLUG, is_demo: false };
    expect(
      lookupStudentCourse({
        param: LATIN_SLUG,
        courses: [live],
        enrolledSlugs: [LATIN_SLUG],
      }),
    ).toBe("ok");
  });

  it("still hides is_demo courses as not found", () => {
    expect(
      lookupStudentCourse({
        param: LATIN_SLUG,
        courses: [demo],
        enrolledSlugs: [LATIN_SLUG],
      }),
    ).toBe("not_found");
  });

  it("still refuses a real course without an active paid enrollment", () => {
    expect(
      lookupStudentCourse({
        param: ARABIC_SLUG,
        courses: [shukr],
        enrolledSlugs: [],
      }),
    ).toBe("forbidden");
    expect(
      lookupStudentCourse({
        param: ARABIC_SLUG,
        courses: [shukr],
        enrolledSlugs: [ARABIC_SLUG],
        enrollmentStatus: "pending_payment",
        paymentConfirmed: false,
      }),
    ).toBe("forbidden");
  });
});

describe("course href encoding wiring", () => {
  it("public and dashboard course links go through encodeURIComponent helpers", () => {
    const files = [
      "src/components/CourseCard.tsx",
      "src/components/CourseDetailClient.tsx",
      "src/components/DashboardCoursesClient.tsx",
      "src/components/DashboardOverviewClient.tsx",
      "src/components/StudentCourseClient.tsx",
      "src/components/StudentLessonClient.tsx",
      "src/app/cart/page.tsx",
    ];
    for (const relative of files) {
      const source = readFileSync(path.resolve(process.cwd(), relative), "utf8");
      expect(source).toMatch(
        /publicCoursePath|dashboardCoursePath|dashboardLessonPath/,
      );
      expect(source).not.toMatch(/href=\{`\/courses\/\$\{/);
      expect(source).not.toMatch(/href=\{`\/dashboard\/courses\/\$\{/);
    }
  });
});
