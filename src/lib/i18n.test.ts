import { describe, expect, it } from "vitest";
import { displayLocalized, getDirection, isLocale, msg } from "@/lib/i18n";

describe("i18n helpers", () => {
  it("validates locales and directions", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale("ar")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(getDirection("en")).toBe("ltr");
    expect(getDirection("ar")).toBe("rtl");
  });

  it("returns bilingual messages", () => {
    expect(msg("nav.courses", "en")).toBe("Courses");
    expect(msg("nav.courses", "ar")).toBe("الدورات");
  });

  it("includes Student Pass pricing strings in EN/AR", () => {
    expect(msg("courses.passIncludedShort", "en")).toBe(
      "Included with Student Pass",
    );
    expect(msg("courses.passIncludedShort", "ar")).toBe(
      "مشمول ضمن Student Pass",
    );
    expect(msg("courses.passIncludedMember", "en")).toBe(
      "Included with your Student Pass",
    );
    expect(msg("courses.passIncludedMember", "ar")).toBe(
      "مشمول ضمن عضويتك في Student Pass",
    );
    expect(msg("courses.normalPrice", "en")).toContain("Normal price");
    expect(msg("courses.passPrice", "ar")).toContain("Student Pass");
    expect(msg("courses.startCourse", "en")).toBe("Start Course");
    expect(msg("courses.startCourse", "ar")).toBe("ابدأ الدورة");
    expect(msg("courses.intro", "en")).not.toMatch(/demonstration/i);
    expect(msg("courses.passBenefitDiscount", "en")).toContain("% off");
    expect(msg("courses.passDigitalMembership", "en")).toBe("Digital Membership");
    expect(msg("courses.passDigitalMembership", "ar")).toBe("العضوية الرقمية");
    expect(msg("dashboard.studentPassMaintains", "en")).toBe(
      "Student Pass maintains your active member status within Avatar Institut.",
    );
    expect(msg("dashboard.studentPassMaintains", "ar")).toBe(
      "يحافظ Student Pass على صفتك كعضو فعّال في معهد الأفاتار.",
    );
    expect(msg("dashboard.studentPassPrice", "en")).toBe("12 € / month");
  });

  it("includes password reset strings in EN/AR", () => {
    expect(msg("auth.forgotPassword", "en")).toBe("Forgot password?");
    expect(msg("auth.forgotPassword", "ar")).toBe("نسيت كلمة المرور؟");
    expect(msg("auth.resetSent", "en")).toMatch(/If an account exists/i);
    expect(msg("auth.resetSent", "ar")).toMatch(/إذا كان هناك حساب/);
    expect(msg("auth.resetSuccess", "en")).toMatch(/password has been updated/i);
    expect(msg("auth.error.passwordMismatch", "ar")).toMatch(/غير متطابقتين/);
  });

  it("includes public certificate verification strings in EN/AR", () => {
    expect(msg("verify.valid", "en")).toBe("Certificate Valid");
    expect(msg("verify.valid", "ar")).toBe("الشهادة صالحة");
    expect(msg("verify.revoked", "en")).toBe("Certificate Revoked");
    expect(msg("verify.revoked", "ar")).toBe("الشهادة ملغاة");
    expect(msg("verify.notFound", "en")).toBe("Certificate Not Found");
    expect(msg("verify.notFound", "ar")).toBe("الشهادة غير موجودة");
  });

  it("falls back to the other language for empty course titles", () => {
    const bilingual = { en: "Gratitude Course", ar: "دورة الشكر" };
    expect(displayLocalized(bilingual, "en")).toBe("Gratitude Course");
    expect(displayLocalized({ en: "", ar: "دورة الشكر" }, "en")).toBe(
      "دورة الشكر",
    );
    expect(displayLocalized(bilingual, "ar")).toBe("دورة الشكر");
    expect(displayLocalized({ en: "", ar: "وصف الشكر" }, "en")).toBe(
      "وصف الشكر",
    );
    expect(displayLocalized({ en: "Gratitude Course", ar: "" }, "ar")).toBe(
      "Gratitude Course",
    );
  });
});
