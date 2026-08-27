export const COURSE_IMPORT_COLUMNS = [
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
] as const;

export type CourseImportColumn = (typeof COURSE_IMPORT_COLUMNS)[number];

export const MAX_COURSE_IMPORT_ROWS = 1000;
export const MAX_COURSE_IMPORT_BYTES = 2 * 1024 * 1024;
export const COURSE_CURRENCIES = ["EUR", "USD", "CHF"] as const;
export type CourseCurrency = (typeof COURSE_CURRENCIES)[number];

export type CourseImportRowStatus = "READY" | "WARNING" | "ERROR" | "DUPLICATE";

export type RawCourseImportRow = Record<string, string>;

/**
 * Source-agnostic course row after parsing a tabular source
 * (Excel, CSV, and later Google Sheets).
 */
export type CourseSourceRow = {
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  slug: string;
  price: string;
  currency: string;
  is_published: string;
  is_for_sale: string;
  student_pass_included: string;
  legacy_only: string;
  image_url: string;
};

export type ExistingCourseRegistryEntry = {
  id: string;
  slug: string;
  title_ar: string;
  title_en: string;
};

export type CoursePreviewRow = {
  rowNumber: number;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  slug: string;
  priceCents: number | null;
  currency: CourseCurrency;
  isPublished: boolean;
  isForSale: boolean;
  studentPassIncluded: boolean;
  studentPassDiscountPercent: number;
  legacyOnly: boolean;
  imageUrl: string | null;
  status: CourseImportRowStatus;
  messages: string[];
};

export type CoursePreviewReport = {
  ok: boolean;
  sourceLabel: string;
  totalRows: number;
  readyCount: number;
  warningCount: number;
  errorCount: number;
  duplicateCount: number;
  rows: CoursePreviewRow[];
  parseErrors: string[];
};

export type CourseImportCommitResult = {
  ok: boolean;
  error?: string;
  rowsProcessed: number;
  coursesCreated: number;
  duplicatesSkipped: number;
  errorsSkipped: number;
  warningsImported: number;
};

export type AdminCourseFormInput = {
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  slug: string;
  price: string;
  currency: string;
  is_published: boolean;
  is_for_sale: boolean;
  student_pass_included: boolean;
  student_pass_discount_percent: string;
  legacy_only: boolean;
  image_url: string;
};
