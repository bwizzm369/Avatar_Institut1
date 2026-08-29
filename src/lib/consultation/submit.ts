import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { ConsultationFormValues } from "@/lib/consultation/types";

export type ConsultationSubmitResult =
  | { ok: true }
  | { ok: false; error: "config" | "insert" };

/**
 * Stores a public Consultation/Information request.
 * Status and admin notes are never taken from the browser (DB trigger + defaults).
 */
export async function submitConsultationRequest(
  values: ConsultationFormValues,
): Promise<ConsultationSubmitResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "config" };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("consultation_requests").insert({
    full_name: values.fullName,
    email: values.email,
    phone: values.phone,
    locale: values.locale,
    request_type: values.requestType,
    message: values.message,
    consent_at: values.consentAt,
  });

  if (error) {
    return { ok: false, error: "insert" };
  }

  return { ok: true };
}
