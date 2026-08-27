import {
  isValidCertificateNumber,
  normalizeCertificateNumberInput,
} from "@/lib/certificates/number";
import {
  notFoundVerifyView,
  viewFromVerifyRpcRows,
  type CertificateVerifyView,
} from "@/lib/certificates/verify";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Public certificate lookup via verify_certificate RPC only.
 * Never selects from certificates / profiles / legacy_students / enrollments.
 */
export async function lookupPublicCertificate(
  rawNumber: string,
): Promise<CertificateVerifyView> {
  const normalized = normalizeCertificateNumberInput(rawNumber);
  if (!isValidCertificateNumber(normalized)) {
    return notFoundVerifyView();
  }

  if (!isSupabaseConfigured()) {
    return notFoundVerifyView();
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.rpc("verify_certificate", {
      p_number: normalized,
    });
    if (error) {
      return notFoundVerifyView();
    }
    return viewFromVerifyRpcRows(data);
  } catch {
    return notFoundVerifyView();
  }
}
