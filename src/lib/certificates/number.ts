import type { CertificateStatus } from "@/types";

/** Official Avatar Institut certificate number: AVT-YYYY-XXXXXX */
export const CERTIFICATE_NUMBER_PATTERN = /^AVT-\d{4}-\d{6}$/;

export const CERTIFICATE_STATUSES: readonly CertificateStatus[] = [
  "issued",
  "revoked",
] as const;

export function isCertificateStatus(
  value: string | null | undefined,
): value is CertificateStatus {
  return value === "issued" || value === "revoked";
}

export function isValidCertificateNumber(
  value: string | null | undefined,
): boolean {
  return typeof value === "string" && CERTIFICATE_NUMBER_PATTERN.test(value);
}

/** Trim, strip spaces, uppercase — never interpolates into SQL. */
export function normalizeCertificateNumberInput(
  value: string | null | undefined,
): string {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, "").toUpperCase();
}

/**
 * Formats an official number. Sequence starts at 1 → 000001.
 * Does not allocate; PostgreSQL next_certificate_number() is the source of truth.
 */
export function formatCertificateNumber(year: number, sequence: number): string {
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new Error("invalid certificate year");
  }
  if (!Number.isInteger(sequence) || sequence < 1 || sequence > 999999) {
    throw new Error("invalid certificate sequence");
  }
  return `AVT-${year}-${String(sequence).padStart(6, "0")}`;
}

export function parseCertificateNumber(
  value: string,
): { year: number; sequence: number } | null {
  if (!isValidCertificateNumber(value)) return null;
  return {
    year: Number(value.slice(4, 8)),
    sequence: Number(value.slice(9)),
  };
}

/** Year used for AVT-YYYY-… must come from issued_at, not from "now". */
export function issuedAtYear(issuedAt: string | Date): number {
  if (issuedAt instanceof Date) {
    if (Number.isNaN(issuedAt.getTime())) {
      throw new Error("invalid issued_at");
    }
    return issuedAt.getUTCFullYear();
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(issuedAt.trim());
  if (!match) {
    throw new Error("invalid issued_at");
  }
  return Number(match[1]);
}
