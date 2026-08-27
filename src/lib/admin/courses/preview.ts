import {
  formatCentsForInput,
  normalizeCourseTitleKey,
  normalizeOptionalText,
  parseBooleanCell,
  parseCurrencyCell,
  parseDiscountPercent,
  parsePriceToCents,
} from "@/lib/admin/courses/normalize";
import { generateCourseSlug, isValidCourseSlug } from "@/lib/admin/courses/slug";
import type {
  AdminCourseFormInput,
  CoursePreviewReport,
  CoursePreviewRow,
  CourseSourceRow,
  ExistingCourseRegistryEntry,
} from "@/lib/admin/courses/types";

function findExistingMatch(
  slug: string,
  titleAr: string,
  titleEn: string,
  registry: ExistingCourseRegistryEntry[],
): ExistingCourseRegistryEntry | null {
  const slugKey = slug.toLowerCase();
  const arKey = normalizeCourseTitleKey(titleAr);
  const enKey = titleEn ? normalizeCourseTitleKey(titleEn) : "";

  for (const course of registry) {
    if (course.slug.toLowerCase() === slugKey) return course;
    if (normalizeCourseTitleKey(course.title_ar) === arKey) return course;
    if (
      enKey &&
      course.title_en &&
      normalizeCourseTitleKey(course.title_en) === enKey
    ) {
      return course;
    }
  }
  return null;
}

function validateSourceRow(
  raw: CourseSourceRow,
  rowNumber: number,
  registry: ExistingCourseRegistryEntry[],
  seenSlugs: Map<string, number>,
  seenTitlesAr: Map<string, number>,
): CoursePreviewRow {
  const messages: string[] = [];
  let status: CoursePreviewRow["status"] = "READY";

  const titleAr = normalizeOptionalText(raw.title_ar);
  const titleEn = normalizeOptionalText(raw.title_en);
  const descriptionAr = normalizeOptionalText(raw.description_ar);
  const descriptionEn = normalizeOptionalText(raw.description_en);
  const imageUrl = normalizeOptionalText(raw.image_url) || null;

  if (!titleAr) {
    status = "ERROR";
    messages.push("Missing title_ar.");
  }

  const priceResult = parsePriceToCents(raw.price);
  if (priceResult === "invalid") {
    status = "ERROR";
    messages.push("Invalid price.");
  }
  const priceCents = priceResult === "invalid" ? null : priceResult;

  const currencyResult = parseCurrencyCell(raw.currency);
  if (currencyResult === "invalid") {
    status = "ERROR";
    messages.push("Invalid currency (use EUR, USD, or CHF).");
  }
  const currency = currencyResult === "invalid" ? "EUR" : currencyResult;

  const published = parseBooleanCell(raw.is_published);
  const forSale = parseBooleanCell(raw.is_for_sale);
  const passIncluded = parseBooleanCell(raw.student_pass_included);
  const legacyOnly = parseBooleanCell(raw.legacy_only);
  const discountPercent = parseDiscountPercent(
    (raw as CourseSourceRow & { student_pass_discount_percent?: string })
      .student_pass_discount_percent ?? "0",
  );

  for (const [label, value] of [
    ["is_published", published],
    ["is_for_sale", forSale],
    ["student_pass_included", passIncluded],
    ["legacy_only", legacyOnly],
  ] as const) {
    if (value === "invalid") {
      status = "ERROR";
      messages.push(`Invalid ${label} (use true/false).`);
    }
  }

  if (discountPercent === "invalid") {
    status = "ERROR";
    messages.push("Invalid student_pass_discount_percent (use 0–100).");
  }

  const slug = generateCourseSlug({
    titleAr,
    titleEn: titleEn || null,
    explicitSlug: raw.slug,
  });

  if (!isValidCourseSlug(slug)) {
    status = "ERROR";
    messages.push("Invalid slug.");
  }

  if (status !== "ERROR" && titleAr) {
    const slugKey = slug.toLowerCase();
    const arKey = normalizeCourseTitleKey(titleAr);
    const priorSlug = seenSlugs.get(slugKey);
    const priorTitle = seenTitlesAr.get(arKey);
    if (priorSlug !== undefined) {
      status = "DUPLICATE";
      messages.push(`Duplicate slug of row ${priorSlug} in this file.`);
    } else if (priorTitle !== undefined) {
      status = "DUPLICATE";
      messages.push(`Duplicate title_ar of row ${priorTitle} in this file.`);
    } else {
      seenSlugs.set(slugKey, rowNumber);
      seenTitlesAr.set(arKey, rowNumber);
      const existing = findExistingMatch(slug, titleAr, titleEn, registry);
      if (existing) {
        status = "DUPLICATE";
        messages.push(
          `Duplicate of existing course (${existing.slug}). Update Existing is not enabled in this lot.`,
        );
      }
    }
  }

  if (
    status === "READY" &&
    !normalizeOptionalText(raw.slug) &&
    titleAr
  ) {
    status = "WARNING";
    messages.push("Slug was empty — generated automatically.");
  }

  return {
    rowNumber,
    titleAr: titleAr || "(missing)",
    titleEn,
    descriptionAr,
    descriptionEn,
    slug,
    priceCents,
    currency,
    isPublished: published === true,
    isForSale: forSale === true,
    studentPassIncluded: passIncluded === true,
    studentPassDiscountPercent:
      discountPercent === "invalid" ? 0 : discountPercent,
    legacyOnly: legacyOnly === true,
    imageUrl,
    status,
    messages,
  };
}

/**
 * Pure preview — no database writes.
 * Accepts rows from any CourseImportSource (file today, Sheets later).
 */
export function buildCoursePreviewReport(options: {
  sourceLabel: string;
  rows: CourseSourceRow[];
  registry: ExistingCourseRegistryEntry[];
  parseErrors?: string[];
}): CoursePreviewReport {
  const seenSlugs = new Map<string, number>();
  const seenTitlesAr = new Map<string, number>();
  const rows: CoursePreviewRow[] = options.rows.map((raw, index) =>
    validateSourceRow(
      raw,
      index + 2,
      options.registry,
      seenSlugs,
      seenTitlesAr,
    ),
  );

  const parseErrors = options.parseErrors ?? [];
  return {
    ok: parseErrors.length === 0 && rows.every((r) => r.status !== "ERROR"),
    sourceLabel: options.sourceLabel,
    totalRows: rows.length,
    readyCount: rows.filter((r) => r.status === "READY").length,
    warningCount: rows.filter((r) => r.status === "WARNING").length,
    errorCount: rows.filter((r) => r.status === "ERROR").length,
    duplicateCount: rows.filter((r) => r.status === "DUPLICATE").length,
    rows,
    parseErrors,
  };
}

export function validateManualCourseForm(
  input: AdminCourseFormInput,
  options?: { existingId?: string; registry?: ExistingCourseRegistryEntry[] },
): { ok: true; values: CoursePreviewRow } | { ok: false; errors: string[] } {
  const source: CourseSourceRow & { student_pass_discount_percent: string } = {
    title_ar: input.title_ar,
    title_en: input.title_en,
    description_ar: input.description_ar,
    description_en: input.description_en,
    slug: input.slug,
    price: input.price,
    currency: input.currency,
    is_published: String(input.is_published),
    is_for_sale: String(input.is_for_sale),
    student_pass_included: String(input.student_pass_included),
    student_pass_discount_percent: input.student_pass_discount_percent,
    legacy_only: String(input.legacy_only),
    image_url: input.image_url,
  };

  const registry = (options?.registry ?? []).filter(
    (course) => course.id !== options?.existingId,
  );
  const row = validateSourceRow(source, 1, registry, new Map(), new Map());
  if (row.status === "ERROR") {
    return { ok: false, errors: row.messages };
  }
  // Manual save allows WARNING (auto slug) and treats DUPLICATE as error.
  if (row.status === "DUPLICATE") {
    return { ok: false, errors: row.messages };
  }
  return { ok: true, values: row };
}

export function courseRowToFormDefaults(row: {
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  slug: string;
  price_cents: number | null;
  currency: string;
  is_published: boolean;
  is_for_sale: boolean;
  student_pass_included: boolean;
  student_pass_discount_percent?: number;
  legacy_only: boolean;
  image_url: string | null;
}): AdminCourseFormInput {
  return {
    title_ar: row.title_ar,
    title_en: row.title_en,
    description_ar: row.description_ar,
    description_en: row.description_en,
    slug: row.slug,
    price: formatCentsForInput(row.price_cents),
    currency: row.currency,
    is_published: row.is_published,
    is_for_sale: row.is_for_sale,
    student_pass_included: row.student_pass_included,
    student_pass_discount_percent: String(
      row.student_pass_discount_percent ?? 0,
    ),
    legacy_only: row.legacy_only,
    image_url: row.image_url ?? "",
  };
}
