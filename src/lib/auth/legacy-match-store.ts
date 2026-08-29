import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { getSupabaseSecretKey } from "@/lib/supabase/env";
import {
  applyLegacyMatchDecision,
  type CertificateMatchRow,
  type LegacyMatchDecision,
  type LegacyMatchStore,
  type LegacyStudentMatchRow,
} from "@/lib/auth/legacy-match";

type CertificateLookupRow = {
  certificate_number: string;
  legacy_student_id: string | null;
  profile_id: string | null;
  legacy_students:
    | {
        id: string;
        email: string | null;
        linked_profile_id: string | null;
      }
    | {
        id: string;
        email: string | null;
        linked_profile_id: string | null;
      }[]
    | null;
};

function unwrapLegacyStudent(
  value: CertificateLookupRow["legacy_students"],
): LegacyStudentMatchRow | null {
  if (!value) return null;
  const row = Array.isArray(value) ? value[0] : value;
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    linked_profile_id: row.linked_profile_id,
  };
}

export function createSupabaseLegacyMatchStore(
  admin: ReturnType<typeof createServiceRoleSupabaseClient>,
): LegacyMatchStore {
  return {
    async findLegacyStudentsByEmail(email) {
      const { data, error } = await admin
        .from("legacy_students")
        .select("id, email, linked_profile_id")
        .eq("email", email);
      if (error || !data) return [];
      return data as LegacyStudentMatchRow[];
    },
    async findCertificateByNumber(certificateNumber) {
      const { data, error } = await admin
        .from("certificates")
        .select(
          "certificate_number, legacy_student_id, profile_id, legacy_students!certificates_legacy_student_id_fkey ( id, email, linked_profile_id )",
        )
        .eq("certificate_number", certificateNumber)
        .maybeSingle();
      if (error || !data) return null;
      const row = data as CertificateLookupRow;
      const result: CertificateMatchRow = {
        certificate_number: row.certificate_number,
        legacy_student_id: row.legacy_student_id,
        profile_id: row.profile_id,
        legacy: unwrapLegacyStudent(row.legacy_students),
      };
      return result;
    },
    async linkLegacyStudent(legacyStudentId, profileId) {
      const { data, error } = await admin
        .from("legacy_students")
        .update({ linked_profile_id: profileId })
        .eq("id", legacyStudentId)
        .is("linked_profile_id", null)
        .select("id");
      if (error) return false;
      return Array.isArray(data) && data.length === 1;
    },
    async updateProfileMatchStatus(profileId, status) {
      await admin
        .from("profiles")
        .update({ legacy_match_status: status })
        .eq("id", profileId);
    },
  };
}

/**
 * Best-effort matching after Auth signup. Never creates Student Pass,
 * enrollments, or certificates. Failures must not block account creation.
 */
export async function applyLegacyMatchAfterSignup(input: {
  profileId: string;
  email: string;
  previouslyStudied: boolean;
  declaredCertificateNumber: string | null;
}): Promise<LegacyMatchDecision> {
  if (!input.previouslyStudied) {
    return { status: "none", legacyStudentId: null };
  }
  if (!getSupabaseSecretKey()) {
    return { status: "pending_review", legacyStudentId: null };
  }

  const admin = createServiceRoleSupabaseClient();
  return applyLegacyMatchDecision(input, createSupabaseLegacyMatchStore(admin));
}
