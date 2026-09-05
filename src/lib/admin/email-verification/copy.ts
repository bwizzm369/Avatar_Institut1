import type { Locale } from "@/types";

export type AdminEmailVerificationCopy = {
  title: string;
  lead: string;
  codeLabel: string;
  submit: string;
  submitting: string;
  resend: string;
  resending: string;
  resendWait: string;
  sent: string;
  invalid: string;
  expired: string;
  locked: string;
  reused: string;
  cooldown: string;
  emailUnavailable: string;
  denied: string;
  network: string;
};

const COPY: Record<Locale, AdminEmailVerificationCopy> = {
  en: {
    title: "Administrative email verification",
    lead: "A 6-digit verification code was sent to your administrator email. Enter it to continue.",
    codeLabel: "Verification code",
    submit: "Verify",
    submitting: "Verifying…",
    resend: "Resend code",
    resending: "Sending…",
    resendWait: "You can request a new code in {n} seconds.",
    sent: "A new verification code has been sent.",
    invalid: "That verification code is not valid.",
    expired: "That verification code has expired. Request a new one.",
    locked: "Too many attempts. Request a new verification code.",
    reused: "That verification code is no longer valid.",
    cooldown: "Please wait before requesting a new code.",
    emailUnavailable:
      "The verification email could not be sent. Please try again later.",
    denied: "Access denied. This account is not an administrator.",
    network: "Network error. Please try again.",
  },
  ar: {
    title: "التحقق الإداري بالبريد الإلكتروني",
    lead: "تم إرسال رمز تحقق مكوّن من 6 أرقام إلى بريد المسؤول. أدخله للمتابعة.",
    codeLabel: "رمز التحقق",
    submit: "تحقق",
    submitting: "جارٍ التحقق…",
    resend: "إعادة إرسال الرمز",
    resending: "جارٍ الإرسال…",
    resendWait: "يمكنك طلب رمز جديد خلال {n} ثانية.",
    sent: "تم إرسال رمز تحقق جديد.",
    invalid: "رمز التحقق غير صالح.",
    expired: "انتهت صلاحية رمز التحقق. اطلب رمزًا جديدًا.",
    locked: "محاولات كثيرة. اطلب رمز تحقق جديدًا.",
    reused: "رمز التحقق هذا لم يعد صالحًا.",
    cooldown: "يُرجى الانتظار قبل طلب رمز جديد.",
    emailUnavailable:
      "تعذّر إرسال رسالة التحقق. يُرجى المحاولة لاحقًا.",
    denied: "الوصول مرفوض. هذا الحساب ليس حساب مسؤول.",
    network: "خطأ في الشبكة. يُرجى المحاولة مرة أخرى.",
  },
};

export function adminEmailVerificationCopy(
  locale: Locale,
): AdminEmailVerificationCopy {
  return COPY[locale];
}

export function formatAdminVerificationWait(
  locale: Locale,
  seconds: number,
): string {
  return adminEmailVerificationCopy(locale).resendWait.replace(
    "{n}",
    String(Math.max(0, Math.ceil(seconds))),
  );
}
