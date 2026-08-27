import * as XLSX from "xlsx";
import {
  IMPORT_COLUMNS,
  IMPORT_HEADER_ALIASES,
  MAX_IMPORT_BYTES,
  MAX_IMPORT_ROWS,
  REQUIRED_IMPORT_COLUMNS,
  type ImportColumn,
  type RawImportRow,
} from "@/lib/admin/import/types";
import { normalizeWhitespace } from "@/lib/admin/import/normalize";

export type ParseFileResult =
  | {
      ok: true;
      fileName: string;
      rows: RawImportRow[];
      headers: string[];
    }
  | {
      ok: false;
      fileName: string;
      errors: string[];
    };

function cellToString(value: unknown): string {
  if (value == null) return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return String(value);
}

function normalizeHeader(header: string): string {
  return normalizeWhitespace(header)
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function resolveCanonicalColumn(header: string): ImportColumn | null {
  const normalized = normalizeHeader(header);
  return IMPORT_HEADER_ALIASES[normalized] ?? null;
}

function mapHeaders(rawHeaders: string[]): {
  mapping: Partial<Record<ImportColumn, number>>;
  missingRequired: string[];
  recognized: string[];
} {
  const mapping: Partial<Record<ImportColumn, number>> = {};
  const recognized: string[] = [];

  rawHeaders.forEach((header, index) => {
    const match = resolveCanonicalColumn(header);
    if (match && mapping[match] === undefined) {
      mapping[match] = index;
      recognized.push(match);
    }
  });

  const missingRequired = REQUIRED_IMPORT_COLUMNS.filter(
    (col) => mapping[col] === undefined,
  );

  return { mapping, missingRequired: [...missingRequired], recognized };
}

function isRowEmpty(values: string[]): boolean {
  return values.every((v) => normalizeWhitespace(v) === "");
}

function isSupportedImportFile(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return (
    lower.endsWith(".csv") ||
    lower.endsWith(".xlsx") ||
    lower.endsWith(".xls")
  );
}

export function parseImportBuffer(
  buffer: ArrayBuffer | Buffer,
  fileName: string,
): ParseFileResult {
  const bytes =
    buffer instanceof Buffer ? buffer : Buffer.from(new Uint8Array(buffer));

  if (bytes.byteLength === 0) {
    return { ok: false, fileName, errors: ["File is empty."] };
  }

  if (bytes.byteLength > MAX_IMPORT_BYTES) {
    return {
      ok: false,
      fileName,
      errors: [`File exceeds the maximum size of ${MAX_IMPORT_BYTES} bytes.`],
    };
  }

  if (!isSupportedImportFile(fileName)) {
    return {
      ok: false,
      fileName,
      errors: ["Invalid file type. Upload a .csv, .xlsx, or .xls file."],
    };
  }

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(bytes, {
      type: "buffer",
      cellDates: true,
      raw: false,
    });
  } catch {
    return {
      ok: false,
      fileName,
      errors: ["Unable to read the file. Ensure it is a valid CSV or Excel file."],
    };
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { ok: false, fileName, errors: ["Workbook has no sheets."] };
  }

  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<(string | number | Date | null)[]>(
    sheet,
    {
      header: 1,
      defval: "",
      raw: false,
      blankrows: false,
    },
  );

  if (matrix.length === 0) {
    return { ok: false, fileName, errors: ["File has no header row."] };
  }

  const headerCells = (matrix[0] ?? []).map((cell) => cellToString(cell));
  const { mapping, missingRequired, recognized } = mapHeaders(headerCells);

  if (missingRequired.length > 0) {
    return {
      ok: false,
      fileName,
      errors: [
        `Missing required columns: ${missingRequired.join(", ")} (or alias full_name).`,
        `Recognized columns: ${recognized.length > 0 ? recognized.join(", ") : "(none)"}.`,
      ],
    };
  }

  const dataRows = matrix.slice(1);
  if (dataRows.length > MAX_IMPORT_ROWS) {
    return {
      ok: false,
      fileName,
      errors: [`File has more than ${MAX_IMPORT_ROWS} data rows.`],
    };
  }

  const rows: RawImportRow[] = [];
  for (const cells of dataRows) {
    const values = (cells ?? []).map((cell) => cellToString(cell));
    if (isRowEmpty(values)) continue;

    const row: RawImportRow = {};
    for (const column of IMPORT_COLUMNS) {
      const index = mapping[column];
      row[column] = index === undefined ? "" : (values[index] ?? "");
    }
    rows.push(row);
  }

  if (rows.length === 0) {
    return { ok: false, fileName, errors: ["File has no data rows."] };
  }

  return {
    ok: true,
    fileName,
    rows,
    headers: recognized,
  };
}

/** Preferred template headers for Students import (aliases supported on upload). */
export const STUDENT_IMPORT_TEMPLATE_HEADERS = [
  "full_name",
  "email",
  "phone",
  "notes",
  "course",
  "certificate_number",
  "completion_date",
] as const;

/** Build an in-memory Excel template with headers + one fictional example row. */
export function buildImportTemplateWorkbook(): Buffer {
  const example = {
    full_name: "Example Student (FICTIONAL)",
    email: "example.student@avatar-institute.test",
    phone: "+49 000 000000",
    notes: "Fictional template row — replace with real data",
    course: "",
    certificate_number: "",
    completion_date: "",
  };

  const sheet = XLSX.utils.json_to_sheet([example], {
    header: [...STUDENT_IMPORT_TEMPLATE_HEADERS],
  });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Import");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

export function buildImportTemplateCsv(): string {
  const header = STUDENT_IMPORT_TEMPLATE_HEADERS.join(",");
  const example = [
    "Example Student (FICTIONAL)",
    "example.student@avatar-institute.test",
    "+49 000 000000",
    "Fictional template row — replace with real data",
    "",
    "",
    "",
  ]
    .map((value) => `"${value.replace(/"/g, '""')}"`)
    .join(",");
  return `${header}\n${example}\n`;
}
