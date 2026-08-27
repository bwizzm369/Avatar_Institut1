import {
  isValidCertificateNumber,
  normalizeCertificateNumberInput,
} from "@/lib/certificates/number";
import { isCertificatePdfPreviewEnvironment } from "@/lib/certificates/pdf/preview-env";

export const CERTIFICATE_VERIFY_ROUTE = "/verify";
export const LOCAL_CERTIFICATE_ORIGIN = "http://localhost:3000";

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

/**
 * Canonical public origin for certificate verification URLs.
 * Uses existing `NEXT_PUBLIC_APP_URL` only — never invents a production domain
 * and never uses `VERCEL_URL` (preview hosts would make QR codes non-deterministic).
 */
export function getCertificatePublicOrigin(
  env: NodeJS.ProcessEnv = process.env,
): string {
  const configured = env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") ?? "";
  return configured || LOCAL_CERTIFICATE_ORIGIN;
}

export function isLoopbackCertificateOrigin(origin: string): boolean {
  try {
    const hostname = new URL(origin).hostname.toLowerCase();
    return LOOPBACK_HOSTS.has(hostname) || hostname.endsWith(".localhost");
  } catch {
    return true;
  }
}

/** Official PDF / production QR: https public host, never localhost. */
export function assertOfficialCertificateOrigin(origin: string): void {
  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    throw new Error("certificate public origin is not a valid URL");
  }
  if (url.protocol !== "https:") {
    throw new Error("official certificate QR requires an https public origin");
  }
  if (isLoopbackCertificateOrigin(origin)) {
    throw new Error("official certificate QR must not use localhost");
  }
}

/** Official student/admin PDF download is available only with a public HTTPS origin. */
export function isOfficialCertificatePdfOriginConfigured(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  try {
    assertOfficialCertificateOrigin(getCertificatePublicOrigin(env));
    return true;
  } catch {
    return false;
  }
}

/**
 * Dashboard / admin official PDF download:
 * public HTTPS origin, or NEXT_PUBLIC_APP_URL localhost in local/dev/test only.
 * Production never treats localhost as downloadable.
 */
export function isCertificatePdfDownloadAvailable(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  const origin = getCertificatePublicOrigin(env);
  if (isLoopbackCertificateOrigin(origin)) {
    return isCertificatePdfPreviewEnvironment(env);
  }
  return isOfficialCertificatePdfOriginConfigured(env);
}

/**
 * Deterministic public verification URL for one official number.
 * Encodes only `/verify/{AVT-YYYY-NNNNNN}` — no email, UUID, token, or query.
 */
export function buildCertificateVerificationUrl(
  rawNumber: string,
  options?: { origin?: string },
): string {
  const officialNumber = normalizeCertificateNumberInput(rawNumber);
  if (!isValidCertificateNumber(officialNumber)) {
    throw new Error("invalid certificate number");
  }
  const origin = (options?.origin ?? getCertificatePublicOrigin()).replace(
    /\/$/,
    "",
  );
  return `${origin}${CERTIFICATE_VERIFY_ROUTE}/${encodeURIComponent(officialNumber)}`;
}
