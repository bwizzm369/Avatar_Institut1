import { buildImportFingerprint } from "@/lib/admin/import/fingerprint";
import {
  isValidEmailFormat,
  normalizeCertificateLanguage,
  normalizeCourseTitle,
  normalizeEmail,
  normalizeName,
  normalizeWhitespace,
  parseImportDate,
} from "@/lib/admin/import/normalize";
import type {
  CourseMatch,
  PreviewReport,
  PreviewRow,
  RawImportRow,
} from "@/lib/admin/import/types";

export function matchCourseByTitle(
  courseTitle: string,
  courses: CourseMatch[],
): CourseMatch | null {
  const target = normalizeCourseTitle(courseTitle);
  if (!target) return null;

  for (const course of courses) {
    if (normalizeCourseTitle(course.titleEn) === target) return course;
    if (normalizeCourseTitle(course.titleAr) === target) return course;
  }
  return null;
}

function validateSingleRow(
  raw: RawImportRow,
  rowNumber: number,
  courses: CourseMatch[],
  seenFingerprints: Map<string, number>,
  existingFingerprints: Set<string>,
  seenEmails: Map<string, number>,
  existingEmails: Set<string>,
): PreviewRow {
  const messages: string[] = [];
  let status: PreviewRow["status"] = "READY";

  const studentName = normalizeName(raw.student_name ?? "");
  const studentEmail = normalizeEmail(raw.student_email);
  const studentPhone = (() => {
    const phone = normalizeWhitespace(raw.student_phone ?? "");
    return phone.length > 0 ? phone : null;
  })();
  const courseTitle = normalizeName(raw.course_title ?? "");
  const completedRaw = raw.completed_at ?? "";
  const completedAt = parseImportDate(completedRaw);
  const oldCertificateNumber = (() => {
    const value = normalizeWhitespace(raw.old_certificate_number ?? "");
    return value.length > 0 ? value : null;
  })();
  const languageResult = normalizeCertificateLanguage(raw.certificate_language);
  const notes = (() => {
    const value = normalizeWhitespace(raw.notes ?? "");
    return value.length > 0 ? value : null;
  })();

  const hasCourse = courseTitle.length > 0;
  const hasCompletedRaw = normalizeWhitespace(completedRaw).length > 0;
  const hasCompletion = hasCourse && Boolean(completedAt);

  if (!studentName) {
    status = "INVALID";
    messages.push("Missing full_name / student_name.");
  }

  if (hasCourse !== hasCompletedRaw) {
    status = "INVALID";
    messages.push(
      "course and completion_date must both be provided together, or both left empty.",
    );
  } else if (hasCompletedRaw && !completedAt) {
    status = "INVALID";
    messages.push("Invalid completion_date / completed_at.");
  }

  if (studentEmail && !isValidEmailFormat(studentEmail)) {
    status = "INVALID";
    messages.push("Invalid email.");
  }

  if (languageResult === "invalid") {
    status = "INVALID";
    messages.push("Invalid certificate_language (use en or ar).");
  }

  const certificateLanguage =
    languageResult === "invalid" ? null : languageResult;

  let matchedCourseId: string | null = null;
  let matchedCourseTitle: string | null = null;

  if (hasCourse && status !== "INVALID") {
    const matched = matchCourseByTitle(courseTitle, courses);
    if (matched) {
      matchedCourseId = matched.id;
      matchedCourseTitle = matched.titleEn;
    } else {
      if (status === "READY") status = "WARNING";
      messages.push("COURSE NOT FOUND — no exact match for course.");
    }
  }

  const priorEmailRow = studentEmail
    ? seenEmails.get(studentEmail)
    : undefined;
  const emailSeenInFile = priorEmailRow !== undefined;
  const emailInDatabase = Boolean(
    studentEmail && existingEmails.has(studentEmail),
  );

  if (studentEmail && status !== "INVALID" && !emailSeenInFile) {
    seenEmails.set(studentEmail, rowNumber);
  }

  const emailAlreadyKnown = emailSeenInFile || emailInDatabase;

  let importFingerprint: string | null = null;
  if (studentName && hasCompletion && completedAt && status !== "INVALID") {
    importFingerprint = buildImportFingerprint({
      studentName,
      studentEmail,
      courseTitle,
      completedAt,
      oldCertificateNumber,
    });

    const priorInFile = seenFingerprints.get(importFingerprint);
    if (priorInFile !== undefined) {
      status = "DUPLICATE";
      messages.push(`Duplicate of row ${priorInFile} in this file.`);
    } else {
      seenFingerprints.set(importFingerprint, rowNumber);
      if (existingFingerprints.has(importFingerprint)) {
        status = "DUPLICATE";
        messages.push("Duplicate of an existing record in the database.");
      }
    }
  }

  if (emailAlreadyKnown && status !== "INVALID" && status !== "DUPLICATE") {
    if (!hasCompletion) {
      status = "EXISTING";
      messages.push(
        emailInDatabase
          ? "Existing student (email already in legacy_students)."
          : `Existing student (duplicate email of row ${priorEmailRow}).`,
      );
    } else {
      messages.push(
        emailInDatabase
          ? "Existing student will be reused; new historical completion will be attached."
          : `Existing student from row ${priorEmailRow} will be reused; new historical completion will be attached.`,
      );
    }
  }

  return {
    rowNumber,
    studentName: studentName || "(missing)",
    studentEmail,
    studentPhone,
    courseTitle: courseTitle || "",
    completedAt: hasCompletion ? completedAt : null,
    oldCertificateNumber,
    certificateLanguage,
    notes,
    matchedCourseId,
    matchedCourseTitle,
    status,
    messages,
    importFingerprint,
    hasCompletion,
  };
}

/**
 * Pure preview builder. Performs no database writes.
 * Callers may pass existingFingerprints / existingEmails from read-only SELECTs.
 */
export function buildPreviewReport(options: {
  fileName: string;
  rows: RawImportRow[];
  courses: CourseMatch[];
  existingFingerprints?: Set<string>;
  existingEmails?: Set<string>;
  parseErrors?: string[];
}): PreviewReport {
  const existingFingerprints = options.existingFingerprints ?? new Set<string>();
  const existingEmails = options.existingEmails ?? new Set<string>();
  const seenFingerprints = new Map<string, number>();
  const seenEmails = new Map<string, number>();
  const previewRows: PreviewRow[] = [];

  options.rows.forEach((raw, index) => {
    previewRows.push(
      validateSingleRow(
        raw,
        index + 2, // header is row 1
        options.courses,
        seenFingerprints,
        existingFingerprints,
        seenEmails,
        existingEmails,
      ),
    );
  });

  const readyCount = previewRows.filter((r) => r.status === "READY").length;
  const warningCount = previewRows.filter((r) => r.status === "WARNING").length;
  const errorCount = previewRows.filter((r) => r.status === "INVALID").length;
  const existingCount = previewRows.filter((r) => r.status === "EXISTING").length;
  const duplicateCount =
    existingCount +
    previewRows.filter((r) => r.status === "DUPLICATE").length;
  const parseErrors = options.parseErrors ?? [];

  return {
    ok: parseErrors.length === 0 && errorCount === 0,
    fileName: options.fileName,
    totalRows: previewRows.length,
    readyCount,
    warningCount,
    errorCount,
    duplicateCount,
    existingCount,
    invalidCount: errorCount,
    rows: previewRows,
    parseErrors,
  };
}

/**
 * Re-applies DB email / fingerprint guards just before commit.
 * Existing students keep READY/WARNING when a new completion fingerprint is present.
 */
export function applyConfirmImportGuards(
  rows: PreviewRow[],
  options: {
    existingEmails: Set<string>;
    existingFingerprints: Set<string>;
  },
): PreviewRow[] {
  return rows.map((row) => {
    if (row.status === "INVALID") return row;

    if (
      row.importFingerprint &&
      options.existingFingerprints.has(row.importFingerprint)
    ) {
      return {
        ...row,
        status: "DUPLICATE",
        messages: [
          ...row.messages.filter((message) => !message.includes("Duplicate")),
          "Duplicate of an existing record in the database.",
        ],
      };
    }

    if (row.studentEmail && options.existingEmails.has(row.studentEmail)) {
      if (!row.hasCompletion) {
        return {
          ...row,
          status: "EXISTING",
          messages: [
            ...row.messages.filter(
              (message) => !message.startsWith("Existing student"),
            ),
            "Existing student (email already in legacy_students).",
          ],
        };
      }

      const reuseMessage =
        "Existing student will be reused; new historical completion will be attached.";
      return {
        ...row,
        messages: row.messages.includes(reuseMessage)
          ? row.messages
          : [
              ...row.messages.filter(
                (message) => !message.startsWith("Existing student"),
              ),
              reuseMessage,
            ],
      };
    }

    return row;
  });
}
