import { normalizeWhitespace } from "@/lib/admin/import/normalize";
import {
  isCertificateStatus,
  issuedAtYear,
  normalizeCertificateNumberInput,
} from "@/lib/certificates/number";
import { isLocale } from "@/lib/i18n";
import type { CertificateStatus, Locale } from "@/types";
import {
  CERTIFICATE_ISSUANCE_ENABLED,
  type AdminCertificateCourseItem,
  type AdminCertificateHolder,
  type AdminCertificateListItem,
  type AdminCertificateStats,
  type AdminIssuancePreview,
  type CertificateDuplicateLookup,
  type CertificateHolderKind,
} from "@/lib/admin/certificates/types";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export function parseHolderKey(
  raw: string | null | undefined,
): { kind: "modern" | "legacy"; id: string } | null {
  if (!raw) return null;
  const [kind, id] = raw.split(":");
  if (!id || !isUuid(id)) return null;
  if (kind === "legacy" || kind === "profile") {
    return { kind: kind === "profile" ? "modern" : "legacy", id };
  }
  return null;
}

export function formatHolderKey(kind: "modern" | "legacy", id: string): string {
  return kind === "modern" ? `profile:${id}` : `legacy:${id}`;
}

export function parseItemKey(
  raw: string | null | undefined,
): { source: "enrollment" | "completion"; id: string } | null {
  if (!raw) return null;
  const [source, id] = raw.split(":");
  if (!id || !isUuid(id)) return null;
  if (source === "enrollment" || source === "completion") {
    return { source, id };
  }
  return null;
}

export function formatItemKey(
  source: "enrollment" | "completion",
  id: string,
): string {
  return `${source}:${id}`;
}

export function certificateHolderKind(row: {
  profileId: string | null;
  legacyStudentId: string | null;
}): CertificateHolderKind {
  if (row.profileId && row.legacyStudentId) return "linked";
  if (row.profileId) return "modern";
  return "legacy";
}

export function formatCourseTitle(
  titleEn: string | null | undefined,
  titleAr: string | null | undefined,
): string {
  const en = (titleEn ?? "").trim();
  const ar = (titleAr ?? "").trim();
  if (ar && en && ar !== en) return `${ar} / ${en}`;
  return ar || en || "—";
}

export function asLocale(value: string | null | undefined): Locale | null {
  if (!value) return null;
  return isLocale(value) ? value : null;
}

export function parseIssuedAtDate(
  value: string | null | undefined,
): string | null {
  const raw = normalizeWhitespace(value ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  try {
    const year = issuedAtYear(raw);
    if (year < 2000 || year > 2100) return null;
  } catch {
    return null;
  }
  const utc = new Date(`${raw}T00:00:00.000Z`);
  if (Number.isNaN(utc.getTime()) || utc.toISOString().slice(0, 10) !== raw) {
    return null;
  }
  return raw;
}

export function parseIssueLanguage(
  value: string | null | undefined,
): Locale | null | undefined {
  if (value == null) return null;
  const trimmed = normalizeWhitespace(value);
  if (!trimmed) return null;
  if (!isLocale(trimmed)) return undefined;
  return trimmed;
}

export function canSubmitIssuance(options: {
  issuanceEnabled: boolean;
  alreadyExists: boolean;
  holderSelected: boolean;
  itemSelected: boolean;
  issuedAt: string;
  holderDisplayName: string;
}): boolean {
  if (!options.issuanceEnabled) return false;
  if (options.alreadyExists) return false;
  if (!options.holderSelected || !options.itemSelected) return false;
  if (!options.holderDisplayName.trim()) return false;
  return parseIssuedAtDate(options.issuedAt) !== null;
}

export function summarizeCertificates(
  rows: Array<{ status: CertificateStatus }>,
): AdminCertificateStats {
  let issued = 0;
  let revoked = 0;
  for (const row of rows) {
    if (row.status === "issued") issued += 1;
    if (row.status === "revoked") revoked += 1;
  }
  return { total: rows.length, issued, revoked };
}

export function filterCertificates(
  rows: AdminCertificateListItem[],
  searchQuery: string,
): AdminCertificateListItem[] {
  const query = normalizeWhitespace(searchQuery);
  if (!query) return rows;

  const lowered = query.toLowerCase();
  const normalizedNumber = normalizeCertificateNumberInput(query).toLowerCase();

  return rows.filter((row) => {
    const hay = [
      row.certificateNumber,
      row.oldCertificateNumber ?? "",
      row.holderDisplayName,
      row.courseTitleEn,
      row.courseTitleAr,
      formatCourseTitle(row.courseTitleEn, row.courseTitleAr),
      row.status,
      row.holderKind,
    ]
      .join(" ")
      .toLowerCase();

    return (
      hay.includes(lowered) ||
      row.certificateNumber.toLowerCase() === normalizedNumber ||
      (row.oldCertificateNumber ?? "").toLowerCase().includes(lowered)
    );
  });
}

export function searchIssuanceHolders(
  holders: AdminCertificateHolder[],
  searchQuery: string,
): AdminCertificateHolder[] {
  const query = normalizeHolderSearchQuery(searchQuery);
  if (!query) return [];

  const tokens = query.toLowerCase().split(" ").filter(Boolean);
  return holders.filter((holder) => holderMatchesSearchTokens(holder, tokens));
}

/** Next.js searchParams keep '+' literal; treat it as a space like form encoding. */
export function normalizeHolderSearchQuery(raw: string): string {
  return normalizeWhitespace(raw.replace(/\+/g, " "));
}

export function holderMatchesSearchTokens(
  holder: Pick<AdminCertificateHolder, "name" | "email">,
  tokens: string[],
): boolean {
  if (tokens.length === 0) return false;
  const hay = `${normalizeWhitespace(holder.name)} ${holder.email ?? ""}`.toLowerCase();
  return tokens.every((token) => hay.includes(token));
}

export function findBlockingCertificate<
  T extends {
    certificateNumber: string;
    legacyCompletionId: string | null;
    profileId: string | null;
    legacyStudentId: string | null;
    courseId: string | null;
  },
>(certificates: T[], lookups: CertificateDuplicateLookup[]): T | null {
  for (const lookup of lookups) {
    const match =
      lookup.kind === "legacy_completion"
        ? certificates.find(
            (row) => row.legacyCompletionId === lookup.legacyCompletionId,
          )
        : lookup.kind === "profile_course"
          ? certificates.find(
              (row) =>
                row.profileId === lookup.profileId &&
                row.courseId === lookup.courseId,
            )
          : certificates.find(
              (row) =>
                row.legacyStudentId === lookup.legacyStudentId &&
                row.courseId === lookup.courseId,
            );
    if (match) return match;
  }
  return null;
}

export function duplicateLookupsForEnrollment(options: {
  profileId: string;
  courseId: string;
  linkedLegacyStudentIds: string[];
}): CertificateDuplicateLookup[] {
  const lookups: CertificateDuplicateLookup[] = [
    {
      kind: "profile_course",
      profileId: options.profileId,
      courseId: options.courseId,
    },
  ];
  for (const legacyStudentId of options.linkedLegacyStudentIds) {
    lookups.push({
      kind: "legacy_student_course",
      legacyStudentId,
      courseId: options.courseId,
    });
  }
  return lookups;
}

export function duplicateLookupsForCompletion(options: {
  legacyCompletionId: string;
  legacyStudentId: string;
  courseId: string | null;
  linkedProfileId: string | null;
}): CertificateDuplicateLookup[] {
  const lookups: CertificateDuplicateLookup[] = [
    {
      kind: "legacy_completion",
      legacyCompletionId: options.legacyCompletionId,
    },
  ];
  if (options.courseId) {
    lookups.push({
      kind: "legacy_student_course",
      legacyStudentId: options.legacyStudentId,
      courseId: options.courseId,
    });
    if (options.linkedProfileId) {
      lookups.push({
        kind: "profile_course",
        profileId: options.linkedProfileId,
        courseId: options.courseId,
      });
    }
  }
  return lookups;
}

export function buildIssuancePreview(options: {
  holder: AdminCertificateHolder;
  item: AdminCertificateCourseItem;
  proposedIssuedAt: string;
}): AdminIssuancePreview {
  return {
    holderName: options.holder.name,
    holderKind: options.holder.kind,
    courseTitleEn: options.item.courseTitleEn,
    courseTitleAr: options.item.courseTitleAr,
    proposedIssuedAt: options.proposedIssuedAt,
    oldCertificateNumber: options.item.oldCertificateNumber,
    language: options.item.language,
    holderDisplayName: options.holder.name,
    existingCertificateNumber: options.item.existingCertificateNumber,
    alreadyExists: Boolean(options.item.existingCertificateNumber),
    issuanceEnabled: CERTIFICATE_ISSUANCE_ENABLED,
  };
}

export function mapCertificateRow(row: {
  id: string;
  certificate_number: string;
  status: string;
  issued_at: string;
  course_id: string | null;
  profile_id: string | null;
  legacy_student_id: string | null;
  enrollment_id: string | null;
  legacy_completion_id: string | null;
  old_certificate_number: string | null;
  language: string | null;
  holder_display_name: string;
  course_title_ar: string;
  course_title_en: string;
}): AdminCertificateListItem | null {
  if (!isCertificateStatus(row.status)) return null;
  return {
    id: row.id,
    certificateNumber: row.certificate_number,
    holderDisplayName: row.holder_display_name,
    courseTitleEn: row.course_title_en,
    courseTitleAr: row.course_title_ar,
    issuedAt: row.issued_at,
    status: row.status,
    oldCertificateNumber: row.old_certificate_number,
    holderKind: certificateHolderKind({
      profileId: row.profile_id,
      legacyStudentId: row.legacy_student_id,
    }),
    profileId: row.profile_id,
    legacyStudentId: row.legacy_student_id,
    enrollmentId: row.enrollment_id,
    legacyCompletionId: row.legacy_completion_id,
    courseId: row.course_id,
    language: asLocale(row.language),
  };
}

export function profileDisplayName(profile: {
  first_name: string;
  last_name: string;
  email: string;
}): string {
  const name = [profile.first_name, profile.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  return name || profile.email;
}

/** Public certificate snapshot only. Never email, phone, or UUID. */
export function publicHolderDisplayNameFromProfile(profile: {
  first_name: string | null | undefined;
  last_name: string | null | undefined;
}): string {
  return [profile.first_name, profile.last_name]
    .map((part) => (part ?? "").trim())
    .filter(Boolean)
    .join(" ")
    .trim();
}

export function publicHolderDisplayNameFromLegacy(
  fullName: string | null | undefined,
): string {
  return (fullName ?? "").trim();
}

export function enrollmentStatusLabel(status: string): string {
  switch (status) {
    case "completed":
      return "Enrollment completed";
    case "active":
      return "Enrollment active";
    case "pending_payment":
      return "Enrollment pending payment";
    case "revoked":
      return "Enrollment revoked";
    default:
      return `Enrollment ${status}`;
  }
}

export type CourseTitleLookup = {
  id: string;
  title_en: string;
  title_ar: string;
};

export function courseTitlesFromRegistry(
  courseId: string | null,
  courses: CourseTitleLookup[],
  fallbackOriginal: string | null,
): { courseTitleEn: string; courseTitleAr: string } {
  if (courseId) {
    const course = courses.find((row) => row.id === courseId);
    if (course) {
      return {
        courseTitleEn: course.title_en,
        courseTitleAr: course.title_ar,
      };
    }
  }
  const original = (fallbackOriginal ?? "").trim();
  return {
    courseTitleEn: "",
    courseTitleAr: original,
  };
}
