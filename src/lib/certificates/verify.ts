import type { CertificatePublicVerify, CertificateStatus, Locale } from "@/types";
import { isCertificateStatus } from "@/lib/certificates/number";
import { displayLocalized } from "@/lib/i18n";

export const CERTIFICATE_PUBLIC_VERIFY_FIELDS = [
  "certificateNumber",
  "status",
  "holderDisplayName",
  "courseTitleEn",
  "courseTitleAr",
  "issuedAt",
] as const;

const PRIVATE_VERIFY_KEYS = [
  "email",
  "phone",
  "notes",
  "id",
  "profileId",
  "legacyStudentId",
  "linkedProfileId",
  "enrollmentId",
  "legacyCompletionId",
  "courseId",
  "issuedBy",
  "revokedReason",
  "revokedAt",
  "oldCertificateNumber",
] as const;

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

/**
 * Maps a verify_certificate RPC row (snake_case) or camelCase object
 * to the public verification payload. Extra / private keys are dropped.
 */
export function toPublicCertificateVerify(
  row: Record<string, unknown> | null | undefined,
): CertificatePublicVerify | null {
  if (!row) return null;

  const certificateNumber = asNonEmptyString(
    row.certificate_number ?? row.certificateNumber,
  );
  const statusRaw = asNonEmptyString(row.status);
  const holderDisplayName = asNonEmptyString(
    row.holder_display_name ?? row.holderDisplayName,
  );
  const courseTitleEn =
    typeof (row.course_title_en ?? row.courseTitleEn) === "string"
      ? String(row.course_title_en ?? row.courseTitleEn)
      : null;
  const courseTitleAr =
    typeof (row.course_title_ar ?? row.courseTitleAr) === "string"
      ? String(row.course_title_ar ?? row.courseTitleAr)
      : null;
  const issuedAt = asNonEmptyString(row.issued_at ?? row.issuedAt);

  if (
    !certificateNumber ||
    !statusRaw ||
    !isCertificateStatus(statusRaw) ||
    !holderDisplayName ||
    courseTitleEn === null ||
    courseTitleAr === null ||
    !issuedAt
  ) {
    return null;
  }

  const status: CertificateStatus = statusRaw;
  const publicRow: CertificatePublicVerify = {
    certificateNumber,
    status,
    holderDisplayName,
    courseTitleEn,
    courseTitleAr,
    issuedAt,
  };

  return publicRow;
}

export function publicVerifyHasPrivateFields(
  payload: Record<string, unknown>,
): boolean {
  return PRIVATE_VERIFY_KEYS.some((key) =>
    Object.prototype.hasOwnProperty.call(payload, key),
  );
}

export type CertificateVerifyKind = "issued" | "revoked" | "not_found";

export type CertificateVerifyView = {
  kind: CertificateVerifyKind;
  certificate: CertificatePublicVerify | null;
};

export function notFoundVerifyView(): CertificateVerifyView {
  return { kind: "not_found", certificate: null };
}

/**
 * Maps RPC rows to a public view. Invalid / empty / unmapped rows → not_found.
 * Never keeps private keys.
 */
export function viewFromVerifyRpcRows(rows: unknown): CertificateVerifyView {
  const list = Array.isArray(rows) ? rows : [];
  const first = list[0];
  if (!first || typeof first !== "object") {
    return notFoundVerifyView();
  }
  const mapped = toPublicCertificateVerify(first as Record<string, unknown>);
  if (!mapped) return notFoundVerifyView();
  if (mapped.status === "revoked") {
    return { kind: "revoked", certificate: mapped };
  }
  return { kind: "issued", certificate: mapped };
}

export function courseTitleForLocale(
  certificate: Pick<CertificatePublicVerify, "courseTitleEn" | "courseTitleAr">,
  locale: Locale,
): string {
  return displayLocalized(
    { en: certificate.courseTitleEn, ar: certificate.courseTitleAr },
    locale,
  );
}

export function formatIssuedAtForLocale(
  issuedAt: string,
  locale: Locale,
): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(issuedAt.trim());
  if (!match) return issuedAt;
  const date = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
  );
  return date.toLocaleDateString(locale === "ar" ? "ar" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
