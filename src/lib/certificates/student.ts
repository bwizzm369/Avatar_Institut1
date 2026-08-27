import type { SupabaseClient } from "@supabase/supabase-js";
import {
  isCertificateStatus,
  isValidCertificateNumber,
  normalizeCertificateNumberInput,
} from "@/lib/certificates/number";
import {
  CERTIFICATE_PDF_SELECT_COLUMNS,
  type CertificatePdfRecord,
} from "@/lib/certificates/pdf/model";
import {
  studentOwnsCertificate,
  toStudentCertificateListItem,
  type StudentCertificateListItem,
  type StudentCertificateOwnershipRow,
  type StudentCertificatesState,
} from "@/lib/certificates/student-view";
import { isCertificatePdfDownloadAvailable } from "@/lib/certificates/verification-url";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isLocale } from "@/lib/i18n";
import type { Locale } from "@/types";
import type { Database } from "@/types/database";

export type {
  StudentCertificateListItem,
  StudentCertificateOwnershipRow,
  StudentCertificatesState,
} from "@/lib/certificates/student-view";
export {
  studentCertificatePdfPath,
  studentCertificateVerifyPath,
  studentOwnsCertificate,
  toStudentCertificateListItem,
} from "@/lib/certificates/student-view";

const STUDENT_CERTIFICATE_SELECT =
  `${CERTIFICATE_PDF_SELECT_COLUMNS}, profile_id, legacy_student_id` as const;

function asLocale(value: string | null | undefined): Locale | null {
  return value && isLocale(value) ? value : null;
}

type CertificateOwnershipQueryRow = {
  certificate_number: string;
  holder_display_name: string;
  course_title_ar: string;
  course_title_en: string;
  issued_at: string;
  language: string | null;
  status: string;
  profile_id: string | null;
  legacy_student_id: string | null;
};

function mapQueryRow(row: CertificateOwnershipQueryRow): {
  listItem: StudentCertificateListItem;
  pdfRecord: CertificatePdfRecord;
  ownership: StudentCertificateOwnershipRow;
} | null {
  if (!isCertificateStatus(row.status)) return null;
  const language = asLocale(row.language);
  const listItem = toStudentCertificateListItem({
    certificateNumber: row.certificate_number,
    courseTitleEn: row.course_title_en,
    courseTitleAr: row.course_title_ar,
    issuedAt: row.issued_at,
    language,
    status: row.status,
  });
  return {
    listItem,
    pdfRecord: {
      certificateNumber: row.certificate_number,
      holderDisplayName: row.holder_display_name,
      courseTitleAr: row.course_title_ar,
      courseTitleEn: row.course_title_en,
      issuedAt: row.issued_at,
      language,
      status: row.status,
    },
    ownership: {
      profileId: row.profile_id,
      legacyStudentId: row.legacy_student_id,
    },
  };
}

async function loadLinkedLegacyIds(
  client: SupabaseClient<Database>,
  userId: string,
): Promise<string[]> {
  const { data, error } = await client
    .from("legacy_students")
    .select("id")
    .eq("linked_profile_id", userId);
  if (error || !data) return [];
  return data.map((row) => row.id);
}

async function isAdminProfile(
  client: SupabaseClient<Database>,
  userId: string,
): Promise<boolean> {
  const { data } = await client
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  return data?.role === "admin";
}

export async function loadStudentCertificatesState(): Promise<StudentCertificatesState> {
  if (!isSupabaseConfigured()) {
    return { kind: "unconfigured" };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { kind: "unauthenticated" };
  }

  const admin = await isAdminProfile(supabase, user.id);
  const linkedLegacyIds = admin
    ? await loadLinkedLegacyIds(supabase, user.id)
    : [];

  let query = supabase
    .from("certificates")
    .select(STUDENT_CERTIFICATE_SELECT)
    .order("issued_at", { ascending: false })
    .order("certificate_number", { ascending: false });

  if (admin) {
    query =
      linkedLegacyIds.length > 0
        ? query.or(
            `profile_id.eq.${user.id},legacy_student_id.in.(${linkedLegacyIds.join(",")})`,
          )
        : query.eq("profile_id", user.id);
  }

  const { data, error } = await query;

  if (error || !data) {
    return {
      kind: "ok",
      certificates: [],
      officialPdfAvailable: isCertificatePdfDownloadAvailable(),
    };
  }

  const certificates: StudentCertificateListItem[] = [];
  for (const raw of data as CertificateOwnershipQueryRow[]) {
    const mapped = mapQueryRow(raw);
    if (!mapped) continue;
    if (admin && !studentOwnsCertificate(user.id, mapped.ownership, linkedLegacyIds)) {
      continue;
    }
    certificates.push(mapped.listItem);
  }

  return {
    kind: "ok",
    certificates,
    officialPdfAvailable: isCertificatePdfDownloadAvailable(),
  };
}

export async function loadOwnedStudentCertificatePdfRecord(
  client: SupabaseClient<Database>,
  userId: string,
  rawNumber: string,
): Promise<CertificatePdfRecord | null> {
  const officialNumber = normalizeCertificateNumberInput(rawNumber);
  if (!isValidCertificateNumber(officialNumber)) {
    return null;
  }

  const { data, error } = await client
    .from("certificates")
    .select(STUDENT_CERTIFICATE_SELECT)
    .eq("certificate_number", officialNumber)
    .maybeSingle();

  if (error || !data) return null;
  const mapped = mapQueryRow(data as CertificateOwnershipQueryRow);
  if (!mapped) return null;

  const admin = await isAdminProfile(client, userId);
  const linkedLegacyIds = admin
    ? await loadLinkedLegacyIds(client, userId)
    : [];
  if (studentOwnsCertificate(userId, mapped.ownership, linkedLegacyIds)) {
    return mapped.pdfRecord;
  }

  // Students cannot SELECT legacy_students (admin RLS). A legacy row that
  // already passed certificate_is_own is still the owner's file.
  if (
    !admin &&
    mapped.ownership.profileId === null &&
    mapped.ownership.legacyStudentId
  ) {
    return mapped.pdfRecord;
  }

  return null;
}
