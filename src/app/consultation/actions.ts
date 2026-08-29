"use server";

import { submitConsultationRequest } from "@/lib/consultation/submit";
import {
  readConsultationFormFields,
  validateConsultationRequest,
} from "@/lib/consultation/validation";

export type ConsultationActionResult =
  | { ok: true }
  | { ok: false; errorKey: string; fieldErrors?: Record<string, string> };

export async function submitConsultationAction(
  formData: FormData,
): Promise<ConsultationActionResult> {
  const parsed = validateConsultationRequest(
    readConsultationFormFields(formData),
  );

  if (parsed.spam) {
    return { ok: true };
  }

  if (!parsed.ok || !parsed.values) {
    return {
      ok: false,
      errorKey: "consultation.validationFailed",
      fieldErrors: parsed.errors,
    };
  }

  const result = await submitConsultationRequest(parsed.values);
  if (!result.ok) {
    return {
      ok: false,
      errorKey:
        result.error === "config"
          ? "consultation.configMissing"
          : "consultation.error",
    };
  }

  return { ok: true };
}
