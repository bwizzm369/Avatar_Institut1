"use server";

import { revalidatePath } from "next/cache";
import { getAdminAccess } from "@/lib/admin/access";
import {
  deleteConsultationRequest,
  updateConsultationRequestStatus,
  type ConsultationMutationResult,
} from "@/lib/admin/consultation/mutations";
import { createServerSupabaseClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const access = await getAdminAccess();
  if (access.status !== "ok") {
    return { error: "Access denied." as const, client: null };
  }
  const client = await createServerSupabaseClient();
  return { error: null, client };
}

function revalidateConsultations() {
  revalidatePath("/admin/consultations");
  revalidatePath("/admin");
}

export async function updateConsultationStatusAction(
  id: string,
  status: string,
  adminNotes: string,
): Promise<ConsultationMutationResult> {
  const gate = await requireAdmin();
  if (gate.error || !gate.client) {
    return { ok: false, error: gate.error ?? "Access denied." };
  }

  const result = await updateConsultationRequestStatus({
    client: gate.client,
    id,
    status,
    adminNotes,
  });

  if (result.ok) {
    revalidateConsultations();
  }
  return result;
}

export async function deleteConsultationAction(
  id: string,
): Promise<ConsultationMutationResult> {
  const gate = await requireAdmin();
  if (gate.error || !gate.client) {
    return { ok: false, error: gate.error ?? "Access denied." };
  }

  const result = await deleteConsultationRequest({
    client: gate.client,
    id,
  });

  if (result.ok) {
    revalidateConsultations();
  }
  return result;
}
