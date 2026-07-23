/**
 * Domain types for the Avatar Institut learning platform.
 * Prepared for the future flow:
 * course → cart → account → Stripe/PayPal → server confirmation → enrollment → certificate
 */

export type Locale = "en" | "ar";

/** Future payment providers — not connected in phase 1. */
export type PaymentProvider = "stripe" | "paypal";

export interface LocalizedString {
  en: string;
  ar: string;
}

export interface Lesson {
  id: string;
  title: LocalizedString;
  durationMinutes: number;
  order: number;
}

export interface Module {
  id: string;
  title: LocalizedString;
  order: number;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  slug: string;
  title: LocalizedString;
  summary: LocalizedString;
  description: LocalizedString;
  priceCents: number;
  currency: "EUR" | "USD" | "CHF";
  durationWeeks: number;
  level: LocalizedString;
  /** Demo catalogue entries must always be flagged. */
  isDemo: boolean;
  modules: Module[];
  skills: {
    en: string[];
    ar: string[];
  };
}

export interface CartItem {
  courseId: string;
  slug: string;
  title: LocalizedString;
  priceCents: number;
  currency: Course["currency"];
  addedAt: string;
}

export interface StudentProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  locale: Locale;
  createdAt: string;
}

export type EnrollmentStatus =
  | "pending_payment"
  | "active"
  | "completed"
  | "revoked";

export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  status: EnrollmentStatus;
  enrolledAt: string | null;
  /** Must only be set after server-side payment confirmation. */
  paymentConfirmedAt: string | null;
}

export interface Certificate {
  id: string;
  studentId: string;
  courseId: string;
  issuedAt: string;
  certificateNumber: string;
}
