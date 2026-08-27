import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  hasActiveStudentPass,
  type StudentPassSubscriptionFields,
} from "@/lib/admin/student-pass/types";

/**
 * Server-reusable entitlement check for a profile.
 * Prefers the SQL function when available; falls back to a row read + pure helper.
 */
export async function hasActiveStudentPassForProfile(
  profileId: string,
  now: Date = new Date(),
): Promise<boolean> {
  if (!profileId || !isSupabaseConfigured()) {
    return false;
  }

  const supabase = await createServerSupabaseClient();

  const { data: rpcResult, error: rpcError } = await supabase.rpc(
    "has_active_student_pass",
    { p_profile_id: profileId },
  );

  if (!rpcError && typeof rpcResult === "boolean") {
    return rpcResult;
  }

  const { data, error } = await supabase
    .from("student_pass_subscriptions")
    .select("status, expires_at")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (error || !data) {
    return false;
  }

  return hasActiveStudentPass(
    data as StudentPassSubscriptionFields,
    now,
  );
}

export { hasActiveStudentPass };
