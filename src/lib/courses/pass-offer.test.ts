import { describe, expect, it } from "vitest";
import { buildCoursePassOfferView } from "@/lib/courses/pass-offer";

describe("buildCoursePassOfferView", () => {
  it("shows member discount only for active Pass members", () => {
    const offer = buildCoursePassOfferView({
      meta: {
        slug: "consciousness-exploration",
        studentPassIncluded: false,
        studentPassDiscountPercent: 20,
        priceCents: 14900,
        currency: "EUR",
      },
      hasActiveStudentPass: true,
      hasLearnerAccess: false,
      fallbackPriceCents: 14900,
    });
    expect(offer.showMemberPrice).toBe(true);
    expect(offer.memberPriceCents).toBe(11920);
    expect(offer.studentPassDiscountPercent).toBe(20);
    expect(offer.studentPassIncluded).toBe(false);
  });

  it("hides member price for non-members", () => {
    const offer = buildCoursePassOfferView({
      meta: {
        slug: "consciousness-exploration",
        studentPassIncluded: false,
        studentPassDiscountPercent: 20,
        priceCents: 14900,
        currency: "EUR",
      },
      hasActiveStudentPass: false,
      hasLearnerAccess: false,
      fallbackPriceCents: 14900,
    });
    expect(offer.showMemberPrice).toBe(false);
    expect(offer.memberPriceCents).toBe(14900);
  });
});
