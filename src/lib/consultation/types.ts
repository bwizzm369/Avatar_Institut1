import type { Locale } from "@/types";

export const CONSULTATION_REQUEST_TYPES = [
  "consultation",
  "information",
] as const;

export type ConsultationRequestType = (typeof CONSULTATION_REQUEST_TYPES)[number];

export const CONSULTATION_STATUSES = [
  "new",
  "in_review",
  "contacted",
  "closed",
] as const;

export type ConsultationStatus = (typeof CONSULTATION_STATUSES)[number];

export type ConsultationFieldErrors = {
  fullName?: string;
  email?: string;
  phone?: string;
  requestType?: string;
  message?: string;
  consent?: string;
};

export type ConsultationFormInput = {
  fullName: string;
  email: string;
  phone: string;
  locale: string;
  requestType: string;
  message: string;
  consent: boolean;
  /** Honeypot — must stay empty. */
  companyWebsite?: string;
};

export type ConsultationFormValues = {
  fullName: string;
  email: string;
  phone: string;
  locale: Locale;
  requestType: ConsultationRequestType;
  message: string;
  consentAt: string;
};

export type ConsultationRequestRecord = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  locale: Locale;
  request_type: ConsultationRequestType;
  message: string;
  status: ConsultationStatus;
  admin_notes: string;
  consent_at: string;
  created_at: string;
  updated_at: string;
};
