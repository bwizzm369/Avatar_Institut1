import { isLocale } from "@/lib/i18n";
import type { Locale } from "@/types";

export type SignupFieldErrors = {
  email?: string;
  password?: string;
  confirmPassword?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  country?: string;
  locale?: string;
  previouslyStudied?: string;
  previousCourse?: string;
  declaredCertificateNumber?: string;
};

export type SignupInput = {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone: string;
  country: string;
  locale: string;
  previouslyStudied: string;
  previousCourse: string;
  declaredCertificateNumber: string;
};

export type SignupValues = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  country: string;
  locale: Locale;
  previouslyStudied: boolean;
  previousCourse: string | null;
  declaredCertificateNumber: string | null;
};

/** Only these keys are copied into Auth user_metadata. */
export const SIGNUP_USER_METADATA_KEYS = [
  "first_name",
  "last_name",
  "locale",
  "phone",
  "country",
  "previously_studied",
  "previous_course",
  "declared_certificate_number",
] as const;

export type SignupUserMetadata = {
  first_name: string;
  last_name: string;
  locale: Locale;
  phone: string;
  country: string;
  previously_studied: boolean;
  previous_course: string | null;
  declared_certificate_number: string | null;
};

const FORBIDDEN_SIGNUP_METADATA_KEYS = [
  "role",
  "legacy_match_status",
  "linked_profile_id",
  "legacy_student_id",
  "student_pass",
  "payment_confirmed",
  "enrollment",
  "certificate",
] as const;

export function readSignupFormFields(formData: FormData): SignupInput {
  return {
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    country: String(formData.get("country") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
    locale: String(formData.get("locale") ?? ""),
    previouslyStudied: String(formData.get("previouslyStudied") ?? ""),
    previousCourse: String(formData.get("previousCourse") ?? ""),
    declaredCertificateNumber: String(
      formData.get("declaredCertificateNumber") ?? "",
    ),
  };
}

export function parsePreviouslyStudiedFlag(
  value: string,
): boolean | null {
  const normalized = value.trim().toLowerCase();
  if (normalized === "yes" || normalized === "true" || normalized === "1") {
    return true;
  }
  if (normalized === "no" || normalized === "false" || normalized === "0") {
    return false;
  }
  return null;
}

export function parseSignupLocale(value: string): Locale {
  const trimmed = value.trim().toLowerCase();
  return isLocale(trimmed) ? trimmed : "en";
}

export function buildSignupUserMetadata(
  values: SignupValues,
): SignupUserMetadata {
  return {
    first_name: values.firstName,
    last_name: values.lastName,
    locale: values.locale,
    phone: values.phone,
    country: values.country,
    previously_studied: values.previouslyStudied,
    previous_course: values.previousCourse,
    declared_certificate_number: values.declaredCertificateNumber,
  };
}

export function signupMetadataContainsForbiddenKeys(
  metadata: Record<string, unknown>,
): boolean {
  return FORBIDDEN_SIGNUP_METADATA_KEYS.some((key) => key in metadata);
}

export function isForbiddenSignupMetadataKey(key: string): boolean {
  return (FORBIDDEN_SIGNUP_METADATA_KEYS as readonly string[]).includes(key);
}
