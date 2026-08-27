export const IMPORT_COLUMNS = [
  "student_name",
  "student_email",
  "student_phone",
  "course_title",
  "completed_at",
  "old_certificate_number",
  "certificate_language",
  "notes",
] as const;

export type ImportColumn = (typeof IMPORT_COLUMNS)[number];

/** Friendly / alternate headers accepted in Excel/CSV → canonical column. */
export const IMPORT_HEADER_ALIASES: Record<string, ImportColumn> = {
  student_name: "student_name",
  full_name: "student_name",
  name: "student_name",
  student_email: "student_email",
  email: "student_email",
  student_phone: "student_phone",
  phone: "student_phone",
  course_title: "course_title",
  course: "course_title",
  completed_at: "completed_at",
  completion_date: "completed_at",
  old_certificate_number: "old_certificate_number",
  certificate_number: "old_certificate_number",
  certificate_language: "certificate_language",
  notes: "notes",
};

/** Only the student name is required to import a student row. */
export const REQUIRED_IMPORT_COLUMNS = ["student_name"] as const;

export const MAX_IMPORT_ROWS = 1000;
export const MAX_IMPORT_BYTES = 2 * 1024 * 1024; // 2 MiB

/**
 * READY — new valid student, or existing student with a new historical completion
 * EXISTING — same email already in DB or earlier in this file, and no new completion (skip)
 * INVALID — validation error (skip on commit)
 * WARNING — valid student + unmatched optional course (importable with mode)
 * DUPLICATE — completion fingerprint already present (skip; shown as Existing)
 */
export type ImportRowStatus =
  | "READY"
  | "EXISTING"
  | "INVALID"
  | "WARNING"
  | "DUPLICATE";

export type RawImportRow = Record<string, string>;

export type NormalizedImportFields = {
  studentName: string;
  studentEmail: string | null;
  studentPhone: string | null;
  courseTitle: string;
  completedAt: string; // YYYY-MM-DD
  oldCertificateNumber: string | null;
  certificateLanguage: "en" | "ar" | null;
  notes: string | null;
};

export type CourseMatch = {
  id: string;
  titleEn: string;
  titleAr: string;
};

export type PreviewRow = {
  rowNumber: number;
  studentName: string;
  studentEmail: string | null;
  studentPhone: string | null;
  courseTitle: string;
  completedAt: string | null;
  oldCertificateNumber: string | null;
  certificateLanguage: "en" | "ar" | null;
  notes: string | null;
  matchedCourseId: string | null;
  matchedCourseTitle: string | null;
  status: ImportRowStatus;
  messages: string[];
  importFingerprint: string | null;
  /** True when row has optional course + completion data. */
  hasCompletion: boolean;
};

export type PreviewReport = {
  ok: boolean;
  fileName: string;
  totalRows: number;
  readyCount: number;
  warningCount: number;
  errorCount: number;
  /** Existing + completion duplicates (display as Existing). */
  duplicateCount: number;
  existingCount: number;
  invalidCount: number;
  rows: PreviewRow[];
  parseErrors: string[];
};

export type ConfirmImportMode = "ready_only" | "ready_and_warnings";

export type ImportCommitResult = {
  ok: boolean;
  error?: string;
  rowsProcessed: number;
  studentsCreated: number;
  existingStudentsMatched: number;
  courseCompletionsCreated: number;
  duplicatesSkipped: number;
  warningsImported: number;
  errorsSkipped: number;
  /** Summary aliases for the Students import UI. */
  imported: number;
  existing: number;
  invalid: number;
  errorRows: Array<{
    rowNumber: number;
    studentName: string;
    courseTitle: string;
    messages: string[];
  }>;
};
