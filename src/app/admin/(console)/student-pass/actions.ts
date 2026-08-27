"use server";

import { revalidatePath } from "next/cache";
import { getAdminAccess } from "@/lib/admin/access";
import {
  activateStudentPass,
  cancelStudentPass,
  deactivateStudentPass,
} from "@/lib/admin/student-pass/mutations";
import type { StudentPassMutationResult } from "@/lib/admin/student-pass/mutations";
import { createServerSupabaseClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const access = await getAdminAccess();
  if (access.status !== "ok") {
    return { error: "Access denied." as const, client: null };
  }
  const client = await createServerSupabaseClient();
  return { error: null, client };
}

function revalidateStudentPass() {
  revalidatePath("/admin/student-pass");
  revalidatePath("/admin");
}

export async function activateStudentPassAction(
  profileId: string,
  source: "manual" | "offline" = "manual",
): Promise<StudentPassMutationResult> {
  const gate = await requireAdmin();
  if (gate.error || !gate.client) {
    return { ok: false, error: gate.error ?? "Access denied." };
  }

  const result = await activateStudentPass({
    client: gate.client,
    profileId,
    source,
    context: "admin",
  });

  if (result.ok) {
    revalidateStudentPass();
  }
  return result;
}

export async function deactivateStudentPassAction(
  profileId: string,
): Promise<StudentPassMutationResult> {
  const gate = await requireAdmin();
  if (gate.error || !gate.client) {
    return { ok: false, error: gate.error ?? "Access denied." };
  }

  const result = await deactivateStudentPass({
    client: gate.client,
    profileId,
    context: "admin",
  });

  if (result.ok) {
    revalidateStudentPass();
  }
  return result;
}

export async function cancelStudentPassAction(
  profileId: string,
): Promise<StudentPassMutationResult> {
  const gate = await requireAdmin();
  if (gate.error || !gate.client) {
    return { ok: false, error: gate.error ?? "Access denied." };
  }

  const result = await cancelStudentPass({
    client: gate.client,
    profileId,
    context: "admin",
  });

  if (result.ok) {
    revalidateStudentPass();
  }
  return result;
}
