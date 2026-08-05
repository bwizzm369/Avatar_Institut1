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
  "nav.about": { en: "About", ar: "عن المؤسسة" },
  "nav.founder": { en: "Founder", ar: "المؤسس" },
  "nav.courses": { en: "Courses", ar: "الدورات" },
  "nav.library": { en: "Library", ar: "المكتبة" },
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
    en: "An international academy dedicated to metaphysics, consciousness, and human development through thoughtful inquiry and transformative education.",
    ar: "أكاديمية دولية مكرسة للميتافيزيقا والوعي والتنمية البشرية عبر التأمّل الفكري والتعليم التحويلي.",
  },
  "home.ctaCourses": { en: "Explore courses", ar: "استكشف الدورات" },
  "home.ctaAbout": { en: "Our mission", ar: "رسالتنا" },
  "home.ctaFounder": {
    en: "Meet our founder",
    ar: "تعرّف على المؤسس",
  },
  "home.aboutEyebrow": { en: "About Avatar Institut", ar: "عن مؤسسة الأڤاتار" },
  "home.aboutTitle": { en: "Bridging Science and Spirit", ar: "جسر بين العلم والروح" },
  "home.aboutBody1": {
    en: "Avatar Institut für Metaphysik GmbH is an international academy dedicated to advancing the study of metaphysics, consciousness, and human development.",
    ar: "مؤسسة الأڤاتار للميتافيزيقا هي أكاديمية دولية مكرسة لتطوير دراسة الميتافيزيقا والوعي والتنمية البشرية.",
  },
  "home.aboutBody2": {
    en: "Our mission brings together philosophical inquiry and spiritual wisdom, opening pathways for researchers, students, and professionals in Arabic and English.",
    ar: "تجمع رسالتنا بين التأمّل الفلسفي والحكمة الروحية، وتفتح مسارات للباحثين والطلاب والمهنيين بالعربية والإنجليزية.",
  },
  "home.valuesEyebrow": { en: "Core principles", ar: "المبادئ الأساسية" },
  "home.valuesTitle": { en: "Our values guide us", ar: "قيمنا ترشدنا" },
  "home.value.wisdom": { en: "Wisdom", ar: "الحكمة" },
  "home.value.wisdomBody": {
    en: "Reflective understanding that joins metaphysical thought with spiritual insight, as cultivated at Avatar Institut.",
    ar: "فهم تأمّلي يجمع الفكر الميتافيزيقي بالبصيرة الروحية، كما تُنمّيه مؤسسة الأڤاتار.",
  },
  "home.value.research": { en: "Research", ar: "البحث" },
  "home.value.researchBody": {
    en: "Careful exploration of consciousness and metaphysical questions through structured study and open dialogue.",
    ar: "استكشاف متأنٍ للوعي والأسئلة الميتافيزيقية عبر الدراسة المنظّمة والحوار المفتوح.",
  },
  "home.value.integrity": { en: "Integrity", ar: "النزاهة" },
  "home.value.integrityBody": {
    en: "Honest inquiry and clear communication, without exaggeration or unsupported claims.",
    ar: "استقصاء صادق وتواصل واضح، بلا مبالغة ولا ادّعاءات غير موثّقة.",
  },
  "home.value.transformation": { en: "Transformation", ar: "التحول" },
  "home.value.transformationBody": {
    en: "Supporting personal growth and the development of human consciousness through accessible education.",
    ar: "دعم النمو الشخصي وتنمية الوعي الإنساني عبر تعليم واضح ومتاح.",
  },
  "home.ctaBannerTitle": {
    en: "Ready to begin your journey?",
    ar: "هل أنت مستعد لبدء رحلتك؟",
  },
  "home.ctaBannerBody": {
    en: "Explore the Avatar Institut course catalogue and begin your learning journey.",
    ar: "استكشف كتالوج دورات مؤسسة الأڤاتار وابدأ رحلتك التعليمية.",
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

  "about.eyebrow": {
    en: "About the Institute",
    ar: "عن المؤسسة",
  },
  "about.title": {
    en: "Avatar Institut für Metaphysik",
    ar: "مؤسسة الأفاتار للميتافيزيقا",
  },
  "about.location": {
    en: "Kiel, Germany",
    ar: "كيل، ألمانيا",
  },
  "about.intro": {
    en: "A knowledge and education platform dedicated to human consciousness and metaphysical thought, with structured programmes in Arabic and English.",
    ar: "منصة معرفية وتعليمية مكرّسة للوعي الإنساني والفكر الميتافيزيقي، ببرامج منظّمة بالعربية والإنجليزية.",
  },
  "about.subnavLabel": { en: "About sections", ar: "أقسام عن المؤسسة" },
  "about.tab.institute": {
    en: "About the Institute",
    ar: "عن المؤسسة",
  },
  "about.tab.founder": {
    en: "The Founder",
    ar: "عن المؤسس",
  },
  "about.pillarsEyebrow": {
    en: "Foundations",
    ar: "الأسس",
  },
  "about.pillarsTitle": {
    en: "Mission, vision, and values",
    ar: "الرسالة والرؤية والقيم",
  },
  "about.missionEyebrow": { en: "Mission", ar: "الرسالة" },
  "about.missionTitle": {
    en: "Our mission",
    ar: "رسالتنا",
  },
  "about.missionBody": {
    en: "To make serious ideas clear and accessible, and to open a space for dialogue between philosophy, consciousness studies, and spiritual inquiry.",
    ar: "تقديم معرفة جادة وواضحة، وفتح مساحة للحوار بين الفكر الفلسفي ودراسات الوعي والتجربة الروحية.",
  },
  "about.visionEyebrow": { en: "Vision", ar: "الرؤية" },
  "about.visionTitle": {
    en: "Our vision",
    ar: "رؤيتنا",
  },
  "about.visionBody": {
    en: "An international institution that joins careful thought with the depth of human questioning, connecting cultures and languages without exaggeration or unsupported claims.",
    ar: "مؤسسة معرفية دولية تجمع بين التأمّل المتأني وعمق السؤال الإنساني، وتصل بين الثقافات واللغات دون مبالغة أو ادّعاءات غير موثّقة.",
  },
  "about.valuesEyebrow": { en: "Values", ar: "القيم" },
  "about.valuesTitle": {
    en: "Our values",
    ar: "قيمنا",
  },
  "about.value.clarity": {
    en: "Clarity",
    ar: "الوضوح",
  },
  "about.value.clarityBody": {
    en: "Serious ideas presented with care, so learning remains accessible and precise.",
    ar: "أفكار جادة تُقدَّم بعناية، ليبقى التعلّم واضحًا ودقيقًا.",
  },
  "about.value.dialogue": {
    en: "Dialogue",
    ar: "الحوار",
  },
  "about.value.dialogueBody": {
    en: "A meeting place for philosophy, consciousness studies, and spiritual inquiry.",
    ar: "مساحة للقاء بين الفكر الفلسفي ودراسات الوعي والتجربة الروحية.",
  },
  "about.value.integrity": {
    en: "Integrity",
    ar: "النزاهة",
  },
  "about.value.integrityBody": {
    en: "Honest inquiry without exaggeration or unsupported claims.",
    ar: "استقصاء صادق بلا مبالغة ولا ادّعاءات غير موثّقة.",
  },
  "about.value.bridge": {
    en: "Connection",
    ar: "الوصل",
  },
  "about.value.bridgeBody": {
    en: "Pathways that connect cultures and languages through Arabic and English.",
    ar: "مسارات تصل بين الثقافات واللغات عبر العربية والإنجليزية.",
  },
  "about.domainsEyebrow": { en: "Inquiry", ar: "مجالات الاهتمام" },
  "about.domainsTitle": {
    en: "Fields of inquiry",
    ar: "مجالات الاهتمام",
  },
  "about.domainsBody": {
    en: "Our programmes bring together research, reflection, and lived human experience around metaphysics, consciousness, and spiritual inquiry.",
    ar: "تجمع برامجنا بين البحث والتأمّل والتجربة الإنسانية حول الميتافيزيقا والوعي والاستقصاء الروحي.",
  },
  "about.domain.metaphysics": {
    en: "Metaphysical thought",
    ar: "الفكر الميتافيزيقي",
  },
  "about.domain.consciousness": {
    en: "Human consciousness",
    ar: "الوعي الإنساني",
  },
  "about.domain.dialogue": {
    en: "Philosophy and spiritual inquiry",
    ar: "الفلسفة والاستقصاء الروحي",
  },
  "about.domain.languages": {
    en: "Arabic and English learning pathways",
    ar: "مسارات تعلّم بالعربية والإنجليزية",
  },
  "about.missionBody1": {
    en: "To make serious ideas clear and accessible, and to open a space for dialogue between philosophy, consciousness studies, and spiritual inquiry.",
    ar: "تقديم معرفة جادة وواضحة، وفتح مساحة للحوار بين الفكر الفلسفي ودراسات الوعي والتجربة الروحية.",
  },
  "about.missionBody2": {
    en: "An international institution that joins careful thought with the depth of human questioning, connecting cultures and languages without exaggeration or unsupported claims.",
    ar: "مؤسسة معرفية دولية تجمع بين التأمّل المتأني وعمق السؤال الإنساني، وتصل بين الثقافات واللغات دون مبالغة أو ادّعاءات غير موثّقة.",
  },
  "about.founderEyebrow": {
    en: "Founder & Director",
    ar: "المؤسس والمدير",
  },
  "about.founderTitle": {
    en: "Meet the founder",
    ar: "تعرّف على المؤسس",
  },
  "about.founderCta": {
    en: "Read the biography",
    ar: "اقرأ السيرة",
  },

  "founder.eyebrow": {
    en: "Founder & Director",
    ar: "المؤسس والمدير",
  },
  "founder.institutionalNote": {
    en: "An intellectual and institutional journey devoted to metaphysics, consciousness, and responsible dialogue.",
    ar: "مسيرة فكرية ومؤسسية مكرّسة للميتافيزيقا والوعي والحوار المسؤول.",
  },
  "founder.tocLabel": {
    en: "On this page",
    ar: "في هذه الصفحة",
  },
  "founder.cta.biography": {
    en: "Read the biography",
    ar: "اقرأ السيرة",
  },
  "founder.cta.works": {
    en: "Selected works",
    ar: "مؤلفات مختارة",
  },
  "founder.cta.library": {
    en: "Visit the digital library",
    ar: "زيارة المكتبة الرقمية",
  },
  "founder.backToAbout": {
    en: "Back to About the Institute",
    ar: "العودة إلى عن المؤسسة",
  },
  "founder.section.presentation": {
    en: "Presentation",
    ar: "تقديم",
  },
  "founder.section.responsibilities": {
    en: "Institutional responsibilities",
    ar: "المسؤوليات المؤسسية",
  },
  "founder.section.research": {
    en: "Research and vision",
    ar: "البحث والرؤية",
  },
  "founder.section.landmarks": {
    en: "Biographical landmarks",
    ar: "محطات من السيرة",
  },
  "founder.section.bibliography": {
    en: "Selected works",
    ar: "مؤلفات مختارة",
  },
  "founder.section.intellectual": {
    en: "Intellectual and Sufi works",
    ar: "المؤلفات الفكرية والصوفية",
  },
  "founder.section.poetry": {
    en: "Poetic works",
    ar: "المؤلفات الشعرية",
  },
  "founder.section.translations": {
    en: "Translations and international dimension",
    ar: "الترجمات والبُعد العالمي",
  },
  "founder.worksNote": {
    en: "Titles listed as provided by Avatar Institut. Official Amazon KDP links will be added when available.",
    ar: "العناوين كما قدّمتها مؤسسة الأفاتار. ستُضاف روابط أمازون KDP الرسمية عند توفرها.",
  },
  "founder.externalPending": {
    en: "External reference pending",
    ar: "المرجع الخارجي قيد الإضافة",
  },

  "library.eyebrow": {
    en: "Public resources",
    ar: "موارد عامة",
  },
  "library.title": {
    en: "Digital Library",
    ar: "المكتبة الرقمية",
  },
  "library.subtitle": {
    en: "Explore books, videos and research selected by Avatar Institut.",
    ar: "اكتشف كتبًا وفيديوهات وأبحاثًا مختارة من مؤسسة الأفاتار.",
  },
  "library.filtersLabel": {
    en: "Library filters",
    ar: "مرشحات المكتبة",
  },
  "library.filter.all": { en: "All", ar: "الكل" },
  "library.filter.videos": { en: "Videos", ar: "الفيديوهات" },
  "library.filter.books": { en: "Books", ar: "الكتب" },
  "library.filter.research": { en: "Research", ar: "الأبحاث" },
  "library.filter.podcasts": { en: "Podcasts", ar: "البودكاست" },
  "library.filter.free": { en: "Free resources", ar: "موارد مجانية" },
  "library.searchLabel": {
    en: "Search the digital library",
    ar: "ابحث في المكتبة الرقمية",
  },
  "library.searchPlaceholder": {
    en: "Search by title, author or category",
    ar: "ابحث حسب العنوان أو المؤلف أو الفئة",
  },
  "library.category": { en: "Category", ar: "الفئة" },
  "library.language": { en: "Language", ar: "اللغة" },
  "library.featured": { en: "Featured", ar: "مختار" },
  "library.emptyTitle": {
    en: "Our first selection of books, videos and research is being prepared.",
    ar: "نعمل حاليًا على إعداد أول مجموعة مختارة من الكتب والفيديوهات والأبحاث.",
  },
  "library.emptyBody": {
    en: "Please return soon to discover Avatar Institut's first public collection.",
    ar: "يرجى العودة قريبًا لاكتشاف أول مجموعة عامة من مؤسسة الأفاتار.",
  },
  "library.noResultsTitle": {
    en: "No resources match your current search.",
    ar: "لا توجد موارد تطابق البحث الحالي.",
  },
  "library.noResultsBody": {
    en: "Try another keyword or choose a different filter.",
    ar: "جرّب كلمة أخرى أو اختر مرشحًا مختلفًا.",
  },

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
    en: "Your course has been added to My courses",
    ar: "تمت إضافة دورتك إلى دوراتي",
  },
  "cart.successDelayed": {
    en: "Your payment was received. We are still confirming access and will update this page automatically.",
    ar: "تم استلام دفعتك. ما زلنا نؤكد الوصول وسنحدّث هذه الصفحة تلقائيًا.",
  },
  "cart.successGoCourses": {
    en: "Go to My courses",
    ar: "الانتقال إلى دوراتي",
  },
  "cart.successStartCourse": {
    en: "Open my course",
    ar: "افتح دورتي",
  },
  "cart.successOpenCourse": {
    en: "Open my course",
    ar: "افتح دورتي",
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
