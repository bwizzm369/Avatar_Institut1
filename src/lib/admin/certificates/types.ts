import type { CertificateStatus, Locale } from "@/types";

/** Lot 3B enables admin issuance. Revoke stays disabled. */
export const CERTIFICATE_ISSUANCE_ENABLED = true;
export const CERTIFICATE_REVOKE_ENABLED = false;

export type CertificateHolderKind = "modern" | "legacy" | "linked";

export type AdminCertificateListItem = {
  id: string;
  certificateNumber: string;
  holderDisplayName: string;
  courseTitleEn: string;
  courseTitleAr: string;
  issuedAt: string;
  status: CertificateStatus;
  oldCertificateNumber: string | null;
  holderKind: CertificateHolderKind;
  profileId: string | null;
  legacyStudentId: string | null;
  enrollmentId: string | null;
  legacyCompletionId: string | null;
  courseId: string | null;
  language: Locale | null;
};

export type AdminCertificateStats = {
  total: number;
  issued: number;
  revoked: number;
};

export type AdminCertificateHolder = {
  key: string;
  kind: "modern" | "legacy";
  name: string;
  email: string | null;
  profileId: string | null;
  legacyStudentId: string | null;
  linkedProfileId: string | null;
};

export type AdminCertificateCourseItem = {
  key: string;
  source: "enrollment" | "completion";
  courseId: string | null;
  courseTitleEn: string;
  courseTitleAr: string;
  statusLabel: string;
  oldCertificateNumber: string | null;
  language: Locale | null;
  existingCertificateNumber: string | null;
};

export type AdminIssuancePreview = {
  holderName: string;
  holderKind: "modern" | "legacy";
  courseTitleEn: string;
  courseTitleAr: string;
  proposedIssuedAt: string;
  oldCertificateNumber: string | null;
  language: Locale | null;
  holderDisplayName: string;
  existingCertificateNumber: string | null;
  alreadyExists: boolean;
  issuanceEnabled: boolean;
};

export type IssuedCertificateNotice = {
  certificateNumber: string;
  holderDisplayName: string;
  courseTitleEn: string;
  courseTitleAr: string;
  issuedAt: string;
  status: "issued";
};

export type CertificateDuplicateLookup =
  | { kind: "legacy_completion"; legacyCompletionId: string }
  | { kind: "profile_course"; profileId: string; courseId: string }
  | { kind: "legacy_student_course"; legacyStudentId: string; courseId: string };
