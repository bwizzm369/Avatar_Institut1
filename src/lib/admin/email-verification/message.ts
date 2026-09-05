import { CODE_LENGTH, CODE_TTL_MINUTES } from "@/lib/admin/email-verification/constants";
import type { Locale } from "@/types";

export type AdminVerificationEmailMessage = {
  subject: string;
  text: string;
  html: string;
};

const EN = {
  subject: "Avatar Institut Security — administrator verification code",
  heading: "Administrative sign-in verification",
  intro: `Use this ${CODE_LENGTH}-digit code to continue signing in to the administrator console:`,
  validity: `This code is valid for ${CODE_TTL_MINUTES} minutes.`,
  ignore: "If you did not request this administrator sign-in, ignore this message.",
};

const AR = {
  subject: "أمن معهد أفاتار — رمز التحقق الإداري",
  heading: "التحقق من تسجيل دخول المسؤول",
  intro: `استخدم رمز التحقق المكوّن من ${CODE_LENGTH} أرقام لمتابعة تسجيل الدخول إلى لوحة المسؤول:`,
  validity: `هذا الرمز صالح لمدة ${CODE_TTL_MINUTES} دقائق.`,
  ignore: "إذا لم تطلب تسجيل الدخول هذا، فتجاهل هذه الرسالة.",
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function buildAdminVerificationEmailMessage(input: {
  locale: Locale;
  code: string;
}): AdminVerificationEmailMessage {
  const arabicFirst = input.locale === "ar";
  const subject = arabicFirst
    ? `${AR.subject} | ${EN.subject}`
    : `${EN.subject} | ${AR.subject}`;

  const text = arabicFirst
    ? [
        AR.heading,
        AR.intro,
        input.code,
        AR.validity,
        AR.ignore,
        "",
        EN.heading,
        EN.intro,
        input.code,
        EN.validity,
        EN.ignore,
      ].join("\n")
    : [
        EN.heading,
        EN.intro,
        input.code,
        EN.validity,
        EN.ignore,
        "",
        AR.heading,
        AR.intro,
        input.code,
        AR.validity,
        AR.ignore,
      ].join("\n");

  const safeCode = escapeHtml(input.code);
  const codeBlock = `<p style="margin:16px 0;font-size:28px;letter-spacing:0.28em;font-weight:700;color:#1F4D3A;font-family:Consolas,Menlo,monospace;" dir="ltr">${safeCode}</p>`;

  const enHtml = `
    <section style="direction:ltr;text-align:left;color:#1A1A1A;">
      <h1 style="margin:0 0 12px;font-size:20px;color:#1F4D3A;">${EN.heading}</h1>
      <p style="margin:0;">${EN.intro}</p>
      ${codeBlock}
      <p style="margin:0 0 8px;">${EN.validity}</p>
      <p style="margin:0;">${EN.ignore}</p>
    </section>
  `;
  const arHtml = `
    <section style="direction:rtl;text-align:right;color:#1A1A1A;">
      <h1 style="margin:0 0 12px;font-size:20px;color:#1F4D3A;">${AR.heading}</h1>
      <p style="margin:0;">${AR.intro}</p>
      ${codeBlock}
      <p style="margin:0 0 8px;">${AR.validity}</p>
      <p style="margin:0;">${AR.ignore}</p>
    </section>
  `;

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#ffffff;font-family:Georgia,serif;">
    ${arabicFirst ? arHtml : enHtml}
    <hr style="margin:24px 0;border:0;border-top:1px solid #D9D4C8;" />
    ${arabicFirst ? enHtml : arHtml}
  </body>
</html>`;

  return { subject, text, html };
}
