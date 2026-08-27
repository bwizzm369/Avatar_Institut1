import { getCoursePriceForUser } from "@/lib/pricing/student-pass-price";

export type CoursePassMeta = {
  slug: string;
  studentPassIncluded: boolean;
  studentPassDiscountPercent: number;
  priceCents: number | null;
  currency: string;
};

export type CoursePassOfferView = {
  hasActiveStudentPass: boolean;
  hasLearnerAccess: boolean;
  accessIncluded: boolean;
  listPriceCents: number | null;
  memberPriceCents: number | null;
  discountPercentApplied: number;
  showMemberPrice: boolean;
  studentPassIncluded: boolean;
  studentPassDiscountPercent: number;
};

export function buildCoursePassOfferView(input: {
  meta: CoursePassMeta | null;
  hasActiveStudentPass: boolean;
  hasLearnerAccess: boolean;
  fallbackPriceCents: number;
}): CoursePassOfferView {
  const listPriceCents =
    input.meta?.priceCents ?? input.fallbackPriceCents;
  const priced = getCoursePriceForUser({
    priceCents: listPriceCents,
    studentPassIncluded: input.meta?.studentPassIncluded ?? false,
    studentPassDiscountPercent: input.meta?.studentPassDiscountPercent ?? 0,
    hasActiveStudentPass: input.hasActiveStudentPass,
  });

  return {
    hasActiveStudentPass: input.hasActiveStudentPass,
    hasLearnerAccess: input.hasLearnerAccess,
    accessIncluded: priced.accessIncluded,
    listPriceCents: priced.listPriceCents,
    memberPriceCents: priced.accessIncluded ? 0 : priced.priceCents,
    discountPercentApplied: priced.discountPercentApplied,
    showMemberPrice:
      input.hasActiveStudentPass &&
      !priced.accessIncluded &&
      priced.discountPercentApplied > 0,
    studentPassIncluded: input.meta?.studentPassIncluded ?? false,
    studentPassDiscountPercent: input.meta?.studentPassDiscountPercent ?? 0,
  };
}
