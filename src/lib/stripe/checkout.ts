import { getCourseBySlug } from "@/lib/courses";
import {
  getDemoCourseDbId,
  isDemoCourseSlug,
} from "@/lib/courses/demoDbIds";
import { getCoursePriceForUser } from "@/lib/pricing/student-pass-price";
import { getAppOrigin } from "@/lib/stripe/env";
import type { Course } from "@/types";

export type CheckoutCourse = {
  dbId: string;
  slug: string;
  titleEn: string;
  priceCents: number;
  currency: Course["currency"];
};

/** Trusted course row for checkout pricing (from Supabase, never from the browser). */
export type CheckoutCourseSource = {
  id: string;
  slug: string;
  titleEn: string;
  priceCents: number | null;
  currency: string;
  studentPassIncluded: boolean;
  studentPassDiscountPercent: number;
};

export type ResolveCheckoutForUserResult =
  | {
      ok: true;
      courses: CheckoutCourse[];
      includedSlugs: string[];
      hasActiveStudentPass: boolean;
    }
  | {
      ok: false;
      error:
        | "unknown_slug"
        | "empty_cart"
        | "included_with_pass"
        | "zero_amount"
        | "missing_price";
      includedSlugs?: string[];
      redirectSlug?: string;
    };

export type ParseCheckoutRequestResult =
  | { ok: true; slugs: string[] }
  | { ok: false; error: "unauthenticated" | "invalid_body" | "client_price_rejected" | "empty_cart" };

export type ResolveCheckoutCoursesResult =
  | { ok: true; courses: CheckoutCourse[] }
  | { ok: false; error: "unknown_slug" | "empty_cart" };

/**
 * Browser may send course slugs/ids only.
 * Any client-supplied price/amount/currency is rejected.
 */
export function parseCheckoutRequest(
  userId: string | null,
  body: unknown,
): ParseCheckoutRequestResult {
  if (!userId) {
    return { ok: false, error: "unauthenticated" };
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { ok: false, error: "invalid_body" };
  }

  const record = body as Record<string, unknown>;

  if (
    "user_id" in record ||
    "userId" in record ||
    "user" in record
  ) {
    return { ok: false, error: "invalid_body" };
  }

  if (
    "priceCents" in record ||
    "price_cents" in record ||
    "amount" in record ||
    "unit_amount" in record ||
    "currency" in record ||
    "prices" in record
  ) {
    return { ok: false, error: "client_price_rejected" };
  }

  const slugsRaw = record.slugs ?? record.courseSlugs;
  if (!Array.isArray(slugsRaw) || slugsRaw.length === 0) {
    return { ok: false, error: "empty_cart" };
  }

  const slugs: string[] = [];
  for (const value of slugsRaw) {
    if (typeof value !== "string" || !value.trim()) {
      return { ok: false, error: "invalid_body" };
    }
    slugs.push(value.trim());
  }

  return { ok: true, slugs: [...new Set(slugs)] };
}

/**
 * Resolves title, price, currency and DB id from the trusted server catalogue.
 * Never trusts browser-supplied amounts.
 */
export function resolveCheckoutCourses(
  slugs: string[],
): ResolveCheckoutCoursesResult {
  if (slugs.length === 0) {
    return { ok: false, error: "empty_cart" };
  }

  const courses: CheckoutCourse[] = [];
  for (const slug of slugs) {
    if (!isDemoCourseSlug(slug)) {
      return { ok: false, error: "unknown_slug" };
    }
    const course = getCourseBySlug(slug);
    if (!course) {
      return { ok: false, error: "unknown_slug" };
    }
    courses.push({
      dbId: getDemoCourseDbId(slug),
      slug: course.slug,
      titleEn: course.title.en,
      priceCents: course.priceCents,
      currency: course.currency,
    });
  }

  return { ok: true, courses };
}

function asCheckoutCurrency(value: string): Course["currency"] | null {
  const upper = value.trim().toUpperCase();
  if (upper === "EUR" || upper === "USD" || upper === "CHF") return upper;
  return null;
}

/**
 * Applies Student Pass pricing from trusted server sources.
 * Browser must never supply priceCents / discount / pass status.
 */
export function resolveCheckoutCoursesForUser(input: {
  slugs: string[];
  sources: CheckoutCourseSource[];
  hasActiveStudentPass: boolean;
}): ResolveCheckoutForUserResult {
  if (input.slugs.length === 0) {
    return { ok: false, error: "empty_cart" };
  }

  const bySlug = new Map(
    input.sources.map((course) => [course.slug, course] as const),
  );
  const payable: CheckoutCourse[] = [];
  const includedSlugs: string[] = [];

  for (const slug of input.slugs) {
    const source = bySlug.get(slug);
    if (!source) {
      return { ok: false, error: "unknown_slug" };
    }

    const currency = asCheckoutCurrency(source.currency);
    if (!currency) {
      return { ok: false, error: "unknown_slug" };
    }

    const priced = getCoursePriceForUser({
      priceCents: source.priceCents,
      studentPassIncluded: source.studentPassIncluded,
      studentPassDiscountPercent: source.studentPassDiscountPercent,
      hasActiveStudentPass: input.hasActiveStudentPass,
    });

    if (priced.accessIncluded) {
      includedSlugs.push(slug);
      continue;
    }

    if (priced.priceCents == null) {
      return { ok: false, error: "missing_price" };
    }

    if (priced.priceCents <= 0) {
      return { ok: false, error: "zero_amount" };
    }

    payable.push({
      dbId: source.id,
      slug: source.slug,
      titleEn: source.titleEn || source.slug,
      priceCents: priced.priceCents,
      currency,
    });
  }

  if (payable.length === 0) {
    if (includedSlugs.length > 0) {
      return {
        ok: false,
        error: "included_with_pass",
        includedSlugs,
        redirectSlug: includedSlugs[0],
      };
    }
    return { ok: false, error: "empty_cart" };
  }

  return {
    ok: true,
    courses: payable,
    includedSlugs,
    hasActiveStudentPass: input.hasActiveStudentPass,
  };
}

export function buildCheckoutSessionParams(input: {
  userId: string;
  courses: CheckoutCourse[];
  customerEmail?: string | null;
}): {
  mode: "payment";
  line_items: Array<{
    quantity: number;
    price_data: {
      currency: string;
      unit_amount: number;
      product_data: { name: string };
    };
  }>;
  success_url: string;
  cancel_url: string;
  client_reference_id: string;
  customer_email?: string;
  metadata: {
    user_id: string;
    course_ids: string;
    course_slugs: string;
  };
} {
  const origin = getAppOrigin();

  return {
    mode: "payment",
    line_items: input.courses.map((course) => ({
      quantity: 1,
      price_data: {
        currency: course.currency.toLowerCase(),
        unit_amount: course.priceCents,
        product_data: {
          name: `${course.titleEn} (demo)`,
        },
      },
    })),
    success_url: `${origin}/cart/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/cart`,
    client_reference_id: input.userId,
    ...(input.customerEmail
      ? { customer_email: input.customerEmail }
      : {}),
    metadata: {
      user_id: input.userId,
      course_ids: input.courses.map((c) => c.dbId).join(","),
      course_slugs: input.courses.map((c) => c.slug).join(","),
    },
  };
}

/** Ensures a multi-course cart uses a single currency (demo catalogue is EUR-only). */
export function assertSingleCurrency(courses: CheckoutCourse[]): boolean {
  if (courses.length === 0) return false;
  const first = courses[0].currency;
  return courses.every((course) => course.currency === first);
}
