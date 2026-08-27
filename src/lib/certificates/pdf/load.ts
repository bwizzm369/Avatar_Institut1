import type { SupabaseClient } from "@supabase/supabase-js";
import {
  isCertificateStatus,
  isValidCertificateNumber,
  normalizeCertificateNumberInput,
} from "@/lib/certificates/number";
import { asLocale } from "@/lib/admin/certificates/query";
import {
  CERTIFICATE_PDF_SELECT_COLUMNS,
  type CertificatePdfRecord,
} from "@/lib/certificates/pdf/model";
import type { Database } from "@/types/database";

export async function loadCertificatePdfRecord(
  client: SupabaseClient<Database>,
  rawNumber: string,
): Promise<CertificatePdfRecord | null> {
  const officialNumber = normalizeCertificateNumberInput(rawNumber);
  if (!isValidCertificateNumber(officialNumber)) {
    return null;
  }

  const { data, error } = await client
    .from("certificates")
    .select(CERTIFICATE_PDF_SELECT_COLUMNS)
    .eq("certificate_number", officialNumber)
    .maybeSingle();

  if (error || !data) return null;
  if (!isCertificateStatus(data.status)) return null;

  return {
    certificateNumber: data.certificate_number,
    holderDisplayName: data.holder_display_name,
    courseTitleAr: data.course_title_ar,
    courseTitleEn: data.course_title_en,
    issuedAt: data.issued_at,
    language: asLocale(data.language),
    status: data.status,
  };
}
