export const ADMIN_EMAIL_VERIFICATION_COOKIE = "ai_admin_ev";

export const ADMIN_EMAIL_VERIFICATION_NAME =
  "administrative email verification" as const;

export const CODE_LENGTH = 6;
export const CODE_TTL_MINUTES = 10;
export const CODE_TTL_MS = CODE_TTL_MINUTES * 60 * 1000;
export const MAX_ATTEMPTS = 5;
export const RESEND_COOLDOWN_MS = 60 * 1000;

export const CODE_HASH_PATTERN = /^[0-9a-f]{64}$/;

export const ADMIN_VERIFICATION_FROM_NAME = "Avatar Institut Security";
export const ADMIN_VERIFICATION_FROM_LOCAL_PART = "security";
export const ADMIN_VERIFICATION_REPLY_TO = "contact@avatarinstitut.com";
export const RESEND_EMAILS_URL = "https://api.resend.com/emails";
