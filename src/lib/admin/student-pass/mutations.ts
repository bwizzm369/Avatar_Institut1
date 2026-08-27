import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  assertCanMutateStudentPass,
  isStudentPassManualSource,
  type StudentPassManualSource,
  type StudentPassMutationContext,
} from "@/lib/admin/student-pass/types";

export type StudentPassMutationResult =
  | { ok: true; profileId: string; status: string }
  | { ok: false; error: string };

type AdminClient = SupabaseClient<Database>;

async function loadSubscription(
  client: AdminClient,
  profileId: string,
) {
  const { data, error } = await client
    .from("student_pass_subscriptions")
    .select("id, profile_id, status, started_at, expires_at, cancelled_at, source")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (error) {
    return { row: null, error: error.message };
  }
  return { row: data, error: null };
}

/**
 * Activate (or re-activate) a Student Pass for a profile.
 * Manual activation uses source = manual | offline.
 */
export async function activateStudentPass(options: {
  client: AdminClient;
  profileId: string;
  source?: StudentPassManualSource | string | null;
  context?: StudentPassMutationContext;
  now?: Date;
}): Promise<StudentPassMutationResult> {
  assertCanMutateStudentPass(options.context ?? "admin");

  const profileId = options.profileId?.trim();
  if (!profileId) {
    return { ok: false, error: "Missing profile id." };
  }

  const sourceRaw = options.source ?? "manual";
  if (!isStudentPassManualSource(sourceRaw)) {
    return {
      ok: false,
      error: "Activation source must be manual or offline.",
    };
  }

  const now = options.now ?? new Date();
  const nowIso = now.toISOString();
  const { row, error: loadError } = await loadSubscription(
    options.client,
    profileId,
  );
  if (loadError) {
    return { ok: false, error: loadError };
  }

  if (row) {
    const { error } = await options.client
      .from("student_pass_subscriptions")
      .update({
        status: "active",
        started_at: row.status === "active" ? row.started_at : nowIso,
        cancelled_at: null,
        expires_at: null,
        source: sourceRaw,
      })
      .eq("id", row.id);

    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true, profileId, status: "active" };
  }

  const { error } = await options.client
    .from("student_pass_subscriptions")
    .insert({
      profile_id: profileId,
      status: "active",
      started_at: nowIso,
      expires_at: null,
      cancelled_at: null,
      source: sourceRaw,
    });

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true, profileId, status: "active" };
}

/**
 * Deactivate a Student Pass (status = inactive). Does not set cancelled_at.
 */
export async function deactivateStudentPass(options: {
  client: AdminClient;
  profileId: string;
  context?: StudentPassMutationContext;
}): Promise<StudentPassMutationResult> {
  assertCanMutateStudentPass(options.context ?? "admin");

  const profileId = options.profileId?.trim();
  if (!profileId) {
    return { ok: false, error: "Missing profile id." };
  }

  const { row, error: loadError } = await loadSubscription(
    options.client,
    profileId,
  );
  if (loadError) {
    return { ok: false, error: loadError };
  }
  if (!row) {
    return { ok: false, error: "No Student Pass subscription for this student." };
  }

  const { error } = await options.client
    .from("student_pass_subscriptions")
    .update({
      status: "inactive",
    })
    .eq("id", row.id);

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true, profileId, status: "inactive" };
}

/**
 * Cancel a Student Pass (status = cancelled, cancelled_at set).
 */
export async function cancelStudentPass(options: {
  client: AdminClient;
  profileId: string;
  context?: StudentPassMutationContext;
  now?: Date;
}): Promise<StudentPassMutationResult> {
  assertCanMutateStudentPass(options.context ?? "admin");

  const profileId = options.profileId?.trim();
  if (!profileId) {
    return { ok: false, error: "Missing profile id." };
  }

  const now = options.now ?? new Date();
  const { row, error: loadError } = await loadSubscription(
    options.client,
    profileId,
  );
  if (loadError) {
    return { ok: false, error: loadError };
  }
  if (!row) {
    return { ok: false, error: "No Student Pass subscription for this student." };
  }

  const { error } = await options.client
    .from("student_pass_subscriptions")
    .update({
      status: "cancelled",
      cancelled_at: now.toISOString(),
    })
    .eq("id", row.id);

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true, profileId, status: "cancelled" };
}
