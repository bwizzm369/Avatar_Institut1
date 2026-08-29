import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  validateConsultationStatusUpdate,
} from "@/lib/consultation/validation";
import type { ConsultationStatus } from "@/lib/consultation/types";

type AdminDb = SupabaseClient<Database>;

export type ConsultationMutationResult =
  | { ok: true }
  | { ok: false; error: string };

export async function updateConsultationRequestStatus(options: {
  client: AdminDb;
  id: string;
  status: string;
  adminNotes: string;
}): Promise<ConsultationMutationResult> {
  const parsed = validateConsultationStatusUpdate({
    status: options.status,
    adminNotes: options.adminNotes,
  });
  if (!parsed.ok || !parsed.status) {
    return { ok: false, error: parsed.error ?? "Invalid status." };
  }

  const { error } = await options.client
    .from("consultation_requests")
    .update({
      status: parsed.status,
      admin_notes: parsed.adminNotes,
    })
    .eq("id", options.id);

  if (error) {
    return { ok: false, error: "Unable to update this request." };
  }

  return { ok: true };
}

export async function deleteConsultationRequest(options: {
  client: AdminDb;
  id: string;
}): Promise<ConsultationMutationResult> {
  const { error } = await options.client
    .from("consultation_requests")
    .delete()
    .eq("id", options.id);

  if (error) {
    return { ok: false, error: "Unable to delete this request." };
  }

  return { ok: true };
}

export const CONSULTATION_STATUS_LABELS: Record<ConsultationStatus, string> = {
  new: "New",
  in_review: "In review",
  contacted: "Contacted",
  closed: "Closed",
};
