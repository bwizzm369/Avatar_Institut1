import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { isAdminRole, type ProfileRole } from "@/lib/admin/guards";
import type { ProfileRow } from "@/types/database";

export type AdminProfile = Pick<
  ProfileRow,
  "id" | "email" | "first_name" | "last_name" | "role"
>;

export type AdminAccessResult =
  | { status: "unconfigured" }
  | { status: "unauthenticated" }
  | { status: "forbidden"; profile: AdminProfile | null }
  | { status: "ok"; profile: AdminProfile; userId: string };

/**
 * Server-only admin gate: session + profiles.role === 'admin'.
 * Never trust a client-supplied role claim.
 */
export async function getAdminAccess(): Promise<AdminAccessResult> {
  if (!isSupabaseConfigured()) {
    return { status: "unconfigured" };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "unauthenticated" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, first_name, last_name, role")
    .eq("id", user.id)
    .maybeSingle();

  const row = profile as AdminProfile | null;

  if (!row || !isAdminRole(row.role as ProfileRole)) {
    return { status: "forbidden", profile: row };
  }

  return {
    status: "ok",
    profile: row,
    userId: user.id,
  };
}
