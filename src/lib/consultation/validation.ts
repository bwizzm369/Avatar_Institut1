import { isLocale } from "@/lib/i18n";
import { isValidEmail, normalizeEmail } from "@/lib/auth/validation";
import {
  CONSULTATION_REQUEST_TYPES,
  CONSULTATION_STATUSES,
  type ConsultationFieldErrors,
  type ConsultationFormInput,
  type ConsultationFormValues,
  type ConsultationRequestType,
  type ConsultationStatus,
} from "@/lib/consultation/types";
import type { Locale } from "@/types";

const MAX_NAME = 120;
const MAX_PHONE = 40;
const MAX_MESSAGE = 4000;
const MAX_ADMIN_NOTES = 4000;
const MIN_MESSAGE = 12;

export function isConsultationRequestType(
  value: string,
): value is ConsultationRequestType {
  return (CONSULTATION_REQUEST_TYPES as readonly string[]).includes(value);
}

export function isConsultationStatus(value: string): value is ConsultationStatus {
  return (CONSULTATION_STATUSES as readonly string[]).includes(value);
}

export function readConsultationFormFields(
  formData: FormData,
): ConsultationFormInput {
  return {
    fullName: String(formData.get("fullName") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    locale: String(formData.get("locale") ?? ""),
    requestType: String(formData.get("requestType") ?? ""),
    message: String(formData.get("message") ?? ""),
    consent:
      formData.get("consent") === "on" ||
      formData.get("consent") === "true" ||
      formData.get("consent") === "1",
    companyWebsite: String(formData.get("companyWebsite") ?? ""),
  };
}

export function validateConsultationRequest(input: ConsultationFormInput): {
  ok: boolean;
  spam: boolean;
  errors: ConsultationFieldErrors;
  values: ConsultationFormValues | null;
} {
  if (input.companyWebsite?.trim()) {
    return { ok: true, spam: true, errors: {}, values: null };
  }

  const errors: ConsultationFieldErrors = {};
  const fullName = input.fullName.trim();
  const email = normalizeEmail(input.email);
  const phone = input.phone.trim();
  const message = input.message.trim();
  const locale: Locale = isLocale(input.locale) ? input.locale : "en";
  const requestType = input.requestType.trim();

  if (!fullName) {
    errors.fullName = "required";
  } else if (fullName.length > MAX_NAME) {
    errors.fullName = "tooLong";
  }

  if (!email) {
    errors.email = "required";
  } else if (!isValidEmail(email)) {
    errors.email = "invalid";
  }

  if (phone.length > MAX_PHONE) {
    errors.phone = "tooLong";
  }

  if (!isConsultationRequestType(requestType)) {
    errors.requestType = "required";
  }

  if (!message) {
    errors.message = "required";
  } else if (message.length < MIN_MESSAGE) {
    errors.message = "tooShort";
  } else if (message.length > MAX_MESSAGE) {
    errors.message = "tooLong";
  }

  if (!input.consent) {
    errors.consent = "required";
  }

  const ok = Object.keys(errors).length === 0;
  return {
    ok,
    spam: false,
    errors,
    values: ok
      ? {
          fullName,
          email,
          phone,
          locale,
          requestType: requestType as ConsultationRequestType,
          message,
          consentAt: new Date().toISOString(),
        }
      : null,
  };
}

export function validateConsultationStatusUpdate(input: {
  status: string;
  adminNotes: string;
}): {
  ok: boolean;
  error?: string;
  status: ConsultationStatus | null;
  adminNotes: string;
} {
  const adminNotes = input.adminNotes.trim();
  if (adminNotes.length > MAX_ADMIN_NOTES) {
    return {
      ok: false,
      error: "Notes are too long.",
      status: null,
      adminNotes: "",
    };
  }

  if (!isConsultationStatus(input.status)) {
    return { ok: false, error: "Invalid status.", status: null, adminNotes: "" };
  }

  return { ok: true, status: input.status, adminNotes };
}
