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
  "nav.logout": { en: "Log out", ar: "تسجيل الخروج" },
  "nav.dashboard": { en: "Dashboard", ar: "لوحة التحكم" },
  "nav.getStarted": { en: "Get started", ar: "ابدأ الآن" },
  "nav.menu": { en: "Menu", ar: "القائمة" },
  "nav.close": { en: "Close", ar: "إغلاق" },

  "brand.tagline": {
    en: "Where Science Meets Consciousness",
    ar: "حيث يلتقي العلم بالوعي",
  },
  "brand.arabicName": { en: "مؤسسة الأڤاتار", ar: "مؤسسة الأڤاتار" },
  "brand.logoAlt": {
    en: "Official Avatar Institut logo: circle with a center point, Avatar Institut für Metaphysik GmbH",
    ar: "الشعار الرسمي لمؤسسة الأڤاتار: دائرة بنقطة مركزية، Avatar Institut für Metaphysik GmbH",
  },

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
  "cart.checkout": { en: "Pay with Stripe (test)", ar: "الدفع عبر Stripe (تجريبي)" },
  "cart.checkoutLoading": {
    en: "Redirecting to Stripe…",
    ar: "جاري التحويل إلى Stripe…",
  },
  "cart.checkoutLoginRequired": {
    en: "Sign in to pay",
    ar: "سجّل الدخول للدفع",
  },
  "cart.checkoutConfigMissing": {
    en: "Secure checkout is temporarily unavailable. Please try again later.",
    ar: "الدفع الآمن غير متاح مؤقتًا. يرجى المحاولة لاحقًا.",
  },
  "cart.checkoutError": {
    en: "Could not start checkout. Please try again.",
    ar: "تعذّر بدء الدفع. يرجى المحاولة مرة أخرى.",
  },
  "cart.checkoutPriceRejected": {
    en: "Checkout amounts are set securely by the academy. Please try again.",
    ar: "تُحدَّد مبالغ الدفع بأمان من الأكاديمية. يرجى المحاولة مرة أخرى.",
  },
  "cart.checkoutStripeNote": {
    en: "Secure checkout. Your courses appear under My courses shortly after payment.",
    ar: "دفع آمن. تظهر دوراتك ضمن «دوراتي» بعد الدفع بوقت قصير.",
  },
  "cart.demoNote": {
    en: "Items are stored locally in this browser for demonstration only.",
    ar: "تُحفظ العناصر محليًا في هذا المتصفح للعرض فقط.",
  },
  "cart.successBadge": {
    en: "Payment received",
    ar: "تم استلام الدفع",
  },
  "cart.successTitle": {
    en: "Payment received",
    ar: "تم استلام الدفع",
  },
  "cart.successLead": {
    en: "Thank you. We are preparing access to your course.",
    ar: "شكرًا لك. نقوم الآن بتجهيز وصولك إلى الدورة.",
  },
  "cart.successWaiting": {
    en: "Your course will usually appear in My courses within a few moments.",
    ar: "ستظهر دورتك عادةً في قسم «دوراتي» خلال لحظات قليلة.",
  },
  "cart.successActivated": {
    en: "Your course is ready. You can start learning now.",
    ar: "دورتك جاهزة. يمكنك البدء في التعلم الآن.",
  },
  "cart.successDelayed": {
    en: "Your payment was received, but activation is taking a little longer than expected.",
    ar: "تم استلام دفعتك، لكن تفعيل الوصول يستغرق وقتًا أطول قليلًا من المعتاد.",
  },
  "cart.successGoCourses": {
    en: "Go to My courses",
    ar: "الانتقال إلى دوراتي",
  },
  "cart.successStartCourse": {
    en: "Start my course",
    ar: "ابدأ دورتي",
  },
  "cart.successCheckAgain": {
    en: "Check again",
    ar: "تحقق مرة أخرى",
  },
  "cart.successBackToCart": {
    en: "Back to cart",
    ar: "العودة إلى السلة",
  },

  "auth.loginTitle": { en: "Log in", ar: "تسجيل الدخول" },
  "auth.signupTitle": { en: "Create an account", ar: "إنشاء حساب" },
  "auth.email": { en: "Email", ar: "البريد الإلكتروني" },
  "auth.password": { en: "Password", ar: "كلمة المرور" },
  "auth.firstName": { en: "First name", ar: "الاسم الأول" },
  "auth.lastName": { en: "Last name", ar: "اسم العائلة" },
  "auth.submitLogin": { en: "Log in", ar: "تسجيل الدخول" },
  "auth.submitSignup": { en: "Sign up", ar: "إنشاء حساب" },
  "auth.submitting": { en: "Please wait…", ar: "يرجى الانتظار…" },
  "auth.noAccount": { en: "No account yet?", ar: "ليس لديك حساب؟" },
  "auth.hasAccount": { en: "Already have an account?", ar: "لديك حساب بالفعل؟" },
  "auth.configMissing": {
    en: "Sign-in is temporarily unavailable. Please try again later.",
    ar: "تسجيل الدخول غير متاح مؤقتًا. يرجى المحاولة لاحقًا.",
  },
  "auth.connectedNotice": {
    en: "Sign in with your Avatar Institut account. Course access appears under My courses after payment is confirmed.",
    ar: "سجّل الدخول بحساب مؤسسة الأڤاتار. يظهر الوصول إلى الدورات ضمن «دوراتي» بعد تأكيد الدفع.",
  },
  "auth.confirmEmail": {
    en: "Check your email to confirm your account before signing in.",
    ar: "تحقق من بريدك الإلكتروني لتأكيد حسابك قبل تسجيل الدخول.",
  },
  "auth.invalidCredentials": {
    en: "Invalid email or password.",
    ar: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
  },
  "auth.emailNotConfirmed": {
    en: "Please confirm your email before signing in. Check your inbox for the confirmation link.",
    ar: "يرجى تأكيد بريدك الإلكتروني قبل تسجيل الدخول. تحقق من صندوق الوارد لرابط التأكيد.",
  },
  "auth.networkError": {
    en: "Network error. Check your connection and try again.",
    ar: "خطأ في الشبكة. تحقق من اتصالك وحاول مرة أخرى.",
  },
  "auth.logoutFailed": {
    en: "Could not sign out. Please try again.",
    ar: "تعذّر تسجيل الخروج. يرجى المحاولة مرة أخرى.",
  },
  "auth.signupFailed": {
    en: "Could not create the account. Please try again.",
    ar: "تعذّر إنشاء الحساب. يرجى المحاولة مرة أخرى.",
  },
  "auth.validationFailed": {
    en: "Please correct the highlighted fields.",
    ar: "يرجى تصحيح الحقول المميزة.",
  },
  "auth.callbackFailed": {
    en: "Authentication callback failed. Please try signing in again.",
    ar: "فشل ردّ المصادقة. يرجى محاولة تسجيل الدخول مرة أخرى.",
  },
  "auth.error.required": { en: "This field is required.", ar: "هذا الحقل مطلوب." },
  "auth.error.emailInvalid": {
    en: "Enter a valid email address.",
    ar: "أدخل بريدًا إلكترونيًا صالحًا.",
  },
  "auth.error.passwordShort": {
    en: "Password must be at least 8 characters.",
    ar: "يجب أن تكون كلمة المرور 8 أحرف على الأقل.",
  },

  "dashboard.title": { en: "Student dashboard", ar: "لوحة تحكم الطالب" },
  "dashboard.notice": {
    en: "Your enrolled programmes appear here once access is ready. Certificates follow after course completion.",
    ar: "تظهر برامجك المسجّلة هنا عندما يصبح الوصول جاهزًا. تليها الشهادات بعد إتمام الدورة.",
  },
  "dashboard.welcome": {
    en: "Welcome to your learning space",
    ar: "مرحبًا بك في مساحة التعلم الخاصة بك",
  },
  "dashboard.welcomeNamed": {
    en: "Welcome, {name}",
    ar: "مرحبًا، {name}",
  },
  "dashboard.unauthenticated": {
    en: "You must sign in to view your dashboard.",
    ar: "يجب تسجيل الدخول لعرض لوحة التحكم.",
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
    en: "No enrollments yet. Purchased courses appear here once access is ready.",
    ar: "لا توجد تسجيلات بعد. تظهر الدورات المشتراة هنا عندما يصبح الوصول جاهزًا.",
  },
  "dashboard.certificatesTitle": { en: "My certificates", ar: "شهاداتي" },
  "dashboard.certificatesEmpty": {
    en: "No certificates yet. Certificates will be issued only after verified course completion in a later phase.",
    ar: "لا توجد شهادات بعد. ستُصدر الشهادات فقط بعد إتمام الدورة الموثّق في مرحلة لاحقة.",
  },
  "dashboard.courseReaderTitle": { en: "Course", ar: "الدورة" },
  "dashboard.lessonReaderTitle": { en: "Lesson", ar: "الدرس" },

  "learning.courseEyebrow": { en: "Enrolled programme", ar: "برنامج مسجّل" },
  "learning.progressLabel": { en: "Course progress", ar: "تقدّم الدورة" },
  "learning.progressCount": {
    en: "{completed} of {total} lessons",
    ar: "{completed} من {total} دروس",
  },
  "learning.noModules": {
    en: "No modules are available for this course yet.",
    ar: "لا توجد وحدات متاحة لهذه الدورة بعد.",
  },
  "learning.openLesson": { en: "Open lesson", ar: "فتح الدرس" },
  "learning.backToCourses": { en: "Back to My courses", ar: "العودة إلى دوراتي" },
  "learning.backToCourse": { en: "Back to course", ar: "العودة إلى الدورة" },
  "learning.durationMinutes": { en: "{n} min", ar: "{n} د" },
  "learning.type.video": { en: "Video", ar: "فيديو" },
  "learning.type.text": { en: "Text", ar: "نص" },
  "learning.type.pdf": { en: "PDF", ar: "PDF" },
  "learning.status.notStarted": { en: "Not started", ar: "لم يبدأ" },
  "learning.status.inProgress": { en: "In progress", ar: "قيد التقدّم" },
  "learning.status.completed": { en: "Completed", ar: "مكتمل" },
  "learning.markComplete": { en: "Mark as completed", ar: "وضع علامة مكتمل" },
  "learning.markingComplete": { en: "Saving…", ar: "جارٍ الحفظ…" },
  "learning.alreadyCompleted": {
    en: "This lesson is marked as completed.",
    ar: "تم وضع علامة مكتمل على هذا الدرس.",
  },
  "learning.bunnyPlaceholderTitle": {
    en: "Video lesson",
    ar: "درس فيديو",
  },
  "learning.bunnyPlaceholderReady": {
    en: "This video lesson is reserved and will play when video streaming is connected.",
    ar: "هذا الدرس المرئي محجوز وسيُشغَّل عند تفعيل بث الفيديو.",
  },
  "learning.bunnyPlaceholderMissing": {
    en: "No video is assigned to this lesson yet.",
    ar: "لم يُعيَّن فيديو لهذا الدرس بعد.",
  },
  "learning.bunnyPlaceholderNote": {
    en: "Video lessons unlock only for enrolled students.",
    ar: "دروس الفيديو متاحة فقط للطلاب المسجّلين.",
  },
  "learning.openPdf": { en: "Open PDF resource", ar: "فتح مورد PDF" },
  "learning.pdfMissing": {
    en: "No PDF is attached to this lesson yet.",
    ar: "لا يوجد ملف PDF مرفق بهذا الدرس بعد.",
  },
  "learning.accessDenied": {
    en: "Access denied. An active, payment-confirmed enrollment is required. A URL alone never unlocks a course.",
    ar: "الوصول مرفوض. يلزم تسجيل نشط مؤكَّد الدفع. لا يفتح عنوان URL وحده أي دورة.",
  },
  "learning.courseNotFound": {
    en: "Course not found.",
    ar: "الدورة غير موجودة.",
  },
  "learning.lessonNotFound": {
    en: "Lesson not found.",
    ar: "الدرس غير موجود.",
  },
  "learning.invalidRequest": {
    en: "Invalid request.",
    ar: "طلب غير صالح.",
  },
  "learning.progressSaveFailed": {
    en: "Could not save lesson progress. Try again.",
    ar: "تعذّر حفظ تقدّم الدرس. حاول مرة أخرى.",
  },
  "learning.ctaStart": { en: "Start course", ar: "ابدأ الدورة" },
  "learning.ctaContinue": { en: "Continue course", ar: "متابعة الدورة" },
  "learning.ctaReview": { en: "Review course", ar: "مراجعة الدورة" },
  "learning.continueNextLesson": {
    en: "Continue with next lesson",
    ar: "متابعة الدرس التالي",
  },
  "learning.coverPlaceholder": {
    en: "Avatar Institut",
    ar: "معهد أفاتار",
  },
  "learning.enrolledBadge": { en: "Enrolled", ar: "مسجّل" },
  "learning.sidebarLabel": { en: "Course summary", ar: "ملخص الدورة" },
  "learning.totalDuration": { en: "Total duration", ar: "المدة الإجمالية" },
  "learning.certificateStatus": {
    en: "Certificate",
    ar: "الشهادة",
  },
  "learning.certificateReady": {
    en: "Course complete — certificate issuance comes in a later phase.",
    ar: "الدورة مكتملة — إصدار الشهادة في مرحلة لاحقة.",
  },
  "learning.certificatePending": {
    en: "Complete all lessons to unlock certificate eligibility.",
    ar: "أكمل جميع الدروس لتأهيل الشهادة.",
  },
  "learning.moduleLessonCount": {
    en: "{n} lessons",
    ar: "{n} دروس",
  },
  "learning.nextLesson": { en: "Next", ar: "التالي" },

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
    en: "Avatar Institut — learning with care and clarity.",
    ar: "معهد أفاتار — تعلّم بعناية ووضوح.",
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
