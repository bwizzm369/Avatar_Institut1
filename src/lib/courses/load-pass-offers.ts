import { hasActiveStudentPassForProfile } from "@/lib/admin/student-pass/access";
import {
  buildCoursePassOfferView,
  type CoursePassMeta,
  type CoursePassOfferView,
} from "@/lib/courses/pass-offer";
import { isActiveEnrollmentRow } from "@/lib/learning/progress";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Course } from "@/types";

export type CoursePassOfferMap = Record<string, CoursePassOfferView>;

/**
 * Loads Student Pass commercial meta + learner access flags for catalogue UI.
 * Pricing display only — checkout still re-reads from Supabase.
 */
export async function loadCoursePassOffersForCourses(
  courses: Course[],
): Promise<{
  offers: CoursePassOfferMap;
  hasActiveStudentPass: boolean;
}> {
  const empty = {
    offers: Object.fromEntries(
      courses.map((course) => [
        course.slug,
        buildCoursePassOfferView({
          meta: null,
          hasActiveStudentPass: false,
          hasLearnerAccess: false,
          fallbackPriceCents: course.priceCents,
        }),
      ]),
    ) as CoursePassOfferMap,
    hasActiveStudentPass: false,
  };

  if (!isSupabaseConfigured() || courses.length === 0) {
    return empty;
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const slugs = courses.map((course) => course.slug);
  const { data: rows } = await supabase
    .from("courses")
    .select(
      "id, slug, price_cents, currency, student_pass_included, student_pass_discount_percent",
    )
    .in("slug", slugs);

  const metaBySlug = new Map<string, CoursePassMeta & { id: string }>();
  for (const row of rows ?? []) {
    metaBySlug.set(row.slug, {
      id: row.id,
      slug: row.slug,
      studentPassIncluded: row.student_pass_included,
      studentPassDiscountPercent: row.student_pass_discount_percent ?? 0,
      priceCents: row.price_cents,
      currency: row.currency,
    });
  }

  const hasActiveStudentPass = user
    ? await hasActiveStudentPassForProfile(user.id)
    : false;

  const accessBySlug = new Map<string, boolean>();
  if (user) {
    const courseIds = [...metaBySlug.values()].map((row) => row.id);
    if (courseIds.length > 0) {
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("course_id, status, payment_confirmed_at")
        .eq("user_id", user.id)
        .in("course_id", courseIds);

      const enrolledIds = new Set(
        (enrollments ?? [])
          .filter((row) => isActiveEnrollmentRow(row))
          .map((row) => row.course_id),
      );

      for (const [slug, meta] of metaBySlug) {
        const viaEnrollment = enrolledIds.has(meta.id);
        const viaPass =
          hasActiveStudentPass && meta.studentPassIncluded;
        accessBySlug.set(slug, viaEnrollment || viaPass);
      }
    }
  }

  const offers: CoursePassOfferMap = {};
  for (const course of courses) {
    const meta = metaBySlug.get(course.slug) ??
      (course.studentPassIncluded != null
        ? {
            slug: course.slug,
            studentPassIncluded: Boolean(course.studentPassIncluded),
            studentPassDiscountPercent: course.studentPassDiscountPercent ?? 0,
            priceCents: course.priceCents,
            currency: course.currency,
          }
        : null);
    offers[course.slug] = buildCoursePassOfferView({
      meta,
      hasActiveStudentPass,
      hasLearnerAccess: accessBySlug.get(course.slug) ?? false,
      fallbackPriceCents: course.priceCents,
    });
  }

  return { offers, hasActiveStudentPass };
}
