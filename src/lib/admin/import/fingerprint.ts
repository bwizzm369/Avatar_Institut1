import { createHash } from "node:crypto";
import {
  normalizeCourseTitle,
  normalizeEmail,
  normalizeName,
} from "@/lib/admin/import/normalize";

/**
 * Stable idempotency key for a historical completion row.
 * Does not use name alone as identity — email participates when present.
 */
export function buildImportFingerprint(input: {
  studentName: string;
  studentEmail: string | null;
  courseTitle: string;
  completedAt: string;
  oldCertificateNumber: string | null;
}): string {
  const payload = [
    normalizeEmail(input.studentEmail) ?? "",
    normalizeName(input.studentName).toLowerCase(),
    normalizeCourseTitle(input.courseTitle),
    input.completedAt,
    (input.oldCertificateNumber ?? "").trim().toLowerCase(),
  ].join("|");

  return createHash("sha256").update(payload).digest("hex");
}
