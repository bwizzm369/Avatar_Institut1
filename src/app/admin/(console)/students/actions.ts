"use server";

import { revalidatePath } from "next/cache";
import { getAdminAccess } from "@/lib/admin/access";
import {
  activateLegacyStudent,
  isAlreadyRegisteredError,
  type ActivateLegacyStudentResult,
} from "@/lib/admin/students/activate";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { getSupabaseSecretKey, isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const access = await getAdminAccess();
  if (access.status !== "ok") {
    return { error: "Access denied." as const };
  }
  return { error: null };
}

/**
 * Admin-only: create/link a confirmed Supabase Auth user for a legacy student.
 * Service role stays on the server. No invite email. No Student Pass / enrollment / certificate.
 */
export async function activateLegacyStudentAction(
  legacyStudentId: string,
): Promise<ActivateLegacyStudentResult> {
  const gate = await requireAdmin();
  if (gate.error) {
    return { ok: false, error: gate.error };
  }

  if (!isSupabaseConfigured() || !getSupabaseSecretKey()) {
    return {
      ok: false,
      error: "Server Auth configuration is incomplete.",
    };
  }

  const adminDb = await createServerSupabaseClient();
  const service = createServiceRoleSupabaseClient();

  const result = await activateLegacyStudent(
    {
      loadLegacyStudent: async (id) => {
        const { data } = await adminDb
          .from("legacy_students")
          .select("id, full_name, email, linked_profile_id")
          .eq("id", id)
          .maybeSingle();
        return data;
      },
      findProfileIdByEmail: async (email) => {
        const { data } = await adminDb
          .from("profiles")
          .select("id")
          .eq("email", email)
          .maybeSingle();
        return data?.id ?? null;
      },
      linkLegacyStudent: async (id, profileId) => {
        const { error } = await adminDb
          .from("legacy_students")
          .update({ linked_profile_id: profileId })
          .eq("id", id);
        if (error) {
          return { ok: false, error: error.message };
        }
        return { ok: true };
      },
      createConfirmedUser: async ({
        email,
        password,
        firstName,
        lastName,
      }) => {
        const { data, error } = await service.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            first_name: firstName,
            last_name: lastName,
            locale: "en",
          },
        });
        if (error) {
          if (isAlreadyRegisteredError(error.message)) {
            return { ok: false, alreadyExists: true };
          }
          return { ok: false, error: error.message };
        }
        const userId = data.user?.id;
        if (!userId) {
          return {
            ok: false,
            error: "User creation succeeded but no user id was returned.",
          };
        }
        return { ok: true, userId };
      },
    },
    legacyStudentId,
  );

  if (result.ok) {
    revalidatePath("/admin/students");
    revalidatePath("/admin");
  }

  return result;
}
