import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { isAdminRole, type ProfileRole } from "@/lib/admin/guards";
import { isAdminEmailVerificationValid } from "@/lib/admin/email-verification/runtime";
import { resolveAdminVerificationSessionId } from "@/lib/admin/email-verification/session";
import type { ProfileRow } from "@/types/database";

export type AdminProfile = Pick<
  ProfileRow,
  "id" | "email" | "first_name" | "last_name" | "role"
>;

type AdminIdentityBase =
  | { status: "unconfigured" }
  | { status: "unauthenticated" }
  | { status: "forbidden"; profile: AdminProfile | null };

export type AdminIdentityResult =
  | AdminIdentityBase
  | {
      status: "ok";
      profile: AdminProfile;
      userId: string;
      sessionId: string;
    };

export type AdminAccessResult =
  | AdminIdentityBase
  | {
      status: "needs_verification";
      profile: AdminProfile;
      userId: string;
      sessionId: string;
    }
  | {
      status: "ok";
      profile: AdminProfile;
      userId: string;
      sessionId: string;
    };

/**
 * Session + profiles.role === 'admin'. Does not check email verification.
 */
export async function getAdminIdentity(): Promise<AdminIdentityResult> {
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

  const { data: sessionData } = await supabase.auth.getSession();
  const sessionId = resolveAdminVerificationSessionId({
    userId: user.id,
    accessToken: sessionData.session?.access_token,
  });

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
    sessionId,
  };
}

/**
 * Server-only admin gate: session + profiles.role === 'admin' +
 * administrative email verification cookie bound to the user and session.
 * Never trust a client-supplied role claim.
 */
export async function getAdminAccess(): Promise<AdminAccessResult> {
  const identity = await getAdminIdentity();
  if (identity.status !== "ok") {
    return identity;
  }

  const verified = await isAdminEmailVerificationValid({
    userId: identity.userId,
    sessionId: identity.sessionId,
  });

  if (!verified) {
    return {
      status: "needs_verification",
      profile: identity.profile,
      userId: identity.userId,
      sessionId: identity.sessionId,
    };
  }

  return identity;
}
