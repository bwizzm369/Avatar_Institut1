import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildCoursePassOfferView } from "@/lib/courses/pass-offer";
import {
  asCourseCurrency,
  isVisibleInPublicCatalogue,
  mapPublicCourseRow,
  publicImageUrl,
  resolvePublicCourseBySlug,
  selectPublicCatalogueCourses,
  type PublicCatalogueRow,
} from "@/lib/courses/public-catalogue";

function row(
  overrides: Partial<PublicCatalogueRow> & Pick<PublicCatalogueRow, "slug">,
): PublicCatalogueRow {
  return {
    id: overrides.id ?? `id-${overrides.slug}`,
    slug: overrides.slug,
    title_en: overrides.title_en ?? "English title",
    title_ar: overrides.title_ar ?? "عنوان عربي",
    summary_en: overrides.summary_en ?? "English summary",
    summary_ar: overrides.summary_ar ?? "ملخص عربي",
    description_en: overrides.description_en ?? "English description",
    description_ar: overrides.description_ar ?? "وصف عربي",
    price_cents: overrides.price_cents ?? 9900,
    currency: overrides.currency ?? "EUR",
    duration_weeks: overrides.duration_weeks ?? 8,
    level_en: overrides.level_en ?? "Beginner",
    level_ar: overrides.level_ar ?? "مبتدئ",
    is_published: overrides.is_published ?? true,
    image_url: overrides.image_url ?? null,
    is_for_sale: overrides.is_for_sale ?? true,
    student_pass_included: overrides.student_pass_included ?? false,
    student_pass_discount_percent:
      overrides.student_pass_discount_percent ?? 0,
    legacy_only: overrides.legacy_only ?? false,
  };
}

describe("public catalogue visibility", () => {
  it("shows a published non-legacy course", () => {
    expect(
      isVisibleInPublicCatalogue(
        row({ slug: "kontou", is_published: true, legacy_only: false }),
      ),
    ).toBe(true);
  });

  it("hides an unpublished course", () => {
    const unpublished = row({
      slug: "draft",
      is_published: false,
      title_en: "Hidden draft",
    });
    expect(isVisibleInPublicCatalogue(unpublished)).toBe(false);
    expect(selectPublicCatalogueCourses([unpublished])).toEqual([]);
  });

  it("hides a legacy_only course even when published", () => {
    const legacy = row({
      slug: "old-academy",
      is_published: true,
      legacy_only: true,
      title_en: "Legacy only",
    });
    expect(isVisibleInPublicCatalogue(legacy)).toBe(false);
    expect(selectPublicCatalogueCourses([legacy])).toEqual([]);
  });
});

describe("public catalogue slug resolution", () => {
  const published = row({
    slug: "dhat-al-ghayb",
    title_en: "Dhat al-Ghayb",
    title_ar: "دورة الغيب",
    is_published: true,
  });
  const unpublished = row({
    slug: "secret-draft",
    is_published: false,
    title_en: "Secret",
  });
  const legacy = row({
    slug: "archive",
    is_published: true,
    legacy_only: true,
  });

  it("loads the real course for a published slug", () => {
    const course = resolvePublicCourseBySlug(
      [unpublished, published, legacy],
      "dhat-al-ghayb",
    );
    expect(course?.slug).toBe("dhat-al-ghayb");
    expect(course?.title.en).toBe("Dhat al-Ghayb");
    expect(course?.title.ar).toBe("دورة الغيب");
    expect(course?.isDemo).toBe(false);
  });

  it("returns null for an unknown slug (404)", () => {
    expect(
      resolvePublicCourseBySlug([published], "does-not-exist"),
    ).toBeNull();
  });

  it("returns null for unpublished and legacy_only slugs (404)", () => {
    expect(resolvePublicCourseBySlug([unpublished], "secret-draft")).toBeNull();
    expect(resolvePublicCourseBySlug([legacy], "archive")).toBeNull();
  });

  it("resolves دورة-الشكر from a decoded or percent-encoded param", () => {
    const arabic = row({
      slug: "دورة-الشكر",
      title_en: "",
      title_ar: "دورة الشكر",
    });
    expect(resolvePublicCourseBySlug([arabic], "دورة-الشكر")?.slug).toBe(
      "دورة-الشكر",
    );
    expect(
      resolvePublicCourseBySlug(
        [arabic],
        encodeURIComponent("دورة-الشكر"),
      )?.slug,
    ).toBe("دورة-الشكر");
  });
});

describe("public catalogue Student Pass labels", () => {
  it("maps included-in-pass for catalogue display", () => {
    const course = mapPublicCourseRow(
      row({
        slug: "included",
        student_pass_included: true,
        student_pass_discount_percent: 40,
      }),
    );
    expect(course.studentPassIncluded).toBe(true);
    const offer = buildCoursePassOfferView({
      meta: {
        slug: course.slug,
        studentPassIncluded: true,
        studentPassDiscountPercent: 40,
        priceCents: course.priceCents,
        currency: course.currency,
      },
      hasActiveStudentPass: false,
      hasLearnerAccess: false,
      fallbackPriceCents: course.priceCents,
    });
    expect(offer.studentPassIncluded).toBe(true);
    expect(offer.accessIncluded).toBe(false);
  });

  it("maps member discount percent for catalogue display", () => {
    const course = mapPublicCourseRow(
      row({
        slug: "discounted",
        student_pass_included: false,
        student_pass_discount_percent: 25,
        price_cents: 20000,
      }),
    );
    expect(course.studentPassDiscountPercent).toBe(25);
    const offer = buildCoursePassOfferView({
      meta: {
        slug: course.slug,
        studentPassIncluded: false,
        studentPassDiscountPercent: 25,
        priceCents: 20000,
        currency: "EUR",
      },
      hasActiveStudentPass: true,
      hasLearnerAccess: false,
      fallbackPriceCents: 20000,
    });
    expect(offer.showMemberPrice).toBe(true);
    expect(offer.discountPercentApplied).toBe(25);
    expect(offer.memberPriceCents).toBe(15000);
  });
});

describe("public catalogue mapping helpers", () => {
  it("accepts only EUR/USD/CHF and public image URLs", () => {
    expect(asCourseCurrency("usd")).toBe("USD");
    expect(asCourseCurrency("yen")).toBe("EUR");
    expect(publicImageUrl("https://cdn.example.com/cover.jpg")).toBe(
      "https://cdn.example.com/cover.jpg",
    );
    expect(publicImageUrl("javascript:alert(1)")).toBeNull();
    expect(publicImageUrl("/brand/cover.jpg")).toBe("/brand/cover.jpg");
  });

  it("does not flag mapped catalogue courses as demonstration", () => {
    const course = mapPublicCourseRow(row({ slug: "live" }));
    expect(course.isDemo).toBe(false);
    expect(course.modules).toEqual([]);
  });
});

describe("public catalogue language fallback", () => {
  it("EN + title_en present → title_en", () => {
    const course = mapPublicCourseRow(
      row({
        slug: "shukr",
        title_en: "Gratitude Course",
        title_ar: "دورة الشكر",
      }),
    );
    expect(course.title.en).toBe("Gratitude Course");
  });

  it("EN + title_en empty → title_ar", () => {
    const course = mapPublicCourseRow(
      row({
        slug: "shukr",
        title_en: "",
        title_ar: "دورة الشكر",
      }),
    );
    expect(course.title.en).toBe("دورة الشكر");
    expect(course.title.ar).toBe("دورة الشكر");
  });

  it("AR + title_ar present → title_ar", () => {
    const course = mapPublicCourseRow(
      row({
        slug: "shukr",
        title_en: "Gratitude Course",
        title_ar: "دورة الشكر",
      }),
    );
    expect(course.title.ar).toBe("دورة الشكر");
  });

  it("falls back to Arabic description when English is empty", () => {
    const course = mapPublicCourseRow(
      row({
        slug: "shukr",
        summary_en: "",
        summary_ar: "",
        description_en: "",
        description_ar: "وصف الشكر",
      }),
    );
    expect(course.description.en).toBe("وصف الشكر");
    expect(course.summary.en).toBe("وصف الشكر");
  });

  it("never lists a public card without a title", () => {
    const untitled = row({
      slug: "no-title",
      title_en: "  ",
      title_ar: "",
      is_published: true,
    });
    expect(selectPublicCatalogueCourses([untitled])).toEqual([]);
    expect(resolvePublicCourseBySlug([untitled], "no-title")).toBeNull();
  });
});

describe("public catalogue slug lookup wiring", () => {
  it("normalizes the route param before .eq(slug)", () => {
    const source = readFileSync(
      path.resolve(process.cwd(), "src/lib/courses/public-catalogue.ts"),
      "utf8",
    );
    expect(source).toMatch(/resolveCourseSlugParam/);
    expect(source).toMatch(/\.eq\("slug", normalized\)/);

    const page = readFileSync(
      path.resolve(process.cwd(), "src/app/courses/[slug]/page.tsx"),
      "utf8",
    );
    expect(page).toMatch(/resolveCourseSlugParam/);
    expect(page).toMatch(/getPublicCourseBySlug/);
  });
});
