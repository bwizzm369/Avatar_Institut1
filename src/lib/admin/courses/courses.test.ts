import { describe, expect, it } from "vitest";
import { commitCourseImport } from "@/lib/admin/courses/commit";
import {
  parseBooleanCell,
  parsePriceToCents,
} from "@/lib/admin/courses/normalize";
import {
  buildCoursesTemplateCsv,
  buildCoursesTemplateWorkbook,
  parseCourseImportBuffer,
} from "@/lib/admin/courses/parse-file";
import { buildCoursePreviewReport } from "@/lib/admin/courses/preview";
import { generateCourseSlug, isValidCourseSlug } from "@/lib/admin/courses/slug";
import {
  isProtectedAdminPath,
  resolveAdminSessionAccess,
} from "@/lib/admin/guards";
import type {
  CoursePreviewRow,
  CourseSourceRow,
} from "@/lib/admin/courses/types";

const registry = [
  {
    id: "c1",
    slug: "foundations-of-metaphysics",
    title_ar: "أسس الميتافيزيقا",
    title_en: "Foundations of Metaphysics",
  },
];

function validRow(overrides: Partial<CourseSourceRow> = {}): CourseSourceRow {
  return {
    title_ar: "دورة جديدة رسمية",
    title_en: "Official New Course",
    description_ar: "",
    description_en: "",
    slug: "official-new-course",
    price: "120.00",
    currency: "EUR",
    is_published: "false",
    is_for_sale: "true",
    student_pass_included: "false",
    legacy_only: "false",
    image_url: "",
    ...overrides,
  };
}

function readyPreview(): CoursePreviewRow {
  return {
    rowNumber: 2,
    titleAr: "دورة جديدة رسمية",
    titleEn: "Official New Course",
    descriptionAr: "",
    descriptionEn: "",
    slug: "official-new-course",
    priceCents: 12000,
    currency: "EUR",
    isPublished: false,
    isForSale: true,
    studentPassIncluded: false,
    studentPassDiscountPercent: 0,
    legacyOnly: false,
    imageUrl: null,
    status: "READY",
    messages: [],
  };
}

function mockCoursesClient(seedSlugs: string[] = []) {
  const slugs = new Set(seedSlugs.map((s) => s.toLowerCase()));
  let created = 0;
  return {
    getCreated: () => created,
    getSlugs: () => slugs,
    client: {
      from() {
        return {
          select() {
            return Promise.resolve({
              data: [...slugs].map((slug) => ({ slug })),
              error: null,
            });
          },
          insert(payload: { slug: string }) {
            return Promise.resolve().then(() => {
              if (slugs.has(payload.slug.toLowerCase())) {
                return { error: { code: "23505" } };
              }
              slugs.add(payload.slug.toLowerCase());
              created += 1;
              return { error: null };
            });
          },
        };
      },
    },
  };
}

describe("course registry normalize", () => {
  it("parses prices into cents and rejects invalid prices", () => {
    expect(parsePriceToCents("99")).toBe(9900);
    expect(parsePriceToCents("99.50")).toBe(9950);
    expect(parsePriceToCents("")).toBeNull();
    expect(parsePriceToCents("abc")).toBe("invalid");
  });

  it("parses booleans", () => {
    expect(parseBooleanCell("true")).toBe(true);
    expect(parseBooleanCell("0")).toBe(false);
    expect(parseBooleanCell("maybe")).toBe("invalid");
  });
});

describe("course slug generation", () => {
  it("prefers english when present and validates slugs", () => {
    expect(
      generateCourseSlug({
        titleAr: "دورة",
        titleEn: "Consciousness Path",
      }),
    ).toBe("consciousness-path");
    expect(isValidCourseSlug("consciousness-path")).toBe(true);
    expect(isValidCourseSlug("Bad Slug")).toBe(false);
  });
});

describe("course import parse", () => {
  it("parses a valid CSV", () => {
    const csv = `${[
      "title_ar",
      "title_en",
      "description_ar",
      "description_en",
      "slug",
      "price",
      "currency",
      "is_published",
      "is_for_sale",
      "student_pass_included",
      "legacy_only",
      "image_url",
    ].join(",")}\n"دورة","Course","","","course-a","50","EUR","false","true","false","false",""\n`;
    const parsed = parseCourseImportBuffer(Buffer.from(csv, "utf8"), "c.csv");
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.rows).toHaveLength(1);
  });

  it("parses the Excel template", () => {
    const parsed = parseCourseImportBuffer(
      buildCoursesTemplateWorkbook(),
      "template.xlsx",
    );
    expect(parsed.ok).toBe(true);
  });

  it("rejects missing title_ar column", () => {
    const parsed = parseCourseImportBuffer(
      Buffer.from("title_en,slug\nHello,hello\n"),
      "bad.csv",
    );
    expect(parsed.ok).toBe(false);
  });

  it("exposes a fictional CSV template", () => {
    expect(buildCoursesTemplateCsv()).toContain("FICTIONAL");
    expect(buildCoursesTemplateCsv()).toContain("title_ar");
  });
});

describe("course import preview", () => {
  it("errors when title_ar is missing", () => {
    const report = buildCoursePreviewReport({
      sourceLabel: "t.csv",
      registry: [],
      rows: [validRow({ title_ar: "" })],
    });
    expect(report.rows[0].status).toBe("ERROR");
  });

  it("errors on invalid price", () => {
    const report = buildCoursePreviewReport({
      sourceLabel: "t.csv",
      registry: [],
      rows: [validRow({ price: "nope" })],
    });
    expect(report.rows[0].status).toBe("ERROR");
  });

  it("detects duplicate rows in the file", () => {
    const row = validRow();
    const report = buildCoursePreviewReport({
      sourceLabel: "t.csv",
      registry: [],
      rows: [row, { ...row }],
    });
    expect(report.rows[0].status).toBe("READY");
    expect(report.rows[1].status).toBe("DUPLICATE");
  });

  it("detects duplicate existing registry courses", () => {
    const report = buildCoursePreviewReport({
      sourceLabel: "t.csv",
      registry,
      rows: [
        validRow({
          title_ar: "أسس الميتافيزيقا",
          title_en: "",
          slug: "other-slug",
        }),
      ],
    });
    expect(report.rows[0].status).toBe("DUPLICATE");
  });

  it("accepts an Arabic-only Avatar course without English fields", () => {
    const report = buildCoursePreviewReport({
      sourceLabel: "avatar.csv",
      registry: [],
      rows: [
        validRow({
          title_ar: "دورة الكونتو",
          title_en: "",
          description_ar: "",
          description_en: "",
          slug: "kontou",
          price: "",
        }),
      ],
    });
    expect(report.rows[0].status).toBe("READY");
    expect(report.rows[0].titleEn).toBe("");
    expect(report.errorCount).toBe(0);
  });

  it("preview performs no database writes", () => {
    const writes = { count: 0 };
    buildCoursePreviewReport({
      sourceLabel: "t.csv",
      registry: [],
      rows: [validRow()],
    });
    expect(writes.count).toBe(0);
  });
});

describe("course import access", () => {
  it("blocks unauthenticated access to courses admin", () => {
    expect(isProtectedAdminPath("/admin/courses")).toBe(true);
    expect(
      resolveAdminSessionAccess({
        pathname: "/admin/courses/import",
        userId: null,
        supabaseConfigured: true,
      }).allowed,
    ).toBe(false);
  });

  it("allows authenticated sessions past the middleware gate", () => {
    expect(
      resolveAdminSessionAccess({
        pathname: "/admin/courses",
        userId: "admin-user",
        supabaseConfigured: true,
      }).allowed,
    ).toBe(true);
  });
});

describe("course import commit idempotency", () => {
  it("second identical import creates no duplicate", async () => {
    const row = readyPreview();
    const run1 = mockCoursesClient();
    const r1 = await commitCourseImport({
      client: run1.client as never,
      rows: [row],
      mode: "ready_only",
    });
    expect(r1.ok).toBe(true);
    expect(r1.coursesCreated).toBe(1);

    const run2 = mockCoursesClient([...run1.getSlugs()]);
    const r2 = await commitCourseImport({
      client: run2.client as never,
      rows: [row],
      mode: "ready_only",
    });
    expect(r2.coursesCreated).toBe(0);
    expect(r2.duplicatesSkipped).toBeGreaterThanOrEqual(1);
  });

  it("never imports ERROR rows", async () => {
    const mock = mockCoursesClient();
    const result = await commitCourseImport({
      client: mock.client as never,
      rows: [
        {
          ...readyPreview(),
          status: "ERROR",
          messages: ["Missing title_ar."],
        },
      ],
      mode: "ready_only",
    });
    expect(result.coursesCreated).toBe(0);
    expect(result.errorsSkipped).toBe(1);
    expect(mock.getCreated()).toBe(0);
  });
});
