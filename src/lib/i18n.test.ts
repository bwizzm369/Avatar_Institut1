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
    expect(msg("courses.startCourse", "en")).toBe("Start course");
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
    expect(msg("dashboard.studentPassPlanNameMonthly", "en")).toBe("Monthly");
    expect(msg("dashboard.studentPassPlanAmountMonthly", "en")).toBe("12 €");
    expect(msg("dashboard.studentPassPlanIntervalMonthly", "en")).toBe(
      "per month",
    );
    expect(msg("dashboard.studentPassChooseMonthly", "en")).toBe(
      "Choose monthly",
    );
    expect(msg("dashboard.studentPassPlanNameSemiannual", "en")).toBe(
      "6 months",
    );
    expect(msg("dashboard.studentPassPlanAmountSemiannual", "en")).toBe("72 €");
    expect(msg("dashboard.studentPassPlanIntervalSemiannual", "ar")).toBe(
      "كل 6 أشهر",
    );
    expect(msg("dashboard.studentPassChooseSemiannual", "en")).toBe(
      "Choose 6 months",
    );
    expect(msg("dashboard.studentPassPlanNameAnnual", "en")).toBe("Annual");
    expect(msg("dashboard.studentPassPlanAmountAnnual", "en")).toBe("144 €");
    expect(msg("dashboard.studentPassPlanIntervalAnnual", "en")).toBe(
      "per year",
    );
    expect(msg("dashboard.studentPassChooseAnnual", "ar")).toBe("اختر السنوي");
    expect(msg("dashboard.overallProgress", "en")).toBe("Overall progress");
    expect(msg("dashboard.overallProgress", "ar")).toBe("التقدّم الإجمالي");
    expect(msg("dashboard.viewAll", "en")).toBe("View all");
    expect(msg("dashboard.viewAll", "ar")).toBe("عرض الكل");
  });

  it("includes password reset strings in EN/AR", () => {
    expect(msg("auth.forgotPassword", "en")).toBe("Forgot password?");
    expect(msg("auth.forgotPassword", "ar")).toBe("نسيت كلمة المرور؟");
    expect(msg("auth.resetSent", "en")).toMatch(/If an account exists/i);
    expect(msg("auth.resetSent", "ar")).toMatch(/إذا كان هناك حساب/);
    expect(msg("auth.resetSuccess", "en")).toMatch(/password has been updated/i);
    expect(msg("auth.error.passwordMismatch", "ar")).toMatch(/غير متطابقتين/);
  });

  it("includes About menu labels in EN/AR without repeating the institute item", () => {
    expect(msg("about.tab.institute", "en")).toBe("About the Institute");
    expect(msg("about.tab.institute", "ar")).toBe("عن المعهد");
    expect(msg("about.tab.founder", "en")).toBe("Founder");
    expect(msg("about.tab.founder", "ar")).toBe("المؤسس");
    expect(msg("about.tab.founder", "ar")).not.toBe(
      msg("about.tab.institute", "ar"),
    );
  });

  it("includes consultation and testimonial strings in EN/AR", () => {
    expect(msg("nav.consultation", "en")).toBe("Consultation");
    expect(msg("nav.consultation", "ar")).toBe("استشارة");
    expect(msg("nav.reviews", "en")).toBe("Reviews");
    expect(msg("nav.reviews", "ar")).toBe("الآراء");
    expect(msg("consultation.title", "ar")).toBe("استشارة ومعلومات");
    expect(msg("consultation.type.consultation", "en")).toBe(
      "Private consultation",
    );
    expect(msg("reviews.title", "ar")).toBe("آراء الدارسين");
    expect(msg("reviews.empty", "en")).toMatch(/No published testimonials/i);
    expect(msg("reviews.form.success", "en")).toMatch(/after it has been reviewed/i);
    expect(msg("reviews.form.success", "ar")).toContain("شكرًا لمشاركتك رأيك");
    expect(msg("reviews.status.pendingBody", "ar")).toContain("معهد الأفاتار");
    expect(msg("reviews.error.ratingRequired", "en")).toMatch(/rating/i);
    expect(msg("reviews.error.textRequired", "ar")).toMatch(/رأيك/);
    expect(msg("reviews.error.alreadySubmitted", "en")).toMatch(/already submitted/i);
    expect(msg("reviews.form.loginCta", "ar")).toMatch(/تسجيل الدخول/);
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
