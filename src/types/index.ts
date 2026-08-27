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
  /** Demo catalogue entries must always be flagged. Public catalogue maps this to false. */
  isDemo: boolean;
  modules: Module[];
  skills: {
    en: string[];
    ar: string[];
  };
  imageUrl?: string | null;
  studentPassIncluded?: boolean;
  studentPassDiscountPercent?: number;
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

export type CertificateStatus = "issued" | "revoked";

/**
 * Official certificate (modern profile and/or legacy student).
 * Public verification uses CertificatePublicVerify — never this full record.
 */
export interface Certificate {
  id: string;
  certificateNumber: string;
  status: CertificateStatus;
  issuedAt: string;
  revokedAt: string | null;
  courseId: string | null;
  profileId: string | null;
  legacyStudentId: string | null;
  enrollmentId: string | null;
  legacyCompletionId: string | null;
  oldCertificateNumber: string | null;
  language: Locale | null;
  holderDisplayName: string;
  courseTitleAr: string;
  courseTitleEn: string;
}

/** Fields returned by verify_certificate() — snapshots only, no private data. */
export type CertificatePublicVerify = {
  certificateNumber: string;
  status: CertificateStatus;
  holderDisplayName: string;
  courseTitleEn: string;
  courseTitleAr: string;
  issuedAt: string;
};
