import {
  ADMIN_VERIFICATION_REPLY_TO,
  RESEND_EMAILS_URL,
} from "@/lib/admin/email-verification/constants";
import {
  getAdminVerificationFromAddress,
  getResendApiKey,
  isResendAdminMailerConfigured,
  type AdminMailerEnv,
} from "@/lib/admin/email-verification/env";
import { buildAdminVerificationEmailMessage } from "@/lib/admin/email-verification/message";
import type { Locale } from "@/types";

export type AdminVerificationEmailInput = {
  to: string;
  locale: Locale;
  code: string;
};

export type AdminVerificationEmailResult =
  | { ok: true }
  | { ok: false; reason: "email_unavailable" };

export type AdminVerificationMailer = (
  input: AdminVerificationEmailInput,
) => Promise<AdminVerificationEmailResult>;

export type AdminVerificationEmailFetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Pick<Response, "ok">>;

export type AdminVerificationEmailSendOptions = {
  env?: AdminMailerEnv;
  fetchImpl?: AdminVerificationEmailFetch;
};

export function isAdminVerificationEmailConfigured(
  env: AdminMailerEnv = process.env,
): boolean {
  return isResendAdminMailerConfigured(env);
}

export async function sendAdminVerificationEmail(
  input: AdminVerificationEmailInput,
  options: AdminVerificationEmailSendOptions = {},
): Promise<AdminVerificationEmailResult> {
  const env = options.env ?? process.env;
  const apiKey = getResendApiKey(env);
  const from = getAdminVerificationFromAddress(env);
  const to = input.to.trim();

  if (!apiKey || !from || !to) {
    return { ok: false, reason: "email_unavailable" };
  }

  const message = buildAdminVerificationEmailMessage({
    locale: input.locale,
    code: input.code,
  });
  const fetchImpl = options.fetchImpl ?? fetch;

  try {
    const response = await fetchImpl(RESEND_EMAILS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: ADMIN_VERIFICATION_REPLY_TO,
        subject: message.subject,
        html: message.html,
        text: message.text,
      }),
    });

    if (!response.ok) {
      return { ok: false, reason: "email_unavailable" };
    }
    return { ok: true };
  } catch {
    return { ok: false, reason: "email_unavailable" };
  }
}
