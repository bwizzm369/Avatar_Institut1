import type { Locale, LocalizedString } from "@/types";

export const pageTitles: Record<string, LocalizedString> = {
  home: { en: "Home", ar: "الرئيسية" },
  about: { en: "About", ar: "عن المعهد" },
  founder: { en: "Founder", ar: "المؤسس" },
  courses: { en: "Courses", ar: "الدورات" },
  library: { en: "Library", ar: "المكتبة" },
  consultation: { en: "Consultation", ar: "استشارة" },
  reviews: { en: "Testimonials", ar: "آراء الدارسين" },
  courseDetail: { en: "Course detail", ar: "تفاصيل الدورة" },
  cart: { en: "Cart", ar: "السلة" },
  cartSuccess: { en: "Payment received", ar: "تم استلام الدفع" },
  login: { en: "Login", ar: "تسجيل الدخول" },
  signup: { en: "Sign up", ar: "إنشاء حساب" },
  forgotPassword: { en: "Forgot password", ar: "نسيت كلمة المرور" },
  updatePassword: { en: "New password", ar: "كلمة مرور جديدة" },
  dashboard: { en: "Dashboard", ar: "لوحة التحكم" },
  dashboardCourses: { en: "My courses", ar: "دوراتي" },
  dashboardCourseReader: { en: "Course", ar: "الدورة" },
  dashboardLessonReader: { en: "Lesson", ar: "الدرس" },
  dashboardCertificates: { en: "My certificates", ar: "شهاداتي" },
  dashboardStudentPass: { en: "Student Pass", ar: "Student Pass" },
  verifyCertificate: { en: "Certificate verification", ar: "التحقق من الشهادة" },
};

const BRAND = "Avatar Institut";

export function resolveTitleKey(pathname: string): keyof typeof pageTitles {
  if (pathname === "/") return "home";
  if (pathname === "/about/founder") return "founder";
  if (pathname === "/about" || pathname.startsWith("/about/")) return "about";
  if (pathname === "/courses") return "courses";
  if (pathname === "/library") return "library";
  if (pathname === "/consultation") return "consultation";
  if (pathname === "/reviews") return "reviews";
  if (pathname.startsWith("/courses/")) return "courseDetail";
  if (pathname === "/cart/success") return "cartSuccess";
  if (pathname === "/cart") return "cart";
  if (pathname === "/login") return "login";
  if (pathname === "/signup") return "signup";
  if (pathname === "/forgot-password") return "forgotPassword";
  if (pathname === "/update-password") return "updatePassword";
  if (/^\/dashboard\/courses\/[^/]+\/lessons\/[^/]+$/.test(pathname)) {
    return "dashboardLessonReader";
  }
  if (/^\/dashboard\/courses\/[^/]+$/.test(pathname)) {
    return "dashboardCourseReader";
  }
  if (pathname === "/dashboard/courses") return "dashboardCourses";
  if (pathname === "/dashboard/certificates") return "dashboardCertificates";
  if (pathname === "/dashboard/student-pass") return "dashboardStudentPass";
  if (pathname === "/verify" || pathname.startsWith("/verify/")) {
    return "verifyCertificate";
  }
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    return "dashboard";
  }
  return "home";
}

export function formatDocumentTitle(pathname: string, locale: Locale): string {
  const key = resolveTitleKey(pathname);
  const label = pageTitles[key][locale];
  return `${label} · ${BRAND}`;
}

export function englishMetadataTitle(key: keyof typeof pageTitles): string {
  return pageTitles[key].en;
}

/** Absolute English title for route metadata (avoids template edge cases). */
export function englishAbsoluteTitle(key: keyof typeof pageTitles): string {
  return `${pageTitles[key].en} · ${BRAND}`;
}
