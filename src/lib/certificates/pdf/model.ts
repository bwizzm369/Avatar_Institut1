import { DEFAULT_LOCALE, getDirection, isLocale } from "@/lib/i18n";
import {
  courseTitleForLocale,
  formatIssuedAtForLocale,
} from "@/lib/certificates/verify";
import { certificatePdfCopy, type CertificatePdfCopy } from "@/lib/certificates/pdf/copy";
import type { CertificateStatus, Locale } from "@/types";

export const CERTIFICATE_PDF_SELECT_COLUMNS =
  "certificate_number, holder_display_name, course_title_ar, course_title_en, issued_at, language, status";

export type CertificatePdfRecord = {
  certificateNumber: string;
  holderDisplayName: string;
  courseTitleAr: string;
  courseTitleEn: string;
  issuedAt: string;
  language: Locale | null;
  status: CertificateStatus;
};

export type CertificatePdfModel = {
  locale: Locale;
  direction: "ltr" | "rtl";
  officialNumber: string;
  holderDisplayName: string;
  courseTitle: string;
  issuedAtLabel: string;
  issuedAtRaw: string;
  status: CertificateStatus;
  revoked: boolean;
  copy: CertificatePdfCopy;
};

/**
 * language = null → English (LTR). Documented default; never invents a locale.
 * Course title uses the certificate language, then the other language. No invented translation.
 */
export function resolveCertificatePdfLocale(
  language: string | null | undefined,
): Locale {
  return language && isLocale(language) ? language : DEFAULT_LOCALE;
}

export function buildCertificatePdfModel(
  record: CertificatePdfRecord,
): CertificatePdfModel {
  const locale = resolveCertificatePdfLocale(record.language);
  const copy = certificatePdfCopy(locale);
  return {
    locale,
    direction: getDirection(locale),
    officialNumber: record.certificateNumber,
    holderDisplayName: record.holderDisplayName.trim(),
    courseTitle: courseTitleForLocale(
      {
        courseTitleEn: record.courseTitleEn,
        courseTitleAr: record.courseTitleAr,
      },
      locale,
    ),
    issuedAtLabel: formatIssuedAtForLocale(record.issuedAt, locale),
    issuedAtRaw: record.issuedAt,
    status: record.status,
    revoked: record.status === "revoked",
    copy,
  };
}

export function certificatePdfFilename(officialNumber: string): string {
  return `Avatar-Institut-${officialNumber}.pdf`;
}

export function certificatePdfPreviewFilename(officialNumber: string): string {
  return `${officialNumber}.preview.pdf`;
}

export function certificatePdfDownloadPath(officialNumber: string): string {
  return `/api/admin/certificates/${encodeURIComponent(officialNumber)}/pdf`;
}

export function certificatePdfPreviewPath(officialNumber: string): string {
  return `/api/admin/certificates/${encodeURIComponent(officialNumber)}/pdf-preview`;
}

export const PRIVATE_PDF_KEYS = [
  "email",
  "phone",
  "notes",
  "profileId",
  "legacyStudentId",
  "enrollmentId",
  "legacyCompletionId",
  "courseId",
  "issuedBy",
  "revokedReason",
] as const;

export function pdfModelHasPrivateFields(model: object): boolean {
  const json = JSON.stringify(model);
  return PRIVATE_PDF_KEYS.some((key) =>
    new RegExp(`"${key}"`, "i").test(json),
  );
}
