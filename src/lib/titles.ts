import type { Locale, LocalizedString } from "@/types";

export const pageTitles: Record<string, LocalizedString> = {
  home: { en: "Home", ar: "الرئيسية" },
  courses: { en: "Courses", ar: "الدورات" },
  courseDetail: { en: "Course detail", ar: "تفاصيل الدورة" },
  cart: { en: "Cart", ar: "السلة" },
  cartSuccess: { en: "Payment received", ar: "تم استلام الدفع" },
  login: { en: "Login", ar: "تسجيل الدخول" },
  signup: { en: "Sign up", ar: "إنشاء حساب" },
  dashboard: { en: "Dashboard", ar: "لوحة التحكم" },
  dashboardCourses: { en: "My courses", ar: "دوراتي" },
  dashboardCourseReader: { en: "Course", ar: "الدورة" },
  dashboardLessonReader: { en: "Lesson", ar: "الدرس" },
  dashboardCertificates: { en: "My certificates", ar: "شهاداتي" },
};

const BRAND = "Avatar Institut";

export function resolveTitleKey(pathname: string): keyof typeof pageTitles {
  if (pathname === "/") return "home";
  if (pathname === "/courses") return "courses";
  if (pathname.startsWith("/courses/")) return "courseDetail";
  if (pathname === "/cart/success") return "cartSuccess";
  if (pathname === "/cart") return "cart";
  if (pathname === "/login") return "login";
  if (pathname === "/signup") return "signup";
  if (/^\/dashboard\/courses\/[^/]+\/lessons\/[^/]+$/.test(pathname)) {
    return "dashboardLessonReader";
  }
  if (/^\/dashboard\/courses\/[^/]+$/.test(pathname)) {
    return "dashboardCourseReader";
  }
  if (pathname === "/dashboard/courses") return "dashboardCourses";
  if (pathname === "/dashboard/certificates") return "dashboardCertificates";
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
