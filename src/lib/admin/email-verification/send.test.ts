import { describe, expect, it, vi } from "vitest";
import {
  ADMIN_VERIFICATION_REPLY_TO,
  CODE_TTL_MINUTES,
  RESEND_EMAILS_URL,
} from "@/lib/admin/email-verification/constants";
import {
  getAdminVerificationFromAddress,
  isResendAdminMailerConfigured,
} from "@/lib/admin/email-verification/env";
import { buildAdminVerificationEmailMessage } from "@/lib/admin/email-verification/message";
import {
  isAdminVerificationEmailConfigured,
  sendAdminVerificationEmail,
} from "@/lib/admin/email-verification/send";

const TEST_CODE = "654321";
const TEST_ENV = {
  RESEND_API_KEY: "re_test_placeholder_key",
  RESEND_EMAIL_DOMAIN: "mail.avatarinstitut.com",
};

function readJsonBody(init: RequestInit | undefined): Record<string, unknown> {
  if (typeof init?.body !== "string") {
    throw new Error("expected JSON request body");
  }
  return JSON.parse(init.body) as Record<string, unknown>;
}

describe("administrative Resend mailer", () => {
  it("is configured only when both server variables are present", () => {
    expect(isAdminVerificationEmailConfigured({})).toBe(false);
    expect(
      isResendAdminMailerConfigured({
        RESEND_API_KEY: "re_test_placeholder_key",
      }),
    ).toBe(false);
    expect(
      isResendAdminMailerConfigured({
        RESEND_EMAIL_DOMAIN: "mail.avatarinstitut.com",
      }),
    ).toBe(false);
    expect(isResendAdminMailerConfigured(TEST_ENV)).toBe(true);
    expect(getAdminVerificationFromAddress(TEST_ENV)).toBe(
      "Avatar Institut Security <security@mail.avatarinstitut.com>",
    );
  });

  it("rejects placeholder or invalid domain values without exposing secrets", () => {
    expect(
      isResendAdminMailerConfigured({
        RESEND_API_KEY: "re_your_resend_api_key",
        RESEND_EMAIL_DOMAIN: "mail.avatarinstitut.com",
      }),
    ).toBe(false);
    expect(
      getAdminVerificationFromAddress({
        RESEND_EMAIL_DOMAIN: "https://mail.avatarinstitut.com",
      }),
    ).toBeNull();
  });

  it("builds a bilingual EN/AR message with the code, 10-minute validity, and ignore note", () => {
    const message = buildAdminVerificationEmailMessage({
      locale: "en",
      code: TEST_CODE,
    });
    expect(message.subject).toContain("verification code");
    expect(message.subject).toContain("رمز التحقق");
    expect(message.subject).not.toContain(TEST_CODE);
    expect(message.text).toContain(TEST_CODE);
    expect(message.text).toContain(`${CODE_TTL_MINUTES} minutes`);
    expect(message.text).toContain(`${CODE_TTL_MINUTES} دقائق`);
    expect(message.text).toMatch(/ignore this message/i);
    expect(message.text).toContain("تجاهل هذه الرسالة");
    expect(message.html).toContain(TEST_CODE);
    expect(message.html).not.toMatch(/href=["'][^"']*\d{6}/);
    expect(message.html).toContain("direction:rtl");
  });

  it("sends through a simulated Resend request and never returns the code", async () => {
    const fetchImpl = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      expect(String(url)).toBe(RESEND_EMAILS_URL);
      expect(String(url)).not.toContain(TEST_CODE);
      const payload = readJsonBody(init);
      expect(payload.from).toBe(
        "Avatar Institut Security <security@mail.avatarinstitut.com>",
      );
      expect(payload.reply_to).toBe(ADMIN_VERIFICATION_REPLY_TO);
      expect(payload.to).toEqual(["admin@example.com"]);
      expect(String(payload.subject)).not.toContain(TEST_CODE);
      expect(String(payload.text)).toContain(TEST_CODE);
      expect(String(payload.html)).toContain(TEST_CODE);
      const headers = new Headers(init?.headers);
      expect(headers.get("Authorization")?.startsWith("Bearer ")).toBe(true);
      expect(headers.get("Authorization")).not.toMatch(/\d{6}/);
      return { ok: true } as Response;
    });

    const result = await sendAdminVerificationEmail(
      { to: "admin@example.com", locale: "en", code: TEST_CODE },
      { env: TEST_ENV, fetchImpl },
    );

    expect(result).toEqual({ ok: true });
    expect(JSON.stringify(result)).not.toContain(TEST_CODE);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("does not call Resend when the mailer is not configured", async () => {
    const fetchImpl = vi.fn();
    const result = await sendAdminVerificationEmail(
      { to: "admin@example.com", locale: "ar", code: TEST_CODE },
      { env: {}, fetchImpl },
    );
    expect(result).toEqual({ ok: false, reason: "email_unavailable" });
    expect(JSON.stringify(result)).not.toContain(TEST_CODE);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("maps a Resend failure to email_unavailable without leaking the code", async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false, status: 401 }) as Response);
    const result = await sendAdminVerificationEmail(
      { to: "admin@example.com", locale: "en", code: TEST_CODE },
      { env: TEST_ENV, fetchImpl },
    );
    expect(result).toEqual({ ok: false, reason: "email_unavailable" });
    expect(JSON.stringify(result)).not.toMatch(/\d{6}/);
    expect(result).not.toHaveProperty("error");
    expect(result).not.toHaveProperty("message");
  });

  it("maps a transport exception to email_unavailable without leaking the code", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error(`upstream failed for ${TEST_CODE}`);
    });
    const result = await sendAdminVerificationEmail(
      { to: "admin@example.com", locale: "en", code: TEST_CODE },
      { env: TEST_ENV, fetchImpl },
    );
    expect(result).toEqual({ ok: false, reason: "email_unavailable" });
    expect(JSON.stringify(result)).not.toContain(TEST_CODE);
  });
});
