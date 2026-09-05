import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { CODE_HASH_PATTERN, CODE_LENGTH } from "@/lib/admin/email-verification/constants";

export function generateAdminVerificationCode(): string {
  return String(randomInt(0, 10 ** CODE_LENGTH)).padStart(CODE_LENGTH, "0");
}

export function normalizeAdminVerificationCode(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length !== CODE_LENGTH) {
    return null;
  }
  return digits;
}

export function deriveAdminVerificationKey(
  secret: string,
  purpose: "code" | "cookie",
): Buffer {
  return createHmac("sha256", secret).update(`admin-email-verification:${purpose}`).digest();
}

export function hashAdminVerificationCode(options: {
  secret: string;
  profileId: string;
  sessionId: string;
  code: string;
}): string {
  const key = deriveAdminVerificationKey(options.secret, "code");
  return createHmac("sha256", key)
    .update(`${options.profileId}:${options.sessionId}:${options.code}`)
    .digest("hex");
}

export function hashesMatch(expectedHex: string, receivedHex: string): boolean {
  if (
    !CODE_HASH_PATTERN.test(expectedHex) ||
    !CODE_HASH_PATTERN.test(receivedHex)
  ) {
    return false;
  }
  const expected = Buffer.from(expectedHex, "hex");
  const received = Buffer.from(receivedHex, "hex");
  if (expected.length !== received.length) {
    return false;
  }
  return timingSafeEqual(expected, received);
}

export type AdminVerificationCookiePayload = {
  v: 1;
  sub: string;
  sid: string;
  iat: number;
};

function encodeSegment(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeSegment(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

export function signAdminVerificationCookie(options: {
  secret: string;
  userId: string;
  sessionId: string;
  issuedAt: Date;
}): string {
  const payload: AdminVerificationCookiePayload = {
    v: 1,
    sub: options.userId,
    sid: options.sessionId,
    iat: Math.floor(options.issuedAt.getTime() / 1000),
  };
  const body = encodeSegment(JSON.stringify(payload));
  const key = deriveAdminVerificationKey(options.secret, "cookie");
  const mac = createHmac("sha256", key).update(body).digest("base64url");
  return `v1.${body}.${mac}`;
}

export function readAdminVerificationCookie(
  raw: string | undefined | null,
  secret: string,
): AdminVerificationCookiePayload | null {
  if (!raw) {
    return null;
  }
  const parts = raw.split(".");
  if (parts.length !== 3 || parts[0] !== "v1") {
    return null;
  }
  const [, body, mac] = parts;
  if (!body || !mac) {
    return null;
  }
  const key = deriveAdminVerificationKey(secret, "cookie");
  const expected = createHmac("sha256", key).update(body).digest("base64url");
  const actualBuf = Buffer.from(mac);
  const expectedBuf = Buffer.from(expected);
  if (actualBuf.length !== expectedBuf.length) {
    return null;
  }
  if (!timingSafeEqual(actualBuf, expectedBuf)) {
    return null;
  }
  try {
    const parsed = JSON.parse(decodeSegment(body)) as AdminVerificationCookiePayload;
    if (
      parsed.v !== 1 ||
      typeof parsed.sub !== "string" ||
      typeof parsed.sid !== "string" ||
      typeof parsed.iat !== "number"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function cookieMatchesSession(
  payload: AdminVerificationCookiePayload,
  userId: string,
  sessionId: string,
): boolean {
  return payload.sub === userId && payload.sid === sessionId;
}
