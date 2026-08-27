import type { CertificateStatus, Locale } from "@/types";

export type StudentCertificateListItem = {
  certificateNumber: string;
  courseTitleEn: string;
  courseTitleAr: string;
  issuedAt: string;
  language: Locale | null;
  status: CertificateStatus;
};

export type StudentCertificatesState =
  | { kind: "unconfigured" }
  | { kind: "unauthenticated" }
  | {
      kind: "ok";
      certificates: StudentCertificateListItem[];
      officialPdfAvailable: boolean;
    };

export type StudentCertificateOwnershipRow = {
  profileId: string | null;
  legacyStudentId: string | null;
};

/**
 * Mirrors SQL public.certificate_is_own:
 * modern profile_id = auth.uid(), or legacy_student linked via linked_profile_id.
 */
export function studentOwnsCertificate(
  userId: string,
  row: StudentCertificateOwnershipRow,
  linkedLegacyIds: readonly string[] = [],
): boolean {
  if (row.profileId === userId) return true;
  if (row.legacyStudentId && linkedLegacyIds.includes(row.legacyStudentId)) {
    return true;
  }
  return false;
}

export function toStudentCertificateListItem(row: {
  certificateNumber: string;
  courseTitleEn: string;
  courseTitleAr: string;
  issuedAt: string;
  language: Locale | null;
  status: CertificateStatus;
}): StudentCertificateListItem {
  return {
    certificateNumber: row.certificateNumber,
    courseTitleEn: row.courseTitleEn,
    courseTitleAr: row.courseTitleAr,
    issuedAt: row.issuedAt,
    language: row.language,
    status: row.status,
  };
}

export function studentCertificatePdfPath(officialNumber: string): string {
  return `/api/dashboard/certificates/${encodeURIComponent(officialNumber)}/pdf`;
}

export function studentCertificateVerifyPath(officialNumber: string): string {
  return `/verify/${encodeURIComponent(officialNumber)}`;
}
