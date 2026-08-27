import * as XLSX from "xlsx";
import {
  COURSE_IMPORT_COLUMNS,
  MAX_COURSE_IMPORT_BYTES,
  MAX_COURSE_IMPORT_ROWS,
  type CourseImportColumn,
  type CourseSourceRow,
} from "@/lib/admin/courses/types";
import type { CourseImportSourceResult } from "@/lib/admin/courses/sources/types";
import { normalizeWhitespace } from "@/lib/admin/import/normalize";

function cellToString(value: unknown): string {
  if (value == null) return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return String(value);
}

function normalizeHeader(header: string): string {
  return normalizeWhitespace(header)
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function emptySourceRow(): CourseSourceRow {
  return {
    title_ar: "",
    title_en: "",
    description_ar: "",
    description_en: "",
    slug: "",
    price: "",
    currency: "",
    is_published: "",
    is_for_sale: "",
    student_pass_included: "",
    legacy_only: "",
    image_url: "",
  };
}

/**
 * Excel/CSV adapter — returns source-agnostic rows for preview/commit.
 */
export function parseCourseImportBuffer(
  buffer: ArrayBuffer | Buffer,
  fileName: string,
): CourseImportSourceResult {
  const bytes =
    buffer instanceof Buffer ? buffer : Buffer.from(new Uint8Array(buffer));
  const sourceLabel = fileName || "upload";

  if (bytes.byteLength === 0) {
    return { ok: false, sourceLabel, errors: ["File is empty."] };
  }
  if (bytes.byteLength > MAX_COURSE_IMPORT_BYTES) {
    return {
      ok: false,
      sourceLabel,
      errors: [`File exceeds the maximum size of ${MAX_COURSE_IMPORT_BYTES} bytes.`],
    };
  }

  const lower = fileName.toLowerCase();
  if (!lower.endsWith(".csv") && !lower.endsWith(".xlsx")) {
    return {
      ok: false,
      sourceLabel,
      errors: ["Invalid file type. Upload a .csv or .xlsx file."],
    };
  }

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(bytes, { type: "buffer", cellDates: true, raw: false });
  } catch {
    return {
      ok: false,
      sourceLabel,
      errors: ["Unable to read the file. Ensure it is a valid CSV or Excel file."],
    };
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { ok: false, sourceLabel, errors: ["Workbook has no sheets."] };
  }

  const matrix = XLSX.utils.sheet_to_json<(string | number | boolean | Date | null)[]>(
    workbook.Sheets[sheetName],
    { header: 1, defval: "", raw: false, blankrows: false },
  );

  if (matrix.length === 0) {
    return { ok: false, sourceLabel, errors: ["File has no header row."] };
  }

  const headerCells = (matrix[0] ?? []).map((cell) => cellToString(cell));
  const mapping: Partial<Record<CourseImportColumn, number>> = {};
  headerCells.forEach((header, index) => {
    const normalized = normalizeHeader(header);
    const match = COURSE_IMPORT_COLUMNS.find((col) => col === normalized);
    if (match) mapping[match] = index;
  });

  if (mapping.title_ar === undefined) {
    return {
      ok: false,
      sourceLabel,
      errors: ["Missing required column: title_ar."],
    };
  }

  const dataRows = matrix.slice(1);
  if (dataRows.length > MAX_COURSE_IMPORT_ROWS) {
    return {
      ok: false,
      sourceLabel,
      errors: [`File has more than ${MAX_COURSE_IMPORT_ROWS} data rows.`],
    };
  }

  const rows: CourseSourceRow[] = [];
  for (const cells of dataRows) {
    const values = (cells ?? []).map((cell) => cellToString(cell));
    if (values.every((v) => normalizeWhitespace(v) === "")) continue;

    const row = emptySourceRow();
    for (const column of COURSE_IMPORT_COLUMNS) {
      const index = mapping[column];
      row[column] = index === undefined ? "" : (values[index] ?? "");
    }
    rows.push(row);
  }

  if (rows.length === 0) {
    return { ok: false, sourceLabel, errors: ["File has no data rows."] };
  }

  return { ok: true, sourceLabel, rows };
}

export function buildCoursesTemplateWorkbook(): Buffer {
  const example = {
    title_ar: "دورة تجريبية (وهمية)",
    title_en: "Example Course (FICTIONAL)",
    description_ar: "وصف وهمي — استبدل بالبيانات الرسمية",
    description_en: "Fictional description — replace with official academy data",
    slug: "example-course-fictional",
    price: "99.00",
    currency: "EUR",
    is_published: "false",
    is_for_sale: "false",
    student_pass_included: "false",
    legacy_only: "false",
    image_url: "",
  };

  const sheet = XLSX.utils.json_to_sheet([example], {
    header: [...COURSE_IMPORT_COLUMNS],
  });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Courses");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

export function buildCoursesTemplateCsv(): string {
  const header = COURSE_IMPORT_COLUMNS.join(",");
  const example = [
    "دورة تجريبية (وهمية)",
    "Example Course (FICTIONAL)",
    "وصف وهمي — استبدل بالبيانات الرسمية",
    "Fictional description — replace with official academy data",
    "example-course-fictional",
    "99.00",
    "EUR",
    "false",
    "false",
    "false",
    "false",
    "",
  ]
    .map((value) => `"${value.replace(/"/g, '""')}"`)
    .join(",");
  return `${header}\n${example}\n`;
}
