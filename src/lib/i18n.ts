import type { Locale, LocalizedString } from "@/types";

export const LOCALES: Locale[] = ["en", "ar"];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_STORAGE_KEY = "avatar-institut-locale";

export function isLocale(value: string): value is Locale {
  return value === "en" || value === "ar";
}

export function getDirection(locale: Locale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}

export function t(value: LocalizedString, locale: Locale): string {
  return value[locale];
}

type Dictionary = Record<string, LocalizedString>;

export const messages: Dictionary = {
  "nav.home": { en: "Home", ar: "الرئيسية" },
  "nav.courses": { en: "Courses", ar: "الدورات" },
  "nav.cart": { en: "Cart", ar: "السلة" },
  "nav.login": { en: "Log in", ar: "تسجيل الدخول" },
  "nav.signup": { en: "Sign up", ar: "إنشاء حساب" },
  "nav.dashboard": { en: "Dashboard", ar: "لوحة التحكم" },
  "nav.getStarted": { en: "Get started", ar: "ابدأ الآن" },
  "nav.menu": { en: "Menu", ar: "القائمة" },
  "nav.close": { en: "Close", ar: "إغلاق" },

  "brand.tagline": {
    en: "Where Science Meets Consciousness",
    ar: "حيث يلتقي العلم بالوعي",
  },
  "brand.arabicName": { en: "مؤسسة الأڤاتار", ar: "مؤسسة الأڤاتار" },

  "home.eyebrow": {
    en: "Where Science Meets Consciousness",
    ar: "حيث يلتقي العلم بالوعي",
  },
  "home.title": {
    en: "Explore the Metaphysics of Human Consciousness",
    ar: "استكشف ميتافيزيقا الوعي الإنساني",
  },
  "home.subtitle": {
    en: "An international academy dedicated to metaphysics, consciousness, and human development through rigorous research and transformative education.",
    ar: "أكاديمية دولية مكرسة للميتافيزيقا والوعي والتنمية البشرية عبر البحث الرصين والتعليم التحويلي.",
  },
  "home.ctaCourses": { en: "Explore courses", ar: "استكشف الدورات" },
  "home.ctaAbout": { en: "Our mission", ar: "رسالتنا" },
  "home.aboutEyebrow": { en: "About Avatar Institut", ar: "عن مؤسسة الأڤاتار" },
  "home.aboutTitle": { en: "Bridging Science and Spirit", ar: "جسر بين العلم والروح" },
  "home.aboutBody1": {
    en: "Avatar Institut für Metaphysik GmbH is an international academy dedicated to advancing the study of metaphysics, consciousness, and human development.",
    ar: "مؤسسة الأڤاتار للميتافيزيقا هي أكاديمية دولية مكرسة لتطوير دراسة الميتافيزيقا والوعي والتنمية البشرية.",
  },
  "home.aboutBody2": {
    en: "Our mission unites academic excellence with spiritual wisdom, creating pathways for researchers, students, and professionals.",
    ar: "تجمع رسالتنا بين التميز الأكاديمي والحكمة الروحية، وتفتح مسارات للباحثين والطلاب والمهنيين.",
  },
  "home.valuesEyebrow": { en: "Core principles", ar: "المبادئ الأساسية" },
  "home.valuesTitle": { en: "Our values guide us", ar: "قيمنا ترشدنا" },
  "home.value.wisdom": { en: "Wisdom", ar: "الحكمة" },
  "home.value.wisdomBody": {
    en: "Deep understanding rooted in ancient traditions and modern inquiry.",
    ar: "فهم عميق متجذر في التقاليد القديمة والاستقصاء المعاصر.",
  },
  "home.value.research": { en: "Research", ar: "البحث" },
  "home.value.researchBody": {
    en: "Rigorous methodology applied to metaphysical questions.",
    ar: "منهجية صارمة مطبقة على الأسئلة الميتافيزيقية.",
  },
  "home.value.integrity": { en: "Integrity", ar: "النزاهة" },
  "home.value.integrityBody": {
    en: "Honest inquiry and authentic engagement with all seekers.",
    ar: "استقصاء صادق ومشاركة أصيلة مع جميع الباحثين.",
  },
  "home.value.transformation": { en: "Transformation", ar: "التحول" },
  "home.value.transformationBody": {
    en: "Empowering individuals to evolve and reach their potential.",
    ar: "تمكين الأفراد من التطور وتحقيق إمكاناتهم.",
  },
  "home.ctaBannerTitle": {
    en: "Ready to begin your journey?",
    ar: "هل أنت مستعد لبدء رحلتك؟",
  },
  "home.ctaBannerBody": {
    en: "Browse demonstration courses and explore the student experience being built for Avatar Institut.",
    ar: "تصفح الدورات التجريبية واستكشف تجربة الطالب قيد البناء لمؤسسة الأڤاتار.",
  },

  "courses.eyebrow": { en: "Learning pathways", ar: "مسارات التعلم" },
  "courses.title": { en: "Course catalogue", ar: "كتالوج الدورات" },
  "courses.intro": {
    en: "Three demonstration programmes for platform testing. They are not live enrollments.",
    ar: "ثلاثة برامج تجريبية لاختبار المنصة. ليست تسجيلات حية.",
  },
  "courses.demoBadge": { en: "Demonstration course", ar: "دورة تجريبية" },
  "courses.weeks": { en: "{n} weeks", ar: "{n} أسابيع" },
  "courses.lessons": { en: "{n} lessons", ar: "{n} دروس" },
  "courses.lessonsLabel": { en: "Lessons", ar: "الدروس" },
  "courses.view": { en: "View details", ar: "عرض التفاصيل" },
  "courses.addToCart": { en: "Add to cart", ar: "أضف إلى السلة" },
  "courses.inCart": { en: "In cart", ar: "في السلة" },
  "courses.notFound": { en: "Course not found", ar: "الدورة غير موجودة" },
  "courses.back": { en: "Back to catalogue", ar: "العودة إلى الكتالوج" },
  "courses.curriculum": { en: "Curriculum", ar: "المنهج" },
  "courses.skills": { en: "Skills gained", ar: "المهارات المكتسبة" },
  "courses.level": { en: "Level", ar: "المستوى" },
  "courses.duration": { en: "Duration", ar: "المدة" },
  "courses.price": { en: "Price", ar: "السعر" },

  "cart.title": { en: "Your cart", ar: "سلتك" },
  "cart.empty": { en: "Your cart is empty.", ar: "سلتك فارغة." },
  "cart.loading": { en: "Loading cart…", ar: "جاري تحميل السلة…" },
  "cart.browse": { en: "Browse courses", ar: "تصفح الدورات" },
  "cart.remove": { en: "Remove", ar: "إزالة" },
  "cart.total": { en: "Total", ar: "المجموع" },
  "cart.checkout": { en: "Proceed to payment", ar: "المتابعة إلى الدفع" },
  "cart.checkoutDisabled": {
    en: "Payment is not connected yet. Stripe and PayPal will be integrated in a later phase. No payment can be completed here.",
    ar: "الدفع غير متصل بعد. سيتم دمج Stripe وPayPal في مرحلة لاحقة. لا يمكن إتمام أي دفع هنا.",
  },
  "cart.demoNote": {
    en: "Items are stored locally in this browser for demonstration only.",
    ar: "تُحفظ العناصر محليًا في هذا المتصفح للعرض فقط.",
  },

  "auth.loginTitle": { en: "Log in", ar: "تسجيل الدخول" },
  "auth.signupTitle": { en: "Create an account", ar: "إنشاء حساب" },
  "auth.email": { en: "Email", ar: "البريد الإلكتروني" },
  "auth.password": { en: "Password", ar: "كلمة المرور" },
  "auth.firstName": { en: "First name", ar: "الاسم الأول" },
  "auth.lastName": { en: "Last name", ar: "اسم العائلة" },
  "auth.submitLogin": { en: "Log in", ar: "تسجيل الدخول" },
  "auth.submitSignup": { en: "Sign up", ar: "إنشاء حساب" },
  "auth.noAccount": { en: "No account yet?", ar: "ليس لديك حساب؟" },
  "auth.hasAccount": { en: "Already have an account?", ar: "لديك حساب بالفعل؟" },
  "auth.notice": {
    en: "Authentication is not connected yet. Supabase Auth will be integrated later. This form is a layout preview only — no real account is created.",
    ar: "المصادقة غير متصلة بعد. سيتم دمج Supabase Auth لاحقًا. هذا النموذج معاينة للواجهة فقط — لا يُنشأ حساب حقيقي.",
  },
  "auth.previewSubmit": {
    en: "Form received locally. No account was created and you are not authenticated.",
    ar: "تم استلام النموذج محليًا. لم يُنشأ أي حساب ولست مصادقًا.",
  },

  "dashboard.title": { en: "Student dashboard", ar: "لوحة تحكم الطالب" },
  "dashboard.notice": {
    en: "This is a demonstration interface. Real authentication, purchases, enrollments, and certificates are not connected yet.",
    ar: "هذه واجهة تجريبية. المصادقة الحقيقية والمشتريات والتسجيلات والشهادات غير متصلة بعد.",
  },
  "dashboard.welcome": {
    en: "Welcome to your learning space",
    ar: "مرحبًا بك في مساحة التعلم الخاصة بك",
  },
  "dashboard.intro": {
    en: "After server-confirmed payment, enrolled programmes will appear under My courses. Certificates will appear after completion rules are met.",
    ar: "بعد تأكيد الدفع من الخادم، ستظهر البرامج المسجّلة ضمن دوراتي. ستظهر الشهادات بعد استيفاء شروط الإتمام.",
  },
  "dashboard.nav.overview": { en: "Overview", ar: "نظرة عامة" },
  "dashboard.nav.courses": { en: "My courses", ar: "دوراتي" },
  "dashboard.nav.certificates": { en: "My certificates", ar: "شهاداتي" },
  "dashboard.coursesTitle": { en: "My courses", ar: "دوراتي" },
  "dashboard.coursesEmpty": {
    en: "No enrollments yet. Access is granted only after server-side payment confirmation — never from a browser redirect alone.",
    ar: "لا توجد تسجيلات بعد. يُمنح الوصول فقط بعد تأكيد الدفع من الخادم — وليس من إعادة توجيه المتصفح وحدها.",
  },
  "dashboard.certificatesTitle": { en: "My certificates", ar: "شهاداتي" },
  "dashboard.certificatesEmpty": {
    en: "No certificates yet. Certificates will be issued only after verified course completion in a later phase.",
    ar: "لا توجد شهادات بعد. ستُصدر الشهادات فقط بعد إتمام الدورة الموثّق في مرحلة لاحقة.",
  },

  "footer.rights": {
    en: "© 2026 Avatar Institut für Metaphysik. All rights reserved.",
    ar: "© 2026 مؤسسة الأڤاتار للميتافيزيقا. جميع الحقوق محفوظة.",
  },
  "footer.tagline": {
    en: "Where Science Meets Consciousness",
    ar: "حيث يلتقي العلم بالوعي",
  },
  "footer.quickLinks": { en: "Quick links", ar: "روابط سريعة" },
  "footer.platform": { en: "Platform", ar: "المنصة" },
  "footer.aboutBody": {
    en: "Avatar Institut für Metaphysik GmbH advances consciousness studies and metaphysical education.",
    ar: "تعمل مؤسسة الأڤاتار للميتافيزيقا على تطوير دراسات الوعي والتعليم الميتافيزيقي.",
  },

  "notice.platformPhase": {
    en: "Phase 1 foundation — catalogue, cart, and student UI are local demonstrations. Supabase, Stripe, PayPal, and Bunny Stream are not connected.",
    ar: "أساس المرحلة الأولى: الكتالوج والسلة وواجهة الطالب معروضة محليًا للتجربة فقط. خدمات Supabase وStripe وPayPal وBunny Stream غير متصلة بعد.",
  },

  "common.min": { en: "{n} min", ar: "{n} د" },
  "common.module": { en: "Module {n}", ar: "الوحدة {n}" },
};

export function msg(key: keyof typeof messages | string, locale: Locale): string {
  const entry = messages[key];
  if (!entry) return key;
  return entry[locale];
}

export function msgReplace(
  key: string,
  locale: Locale,
  replacements: Record<string, string | number>,
): string {
  let text = msg(key, locale);
  for (const [token, value] of Object.entries(replacements)) {
    text = text.replace(`{${token}}`, String(value));
  }
  return text;
}
