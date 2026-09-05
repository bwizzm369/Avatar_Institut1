import {
  ADMIN_VERIFICATION_FROM_LOCAL_PART,
  ADMIN_VERIFICATION_FROM_NAME,
} from "@/lib/admin/email-verification/constants";

const PLACEHOLDER_MARKERS = [
  "your_resend_api_key",
  "re_your_resend_api_key",
  "your_resend_email_domain",
  "your_admin_email_verification_secret",
];

export type AdminMailerEnv = Record<string, string | undefined>;

const DOMAIN_PATTERN =
  /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i;

function isFilled(value: string | undefined): value is string {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  return !PLACEHOLDER_MARKERS.some((marker) => trimmed.includes(marker));
}

/** Server-only. Never log or return this value to the client. */
export function getResendApiKey(
  env: AdminMailerEnv = process.env,
): string | null {
  const key = env.RESEND_API_KEY;
  if (!isFilled(key)) return null;
  return key.trim();
}

/** Server-only sending domain, for example mail.avatarinstitut.com. */
export function getResendEmailDomain(
  env: AdminMailerEnv = process.env,
): string | null {
  const raw = env.RESEND_EMAIL_DOMAIN;
  if (!isFilled(raw)) return null;
  const domain = raw.trim().toLowerCase();
  if (
    domain.includes("://") ||
    domain.includes("/") ||
    domain.includes("@") ||
    domain.includes(" ")
  ) {
    return null;
  }
  if (!DOMAIN_PATTERN.test(domain)) {
    return null;
  }
  return domain;
}

export function getAdminVerificationFromAddress(
  env: AdminMailerEnv = process.env,
): string | null {
  const domain = getResendEmailDomain(env);
  if (!domain) return null;
  return `${ADMIN_VERIFICATION_FROM_NAME} <${ADMIN_VERIFICATION_FROM_LOCAL_PART}@${domain}>`;
}

export function isResendAdminMailerConfigured(
  env: AdminMailerEnv = process.env,
): boolean {
  return getResendApiKey(env) !== null && getAdminVerificationFromAddress(env) !== null;
}

/** Server-only HMAC secret. Independent of Supabase. Never log this value. */
export function getAdminVerificationSecret(
  env: AdminMailerEnv = process.env,
): string | null {
  const dedicated = env.ADMIN_EMAIL_VERIFICATION_SECRET;
  if (!isFilled(dedicated)) return null;
  return dedicated.trim();
}

export function resolveAdminVerificationIssueSecret(
  env: AdminMailerEnv = process.env,
): { ok: true; secret: string } | { ok: false; reason: "email_unavailable" } {
  const secret = getAdminVerificationSecret(env);
  if (!secret) {
    return { ok: false, reason: "email_unavailable" };
  }
  return { ok: true, secret };
}

export function resolveAdminVerificationConfirmSecret(
  env: AdminMailerEnv = process.env,
): { ok: true; secret: string } | { ok: false; reason: "invalid" } {
  const secret = getAdminVerificationSecret(env);
  if (!secret) {
    return { ok: false, reason: "invalid" };
  }
  return { ok: true, secret };
}
