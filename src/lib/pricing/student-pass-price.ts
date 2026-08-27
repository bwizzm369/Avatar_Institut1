/**
 * Server-authoritative Student Pass pricing for a single course.
 * Never trust browser-supplied prices or discount percents.
 */

export type CoursePriceForUserInput = {
  priceCents: number | null;
  studentPassIncluded: boolean;
  studentPassDiscountPercent: number;
  hasActiveStudentPass: boolean;
};

export type CoursePriceForUserResult = {
  /** Pass member may access without purchase (included courses only). */
  accessIncluded: boolean;
  listPriceCents: number | null;
  /** Payable amount in cents; 0 when accessIncluded. */
  priceCents: number | null;
  /** Discount actually applied (0 when included or inactive pass). */
  discountPercentApplied: number;
  saveCents: number;
};

function clampDiscountPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.trunc(value)));
}

/**
 * Computes list vs member price for a course.
 *
 * - Included + active pass → accessIncluded, no checkout price
 * - Not included + active pass + discount → member price from list
 * - Inactive pass or 0% → list price
 * - Included ignores discount entirely
 */
export function getCoursePriceForUser(
  input: CoursePriceForUserInput,
): CoursePriceForUserResult {
  const listPriceCents =
    input.priceCents == null || !Number.isFinite(input.priceCents)
      ? null
      : Math.max(0, Math.round(input.priceCents));
  const discountPercent = clampDiscountPercent(
    input.studentPassDiscountPercent,
  );

  if (input.hasActiveStudentPass && input.studentPassIncluded) {
    return {
      accessIncluded: true,
      listPriceCents,
      priceCents: 0,
      discountPercentApplied: 0,
      saveCents: listPriceCents ?? 0,
    };
  }

  if (listPriceCents == null) {
    return {
      accessIncluded: false,
      listPriceCents: null,
      priceCents: null,
      discountPercentApplied: 0,
      saveCents: 0,
    };
  }

  if (
    input.hasActiveStudentPass &&
    !input.studentPassIncluded &&
    discountPercent > 0
  ) {
    const priceCents = Math.round(
      (listPriceCents * (100 - discountPercent)) / 100,
    );
    return {
      accessIncluded: false,
      listPriceCents,
      priceCents,
      discountPercentApplied: discountPercent,
      saveCents: listPriceCents - priceCents,
    };
  }

  return {
    accessIncluded: false,
    listPriceCents,
    priceCents: listPriceCents,
    discountPercentApplied: 0,
    saveCents: 0,
  };
}

/** Admin list / preview label for Student Pass benefit. */
export function formatStudentPassBenefitLabel(input: {
  studentPassIncluded: boolean;
  studentPassDiscountPercent: number;
}): "Included" | `${number}% off` | "No benefit" {
  if (input.studentPassIncluded) return "Included";
  const percent = clampDiscountPercent(input.studentPassDiscountPercent);
  if (percent > 0) return `${percent}% off`;
  return "No benefit";
}
