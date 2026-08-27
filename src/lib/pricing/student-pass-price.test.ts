import { describe, expect, it } from "vitest";
import {
  formatStudentPassBenefitLabel,
  getCoursePriceForUser,
} from "@/lib/pricing/student-pass-price";

describe("getCoursePriceForUser", () => {
  it("Pass actif + included=true → accès inclus (ignore discount)", () => {
    const result = getCoursePriceForUser({
      priceCents: 14900,
      studentPassIncluded: true,
      studentPassDiscountPercent: 20,
      hasActiveStudentPass: true,
    });
    expect(result.accessIncluded).toBe(true);
    expect(result.priceCents).toBe(0);
    expect(result.discountPercentApplied).toBe(0);
    expect(result.listPriceCents).toBe(14900);
  });

  it("Pass actif + discount=20 → prix réduit exact", () => {
    const result = getCoursePriceForUser({
      priceCents: 14900,
      studentPassIncluded: false,
      studentPassDiscountPercent: 20,
      hasActiveStudentPass: true,
    });
    expect(result.accessIncluded).toBe(false);
    expect(result.priceCents).toBe(11920);
    expect(result.discountPercentApplied).toBe(20);
    expect(result.saveCents).toBe(2980);
  });

  it("Pass actif + discount=0 → prix normal", () => {
    const result = getCoursePriceForUser({
      priceCents: 9900,
      studentPassIncluded: false,
      studentPassDiscountPercent: 0,
      hasActiveStudentPass: true,
    });
    expect(result.priceCents).toBe(9900);
    expect(result.discountPercentApplied).toBe(0);
    expect(result.accessIncluded).toBe(false);
  });

  it("Pass inactif + discount=20 → prix normal", () => {
    const result = getCoursePriceForUser({
      priceCents: 14900,
      studentPassIncluded: false,
      studentPassDiscountPercent: 20,
      hasActiveStudentPass: false,
    });
    expect(result.priceCents).toBe(14900);
    expect(result.discountPercentApplied).toBe(0);
  });

  it("included=true ignore discount même avec Pass inactif (pas d’accès)", () => {
    const result = getCoursePriceForUser({
      priceCents: 14900,
      studentPassIncluded: true,
      studentPassDiscountPercent: 50,
      hasActiveStudentPass: false,
    });
    expect(result.accessIncluded).toBe(false);
    expect(result.priceCents).toBe(14900);
    expect(result.discountPercentApplied).toBe(0);
  });

  it("remise 100% → 0 centimes", () => {
    const result = getCoursePriceForUser({
      priceCents: 9900,
      studentPassIncluded: false,
      studentPassDiscountPercent: 100,
      hasActiveStudentPass: true,
    });
    expect(result.priceCents).toBe(0);
    expect(result.saveCents).toBe(9900);
  });

  it("remise 0% gérée", () => {
    expect(
      getCoursePriceForUser({
        priceCents: 5000,
        studentPassIncluded: false,
        studentPassDiscountPercent: 0,
        hasActiveStudentPass: true,
      }).priceCents,
    ).toBe(5000);
  });

  it("arrondit correctement en cents", () => {
    // 3333 * 0.15 = 499.95 → save 500; price 2833
    const result = getCoursePriceForUser({
      priceCents: 3333,
      studentPassIncluded: false,
      studentPassDiscountPercent: 15,
      hasActiveStudentPass: true,
    });
    expect(result.priceCents).toBe(2833);
    expect(result.saveCents).toBe(500);
  });
});

describe("formatStudentPassBenefitLabel", () => {
  it("formats Included / % off / No benefit", () => {
    expect(
      formatStudentPassBenefitLabel({
        studentPassIncluded: true,
        studentPassDiscountPercent: 20,
      }),
    ).toBe("Included");
    expect(
      formatStudentPassBenefitLabel({
        studentPassIncluded: false,
        studentPassDiscountPercent: 20,
      }),
    ).toBe("20% off");
    expect(
      formatStudentPassBenefitLabel({
        studentPassIncluded: false,
        studentPassDiscountPercent: 0,
      }),
    ).toBe("No benefit");
  });
});
