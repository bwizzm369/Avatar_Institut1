import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  toStudentMembershipCard,
  type StudentMembershipState,
} from "@/lib/student-pass/membership";

export type { StudentMembershipState } from "@/lib/student-pass/membership";

/**
 * Read-only Student Pass membership for the signed-in student.
 * Students can SELECT their own subscription (RLS); they cannot mutate it.
 */
export async function loadStudentMembershipState(): Promise<StudentMembershipState> {
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, first_name, last_name, created_at")
    .eq("id", user.id)
    .maybeSingle();

  const { data: subscription } = await supabase
    .from("student_pass_subscriptions")
    .select("status, expires_at, started_at")
    .eq("profile_id", user.id)
    .maybeSingle();

  return {
    kind: "ready",
    card: toStudentMembershipCard({
      profileId: profile?.id ?? user.id,
      firstName: profile?.first_name,
      lastName: profile?.last_name,
      email: profile?.email ?? user.email,
      profileCreatedAt: profile?.created_at,
      subscription: subscription ?? null,
    }),
  };
}
