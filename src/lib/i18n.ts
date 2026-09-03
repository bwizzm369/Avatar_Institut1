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

/**
 * Course/catalogue display: use the requested locale, then the other language.
 * Does not invent a translation.
 */
export function displayLocalized(
  value: LocalizedString,
  locale: Locale,
): string {
  const primary = (value[locale] ?? "").trim();
  if (primary) return primary;
  const other: Locale = locale === "en" ? "ar" : "en";
  return (value[other] ?? "").trim();
}

export function hasLocalizedTitle(value: LocalizedString): boolean {
  return Boolean((value.en ?? "").trim() || (value.ar ?? "").trim());
}

type Dictionary = Record<string, LocalizedString>;

export const messages: Dictionary = {
  "nav.home": { en: "Home", ar: "الرئيسية" },
  "nav.about": { en: "About", ar: "عن المعهد" },
  "nav.founder": { en: "Founder", ar: "المؤسس" },
  "nav.courses": { en: "Courses", ar: "الدورات" },
  "nav.library": { en: "Library", ar: "المكتبة" },
  "nav.consultation": { en: "Consultation", ar: "استشارة" },
  "nav.reviews": { en: "Reviews", ar: "الآراء" },
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
  "brand.arabicName": { en: "معهد الأفاتار", ar: "معهد الأفاتار" },
  "brand.logoAlt": {
    en: "Official Avatar Institut logo: circle with a center point, Avatar Institut für Metaphysik GmbH",
    ar: "الشعار الرسمي لمعهد الأفاتار: دائرة بنقطة مركزية، Avatar Institut für Metaphysik GmbH",
  },

  "home.eyebrow": {
    en: "Online Institute",
    ar: "معهد إلكتروني",
  },
  "home.title": {
    en: "Avatar Institut for\nConsciousness &\nMetaphysical Studies",
    ar: "معهد الأفاتار\nلدراسات الوعي\nوالميتافيزيقا",
  },
  "home.subtitle": {
    en: "An international online institute dedicated to philosophy,\nconsciousness studies,\nand structured learning in Arabic and English.",
    ar: "معهد دولي للتعليم عبر الإنترنت مكرّس للفلسفة،\nودراسات الوعي،\nوالتعلم المنظّم بالعربية والإنجليزية.",
  },
  "home.ctaCourses": { en: "Explore Courses", ar: "استكشف الدورات" },
  "home.ctaLibrary": { en: "Digital Library", ar: "المكتبة الرقمية" },
  "home.ctaConsultation": { en: "Request a consultation", ar: "اطلب استشارة" },
  "home.ctaAbout": { en: "Our mission", ar: "رسالتنا" },
  "home.ctaFounder": {
    en: "Meet our founder",
    ar: "تعرّف على المؤسس",
  },
  "home.aboutEyebrow": { en: "About Avatar Institut", ar: "عن معهد الأفاتار" },
  "home.aboutTitle": { en: "Bridging Science and Spirit", ar: "جسر بين العلم والروح" },
  "home.aboutBody1": {
    en: "Avatar Institut für Metaphysik GmbH is an international academy dedicated to advancing the study of metaphysics, consciousness, and human development.",
    ar: "معهد الأفاتار للميتافيزيقا هو أكاديمية دولية مكرّسة لتطوير دراسة الميتافيزيقا والوعي والتنمية البشرية.",
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
    ar: "فهم تأمّلي يجمع الفكر الميتافيزيقي بالبصيرة الروحية، كما يُنمّيه معهد الأفاتار.",
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
  "home.value.transformation": { en: "Transformation", ar: "التحوّل" },
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
    ar: "استكشف كتالوج دورات معهد الأفاتار وابدأ رحلتك التعليمية.",
  },
  "connect.eyebrow": {
    en: "Official Channels",
    ar: "القنوات الرسمية",
  },
  "connect.title": {
    en: "Connect with Us",
    ar: "تواصل معنا",
  },
  "connect.description": {
    en: "Stay connected with Avatar Institut through our official channels.",
    ar: "ابقَ على تواصل مع معهد الأفاتار عبر قنواتنا الرسمية.",
  },
  "connect.open": {
    en: "Open",
    ar: "افتح",
  },

  "consultation.eyebrow": { en: "Guidance", ar: "إرشاد" },
  "consultation.title": {
    en: "Consultation & Information",
    ar: "استشارة ومعلومات",
  },
  "consultation.lead": {
    en: "Request a private consultation or ask about our programmes. The institute team reviews each message and replies by email.",
    ar: "اطلب استشارة خاصة أو استعلم عن برامجنا. يراجع فريق المعهد كل رسالة ويرد عبر البريد الإلكتروني.",
  },
  "consultation.type": { en: "Request type", ar: "نوع الطلب" },
  "consultation.typePlaceholder": { en: "Choose a type", ar: "اختر النوع" },
  "consultation.type.consultation": {
    en: "Private consultation",
    ar: "استشارة خاصة",
  },
  "consultation.type.information": { en: "Information request", ar: "طلب معلومات" },
  "consultation.fullName": { en: "Full name", ar: "الاسم الكامل" },
  "consultation.email": { en: "Email", ar: "البريد الإلكتروني" },
  "consultation.phone": { en: "Phone (optional)", ar: "الهاتف (اختياري)" },
  "consultation.message": { en: "Message", ar: "الرسالة" },
  "consultation.consent": {
    en: "I agree to be contacted about this request. My details are used only to reply and are not published.",
    ar: "أوافق على التواصل معي بخصوص هذا الطلب. تُستخدم بياناتي للرد فقط ولا تُنشر.",
  },
  "consultation.submit": { en: "Send request", ar: "إرسال الطلب" },
  "consultation.submitting": { en: "Sending…", ar: "جارٍ الإرسال…" },
  "consultation.success": {
    en: "Thank you. Your request has been received. We will reply by email.",
    ar: "شكرًا لك. تم استلام طلبك، وسنرد عبر البريد الإلكتروني.",
  },
  "consultation.error": {
    en: "Unable to send your request. Please try again.",
    ar: "تعذّر إرسال طلبك. يُرجى المحاولة مرة أخرى.",
  },
  "consultation.configMissing": {
    en: "The request form is not connected yet. Please try again later.",
    ar: "نموذج الطلب غير متصل حاليًا. يُرجى المحاولة لاحقًا.",
  },
  "consultation.validationFailed": {
    en: "Please complete the required fields.",
    ar: "يُرجى إكمال الحقول المطلوبة.",
  },
  "consultation.error.required": { en: "This field is required.", ar: "هذا الحقل مطلوب." },
  "consultation.error.emailInvalid": {
    en: "Enter a valid email address.",
    ar: "أدخل بريدًا إلكترونيًا صالحًا.",
  },
  "consultation.error.tooShort": {
    en: "Please write a little more so we can help you.",
    ar: "يُرجى كتابة المزيد حتى نتمكّن من مساعدتك.",
  },
  "consultation.error.tooLong": { en: "This field is too long.", ar: "هذا الحقل طويل جدًا." },

  "reviews.eyebrow": { en: "Student voices", ar: "أصوات الطلاب" },
  "reviews.title": { en: "Testimonials", ar: "آراء الطلاب" },
  "reviews.lead": {
    en: "Reflections shared by students of Avatar Institut, published with care.",
    ar: "آراء يشاركها طلاب معهد الأفاتار، وتُنشر بعناية.",
  },
  "reviews.empty": {
    en: "No published testimonials yet.",
    ar: "لا توجد آراء منشورة حاليًا.",
  },
  "reviews.viewAll": { en: "All testimonials", ar: "جميع الآراء" },
  "reviews.form.title": { en: "Share your review", ar: "شارك رأيك" },
  "reviews.form.lead": {
    en: "Tell us about your experience. Your name is taken from your student profile, and your review appears after the institute has reviewed it.",
    ar: "حدّثنا عن تجربتك. يُؤخذ اسمك من ملفك الدراسي، ويظهر رأيك بعد مراجعته من المعهد.",
  },
  "reviews.form.as": { en: "Submitting as {name}", ar: "الإرسال باسم {name}" },
  "reviews.form.rating": { en: "Rating", ar: "التقييم" },
  "reviews.form.ratingStar": { en: "{n} out of 5", ar: "{n} من 5" },
  "reviews.form.text": { en: "Your review", ar: "رأيك" },
  "reviews.form.submit": { en: "Submit review", ar: "إرسال الرأي" },
  "reviews.form.submitting": { en: "Sending…", ar: "جارٍ الإرسال…" },
  "reviews.form.success": {
    en: "Thank you for sharing your review. It will appear after it has been reviewed by Avatar Institut.",
    ar: "شكرًا لمشاركتك رأيك. سيظهر بعد مراجعته من قِبل معهد الأفاتار.",
  },
  "reviews.form.loginTitle": {
    en: "Share a review",
    ar: "شارك رأيك",
  },
  "reviews.form.loginBody": {
    en: "Sign in with your student account to leave a review.",
    ar: "سجّل الدخول بحسابك الدراسي لترك رأيك.",
  },
  "reviews.form.loginCta": { en: "Log in to share a review", ar: "تسجيل الدخول لمشاركة رأيك" },
  "reviews.status.pendingTitle": {
    en: "Thank you for your review",
    ar: "شكرًا لمشاركتك رأيك",
  },
  "reviews.status.pendingBody": {
    en: "Thank you for sharing your review. It will appear after it has been reviewed by Avatar Institut.",
    ar: "شكرًا لمشاركتك رأيك. سيظهر بعد مراجعته من قِبل معهد الأفاتار.",
  },
  "reviews.status.approvedTitle": {
    en: "Your review is published",
    ar: "تم نشر رأيك",
  },
  "reviews.status.approvedBody": {
    en: "Your review is now visible on this page.",
    ar: "رأيك ظاهر الآن في هذه الصفحة.",
  },
  "reviews.status.rejectedTitle": {
    en: "Your review was not published",
    ar: "لم يُنشر رأيك",
  },
  "reviews.status.rejectedBody": {
    en: "Thank you for writing to us. The institute has not published this review.",
    ar: "شكرًا لك. لم ينشر المعهد هذا الرأي.",
  },
  "reviews.error.ratingRequired": {
    en: "Please choose a rating from 1 to 5.",
    ar: "يُرجى اختيار تقييم من 1 إلى 5.",
  },
  "reviews.error.textRequired": {
    en: "Please write your review.",
    ar: "يُرجى كتابة رأيك.",
  },
  "reviews.error.tooLong": {
    en: "Your review is too long.",
    ar: "رأيك طويل جدًا.",
  },
  "reviews.error.alreadySubmitted": {
    en: "You have already submitted a review with this account.",
    ar: "لقد أرسلت رأيًا مسبقًا بهذا الحساب.",
  },
  "reviews.error.unauthenticated": {
    en: "Please log in to share a review.",
    ar: "يُرجى تسجيل الدخول لمشاركة رأيك.",
  },
  "reviews.error.failed": {
    en: "We could not save your review. Please try again.",
    ar: "تعذّر حفظ رأيك. يُرجى المحاولة مرة أخرى.",
  },
  "reviews.ratingAria": { en: "{n} out of 5 stars", ar: "{n} من 5 نجوم" },

  "courses.eyebrow": { en: "Learning pathways", ar: "مسارات التعلم" },
  "courses.title": { en: "Course catalogue", ar: "كتالوج الدورات" },
  "courses.intro": {
    en: "Explore the Avatar Institut programmes currently open for enrolment.",
    ar: "استكشف برامج معهد الأفاتار المتاحة للتسجيل حاليًا.",
  },
  "courses.empty": {
    en: "No published programmes are available yet.",
    ar: "لا توجد برامج منشورة متاحة حاليًا.",
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
  "courses.passIncludedShort": {
    en: "Included with Student Pass",
    ar: "مشمول ضمن Student Pass",
  },
  "courses.passIncludedMember": {
    en: "Included with your Student Pass",
    ar: "مشمول ضمن عضويتك في Student Pass",
  },
  "courses.normalPrice": {
    en: "Normal price:",
    ar: "السعر العادي:",
  },
  "courses.passPrice": {
    en: "Student Pass price:",
    ar: "سعر Student Pass:",
  },
  "courses.passSave": {
    en: "Save {n}%",
    ar: "وفّر {n}%",
  },
  "courses.passBenefitDiscount": {
    en: "Student Pass: {n}% off",
    ar: "Student Pass: خصم {n}٪",
  },
  "courses.passDigitalMembership": {
    en: "Digital Membership",
    ar: "العضوية الرقمية",
  },
  "courses.startCourse": {
    en: "Start course",
    ar: "ابدأ الدورة",
  },
  "courses.continueCourse": {
    en: "Continue course",
    ar: "متابعة الدورة",
  },

  "about.eyebrow": {
    en: "About the Institute",
    ar: "عن المعهد",
  },
  "about.title": {
    en: "About Avatar Institut",
    ar: "نبذة عن المعهد",
  },
  "about.overviewTitle": {
    en: "About Avatar Institut",
    ar: "نبذة عن المعهد",
  },
  "about.overviewBody1": {
    en: "Avatar Institut is an international institute dedicated to the study of Metaphysical Sciences. Its mission is to develop a balanced scientific and intellectual perspective on the relationship between human beings, consciousness, and the universe by bringing together physics, philosophy, Sufism, consciousness studies, parapsychology, and metaphysics within an academic framework based on research, analysis, and scholarly inquiry.",
    ar: "الأفاتار (AVATAR) هو معهد عالمي متخصص في علوم الميتافيزيقا، يهدف إلى بناء رؤية علمية وفكرية متوازنة تستكشف العلاقة بين الإنسان والكون والوعي، من خلال الجمع بين الفيزياء، والفلسفة، والتصوف، ودراسات الوعي، والعلوم الباراسيكولوجية، والميتافيزيقا، ضمن منهج أكاديمي يقوم على البحث والتحليل والدراسة.",
  },
  "about.overviewBody2": {
    en: "The Institute believes that genuine knowledge does not emerge from separating disciplines, but from meaningful dialogue between them. It therefore seeks to develop an interdisciplinary model that brings together the natural sciences, the humanities, and spiritual knowledge, opening new pathways toward a deeper understanding of existence and the human being.",
    ar: "ويؤمن المعهد بأن المعرفة الحقيقية لا تنشأ من الفصل بين العلوم، بل من الحوار العميق بينها، لذلك يسعى إلى تقديم نموذج معرفي يجمع بين العلوم الطبيعية والعلوم الإنسانية والروحية، بما يفتح آفاقاً جديدة لفهم الوجود والإنسان.",
  },
  "about.subnavLabel": { en: "About sections", ar: "أقسام عن المعهد" },
  "about.tab.institute": {
    en: "About the Institute",
    ar: "عن المعهد",
  },
  "about.tab.founder": {
    en: "Founder",
    ar: "المؤسس",
  },
  "about.missionTitle": {
    en: "Our Mission",
    ar: "رسالتنا",
  },
  "about.missionBody": {
    en: "To establish the world’s first international academic reference dedicated to Metaphysical Sciences by producing knowledge, publishing research, developing academic courses, and preparing researchers and learners through a rigorous methodology that combines intellectual depth with scientific openness.",
    ar: "تأسيس أول مرجعية أكاديمية عالمية متخصصة في علوم الميتافيزيقا، تُعنى بإنتاج المعرفة، ونشر الأبحاث، وإعداد الدورات العلمية، وتأهيل الباحثين والمهتمين بهذا المجال وفق منهجية رصينة تجمع بين العمق الفكري والانفتاح العلمي.",
  },
  "about.visionTitle": {
    en: "Our Vision",
    ar: "رؤيتنا",
  },
  "about.visionBody": {
    en: "To make AVATAR the leading international reference in Metaphysical Sciences and a global platform bringing together scientists, researchers, thinkers, and learners from diverse cultures to contribute to a deeper understanding of consciousness, humanity, and the universe.",
    ar: "أن يصبح AVATAR المرجع الدولي الأول في علوم الميتافيزيقا، ومنصة عالمية تجمع العلماء والباحثين والمفكرين والمهتمين من مختلف الثقافات، للمساهمة في تطوير فهم أعمق للوعي والإنسان والكون.",
  },
  "about.areasTitle": {
    en: "Areas of Interest",
    ar: "مجالات اهتمامنا",
  },
  "about.area.1": {
    en: "Metaphysics and the philosophy of existence.",
    ar: "الميتافيزيقا وفلسفة الوجود.",
  },
  "about.area.2": {
    en: "The relationship between physics and metaphysics.",
    ar: "العلاقة بين الفيزياء والميتافيزيقا.",
  },
  "about.area.3": {
    en: "Sufism and the philosophy of spiritual knowledge.",
    ar: "التصوف وفلسفة المعرفة الروحية.",
  },
  "about.area.4": {
    en: "Consciousness and perception studies.",
    ar: "دراسات الوعي والإدراك.",
  },
  "about.area.5": {
    en: "Parapsychology and anomalous phenomena.",
    ar: "العلوم الباراسيكولوجية والظواهر غير الاعتيادية.",
  },
  "about.area.6": {
    en: "Symbols, language, and universal meanings.",
    ar: "الرموز واللغة والمعاني الكونية.",
  },
  "about.area.7": {
    en: "Human intellectual and spiritual development.",
    ar: "الإنسان وتطوره الفكري والروحي.",
  },
  "about.area.8": {
    en: "Interdisciplinary research and studies.",
    ar: "الأبحاث والدراسات متعددة التخصصات.",
  },
  "about.offerTitle": {
    en: "What We Offer",
    ar: "ماذا نقدم؟",
  },
  "about.offer.1": {
    en: "Specialized academic programmes and courses.",
    ar: "برامج ودورات أكاديمية متخصصة.",
  },
  "about.offer.2": {
    en: "A scientific library of books, studies, and research.",
    ar: "مكتبة علمية تضم الكتب والدراسات والأبحاث.",
  },
  "about.offer.3": {
    en: "Lectures, seminars, and academic conferences.",
    ar: "محاضرات وندوات ومؤتمرات علمية.",
  },
  "about.offer.4": {
    en: "International research and collaborative projects.",
    ar: "مشاريع بحثية وتعاونية دولية.",
  },
  "about.offer.5": {
    en: "Academic certificates and authorizations for approved programmes.",
    ar: "شهادات وإجازات علمية في البرامج المعتمدة.",
  },
  "about.offer.6": {
    en: "A global knowledge community bringing together researchers and people interested in metaphysics.",
    ar: "مجتمع معرفي عالمي يجمع الباحثين والمهتمين بالميتافيزيقا.",
  },
  "about.messageTitle": {
    en: "The Avatar Message",
    ar: "رسالة AVATAR",
  },
  "about.messageBody1": {
    en: "We are not an institution for imposing ideas, but a space for research, a platform for dialogue, and a bridge connecting scientific knowledge, philosophical reflection, and human experience.",
    ar: "لسنا مؤسسة لتلقين الأفكار، بل فضاء للبحث، ومنصة للحوار، وجسر يصل بين المعرفة العلمية والتأمل الفلسفي والخبرة الإنسانية.",
  },
  "about.messageBody2": {
    en: "We believe that self-discovery is the first step toward understanding the universe, and that every genuine form of knowledge begins with a profound question, continues through research, matures through evidence, and remains open to new horizons.",
    ar: "نؤمن بأن اكتشاف الإنسان لذاته هو الخطوة الأولى لفهم الكون، وأن كل معرفة حقيقية تبدأ بسؤال عميق، وتستمر بالبحث، وتنضج بالدليل، وتبقى منفتحة على آفاق جديدة.",
  },
  "about.founderCta": {
    en: "Read the biography",
    ar: "اقرأ السيرة",
  },

  "founder.eyebrow": {
    en: "The Founder",
    ar: "المؤسس",
  },
  "founder.institutionalNote": {
    en: "Institutional biography provided by Avatar Institut. Biographical statements are presented as supplied and are not independent scientific verification.",
    ar: "سيرة مؤسسية قدّمها معهد الأفاتار. تُعرض الإفادات البيوغرافية كما وردت، وليست تحققًا علميًا مستقلًا.",
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
    ar: "العودة إلى صفحة عن المعهد",
  },
  "founder.section.biography": {
    en: "Biography",
    ar: "السيرة الذاتية",
  },
  "founder.section.presentation": {
    en: "Biography",
    ar: "السيرة الذاتية",
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
    en: "Intellectual and Sufi Works",
    ar: "المؤلفات الفكرية والصوفية",
  },
  "founder.section.poetry": {
    en: "Poetry",
    ar: "المؤلفات الشعرية",
  },
  "founder.section.translations": {
    en: "Translations and International Reach",
    ar: "الترجمات والبُعد العالمي",
  },
  "founder.worksNote": {
    en: "Titles listed as provided by Avatar Institut. Official Amazon KDP links will be added when available.",
    ar: "العناوين كما قدّمها معهد الأفاتار. ستُضاف روابط أمازون KDP الرسمية عند توفرها.",
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
    ar: "اكتشف كتبًا وفيديوهات وأبحاثًا مختارة من معهد الأفاتار.",
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
    en: "Please check back soon to discover Avatar Institut's first public collection.",
    ar: "يُرجى العودة قريبًا لاكتشاف أول مجموعة عامة من معهد الأفاتار.",
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
  "cart.loading": { en: "Loading cart…", ar: "جارٍ تحميل السلة…" },
  "cart.browse": { en: "Browse courses", ar: "تصفح الدورات" },
  "cart.remove": { en: "Remove", ar: "إزالة" },
  "cart.total": { en: "Total", ar: "المجموع" },
  "cart.checkout": { en: "Proceed to payment", ar: "متابعة الدفع" },
  "cart.checkoutLoading": {
    en: "Redirecting to Stripe…",
    ar: "جارٍ التحويل إلى Stripe…",
  },
  "cart.checkoutLoginRequired": {
    en: "Sign in to pay",
    ar: "سجّل الدخول للدفع",
  },
  "cart.checkoutConfigMissing": {
    en: "Secure checkout is temporarily unavailable. Please try again later.",
    ar: "الدفع الآمن غير متاح مؤقتًا. يُرجى المحاولة لاحقًا.",
  },
  "cart.checkoutError": {
    en: "Could not start checkout. Please try again.",
    ar: "تعذّر بدء الدفع. يُرجى المحاولة مرة أخرى.",
  },
  "cart.checkoutIncludedWithPass": {
    en: "This course is included with your Student Pass. Opening your course…",
    ar: "هذه الدورة مشمولة ضمن عضويتك في Student Pass. جارٍ فتح دورتك…",
  },
  "cart.checkoutZeroAmount": {
    en: "This Student Pass discount brings the price to zero. Please contact the academy or use an included course.",
    ar: "تخفيض Student Pass يجعل السعر صفرًا. يُرجى التواصل مع المعهد أو استخدام دورة مشمولة.",
  },
  "cart.checkoutPriceRejected": {
    en: "Checkout amounts are set securely by the academy. Please try again.",
    ar: "تُحدَّد مبالغ الدفع بأمان من الأكاديمية. يُرجى المحاولة مرة أخرى.",
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
    ar: "تمت إضافة دورتك إلى «دوراتي»",
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
  "auth.showPassword": { en: "Show password", ar: "إظهار كلمة المرور" },
  "auth.hidePassword": { en: "Hide password", ar: "إخفاء كلمة المرور" },
  "auth.firstName": { en: "First name", ar: "الاسم الأول" },
  "auth.lastName": { en: "Last name", ar: "اسم العائلة" },
  "auth.submitLogin": { en: "Log in", ar: "تسجيل الدخول" },
  "auth.submitSignup": { en: "Sign up", ar: "إنشاء حساب" },
  "auth.submitting": { en: "Please wait…", ar: "يُرجى الانتظار…" },
  "auth.noAccount": { en: "No account yet?", ar: "ليس لديك حساب؟" },
  "auth.hasAccount": { en: "Already have an account?", ar: "لديك حساب بالفعل؟" },
  "auth.configMissing": {
    en: "Sign-in is temporarily unavailable. Please try again later.",
    ar: "تسجيل الدخول غير متاح مؤقتًا. يُرجى المحاولة لاحقًا.",
  },
  "auth.connectedNotice": {
    en: "Sign in with your Avatar Institut account. Course access appears under My courses after payment is confirmed.",
    ar: "سجّل الدخول بحساب معهد الأفاتار. يظهر الوصول إلى الدورات ضمن «دوراتي» بعد تأكيد الدفع.",
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
    ar: "يُرجى تأكيد بريدك الإلكتروني قبل تسجيل الدخول. تحقق من صندوق الوارد لرابط التأكيد.",
  },
  "auth.networkError": {
    en: "Network error. Check your connection and try again.",
    ar: "خطأ في الشبكة. تحقق من اتصالك وحاول مرة أخرى.",
  },
  "auth.logoutFailed": {
    en: "Could not sign out. Please try again.",
    ar: "تعذّر تسجيل الخروج. يُرجى المحاولة مرة أخرى.",
  },
  "auth.signupFailed": {
    en: "Could not create the account. Please try again.",
    ar: "تعذّر إنشاء الحساب. يُرجى المحاولة مرة أخرى.",
  },
  "auth.accountExists": {
    en: "An account already exists for this email. Please log in.",
    ar: "يوجد حساب مرتبط بهذا البريد الإلكتروني. يُرجى تسجيل الدخول.",
  },
  "auth.phone": {
    en: "WhatsApp / Phone",
    ar: "رقم الهاتف أو واتساب",
  },
  "auth.country": { en: "Country", ar: "البلد" },
  "auth.preferredLanguage": {
    en: "Preferred language",
    ar: "اللغة المفضلة",
  },
  "auth.language.ar": { en: "Arabic", ar: "العربية" },
  "auth.language.en": { en: "English", ar: "الإنجليزية" },
  "auth.section.identity": { en: "Identity", ar: "الهوية" },
  "auth.section.contact": { en: "Contact", ar: "التواصل" },
  "auth.section.account": { en: "Account", ar: "الحساب" },
  "auth.section.language": { en: "Language", ar: "اللغة" },
  "auth.section.history": {
    en: "Avatar history",
    ar: "السجل في معهد الأفاتار",
  },
  "auth.previouslyStudied": {
    en: "Have you previously studied at Avatar Institut?",
    ar: "هل سبق لك الدراسة في معهد الأفاتار؟",
  },
  "auth.previouslyStudiedYes": { en: "Yes", ar: "نعم" },
  "auth.previouslyStudiedNo": { en: "No", ar: "لا" },
  "auth.previousCourse": {
    en: "Course previously attended",
    ar: "الدورة التي سبق حضورها",
  },
  "auth.certificateNumberOptional": {
    en: "Certificate number, if available",
    ar: "رقم الشهادة، إن وُجد",
  },
  "auth.validationFailed": {
    en: "Please correct the highlighted fields.",
    ar: "يُرجى تصحيح الحقول المميزة.",
  },
  "auth.callbackFailed": {
    en: "Sign-in could not be completed. Please try again.",
    ar: "تعذّر إكمال تسجيل الدخول. يُرجى المحاولة مرة أخرى.",
  },
  "auth.error.required": { en: "This field is required.", ar: "هذا الحقل مطلوب." },
  "auth.error.emailInvalid": {
    en: "Enter a valid email address.",
    ar: "أدخل بريدًا إلكترونيًا صالحًا.",
  },
  "auth.error.tooLong": {
    en: "This value is too long.",
    ar: "هذه القيمة طويلة جدًا.",
  },
  "auth.error.passwordShort": {
    en: "Password must be at least 8 characters.",
    ar: "يجب أن تكون كلمة المرور 8 أحرف على الأقل.",
  },
  "auth.forgotPassword": {
    en: "Forgot password?",
    ar: "نسيت كلمة المرور؟",
  },
  "auth.forgotTitle": {
    en: "Reset your password",
    ar: "إعادة تعيين كلمة المرور",
  },
  "auth.forgotNotice": {
    en: "Enter the email for your Avatar Institut account. If an account exists, a reset link will be sent.",
    ar: "أدخل البريد الإلكتروني لحساب معهد الأفاتار. إذا كان الحساب موجودًا، فسيتم إرسال رابط إعادة التعيين.",
  },
  "auth.sendResetLink": {
    en: "Send reset link",
    ar: "إرسال رابط إعادة التعيين",
  },
  "auth.resetSent": {
    en: "If an account exists for this email, a password reset link has been sent.",
    ar: "إذا كان هناك حساب مرتبط بهذا البريد الإلكتروني، فقد تم إرسال رابط لإعادة تعيين كلمة المرور.",
  },
  "auth.backToLogin": {
    en: "Back to log in",
    ar: "العودة إلى تسجيل الدخول",
  },
  "auth.updatePasswordTitle": {
    en: "Choose a new password",
    ar: "اختيار كلمة مرور جديدة",
  },
  "auth.updatePasswordNotice": {
    en: "Enter a new password, then confirm it to finish resetting your account.",
    ar: "أدخل كلمة مرور جديدة ثم أكّدها لإكمال إعادة تعيين الحساب.",
  },
  "auth.newPassword": {
    en: "New password",
    ar: "كلمة المرور الجديدة",
  },
  "auth.confirmPassword": {
    en: "Confirm password",
    ar: "تأكيد كلمة المرور",
  },
  "auth.confirmNewPassword": {
    en: "Confirm new password",
    ar: "تأكيد كلمة المرور الجديدة",
  },
  "auth.submitNewPassword": {
    en: "Update password",
    ar: "تحديث كلمة المرور",
  },
  "auth.resetSuccess": {
    en: "Your password has been updated. You can now log in.",
    ar: "تم تحديث كلمة المرور. يمكنك الآن تسجيل الدخول.",
  },
  "auth.resetInvalid": {
    en: "This reset link is invalid or has expired. Please request a new one.",
    ar: "رابط إعادة التعيين هذا غير صالح أو منتهٍ. يُرجى طلب رابط جديد.",
  },
  "auth.resetLinkExpired": {
    en: "This reset link is invalid or has expired. Please request a new one.",
    ar: "رابط إعادة التعيين هذا غير صالح أو منتهٍ. يُرجى طلب رابط جديد.",
  },
  "auth.resetUpdateFailed": {
    en: "Could not update the password. Request a new reset link and try again.",
    ar: "تعذّر تحديث كلمة المرور. اطلب رابطًا جديدًا وحاول مرة أخرى.",
  },
  "auth.error.passwordMismatch": {
    en: "Passwords do not match.",
    ar: "كلمتا المرور غير متطابقتين.",
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
    en: "Welcome to Avatar Institut.",
    ar: "مرحبًا بك في معهد الأفاتار.",
  },
  "dashboard.introPaid": {
    en: "Thank you for your payment. Welcome to Avatar Institut.",
    ar: "شكرًا لإتمام عملية الدفع. مرحبًا بك في معهد الأفاتار.",
  },
  "dashboard.overallProgress": {
    en: "Overall progress",
    ar: "التقدّم الإجمالي",
  },
  "dashboard.viewAll": { en: "View all", ar: "عرض الكل" },
  "dashboard.nav.overview": { en: "Overview", ar: "نظرة عامة" },
  "dashboard.nav.courses": { en: "My courses", ar: "دوراتي" },
  "dashboard.nav.studentPass": { en: "Student Pass", ar: "Student Pass" },
  "dashboard.nav.certificates": { en: "My certificates", ar: "شهاداتي" },
  "dashboard.coursesTitle": { en: "My courses", ar: "دوراتي" },
  "dashboard.coursesEmpty": {
    en: "No enrolments yet. Purchased courses appear here once access is ready.",
    ar: "لا توجد تسجيلات بعد. تظهر الدورات المشتراة هنا عندما يصبح الوصول جاهزًا.",
  },
  "dashboard.studentPassTitle": { en: "Student Pass", ar: "Student Pass" },
  "dashboard.studentPassMembership": {
    en: "Digital Membership",
    ar: "العضوية الرقمية",
  },
  "dashboard.studentPassMembershipBilingual": {
    en: "Digital Membership / العضوية الرقمية",
    ar: "العضوية الرقمية / Digital Membership",
  },
  "dashboard.studentPassMaintains": {
    en: "Student Pass maintains your active member status within Avatar Institut.",
    ar: "يحافظ Student Pass على صفتك كعضو فعّال في معهد الأفاتار.",
  },
  "dashboard.studentPassNotice": {
    en: "Your Digital Membership card reflects your current Student Pass status.",
    ar: "تعكس بطاقة العضوية الرقمية حالة Student Pass الحالية.",
  },
  "dashboard.memberCardName": { en: "Full name", ar: "الاسم الكامل" },
  "dashboard.memberCardId": { en: "Member ID", ar: "رقم العضو" },
  "dashboard.memberCardStatus": { en: "Status", ar: "الحالة" },
  "dashboard.memberCardJoined": {
    en: "Membership date",
    ar: "تاريخ الانضمام",
  },
  "dashboard.memberCardPlan": { en: "Plan", ar: "الخطة" },
  "dashboard.memberCardValidUntil": {
    en: "Valid until",
    ar: "صالحة حتى",
  },
  "dashboard.memberCardActive": { en: "ACTIVE", ar: "ACTIVE" },
  "dashboard.memberCardInactive": { en: "INACTIVE", ar: "INACTIVE" },
  "dashboard.studentPassPlansTitle": {
    en: "Choose your plan",
    ar: "اختر خطتك",
  },
  "dashboard.studentPassPlanNameMonthly": {
    en: "Monthly",
    ar: "شهري",
  },
  "dashboard.studentPassPlanNameSemiannual": {
    en: "6 months",
    ar: "6 أشهر",
  },
  "dashboard.studentPassPlanNameAnnual": {
    en: "Annual",
    ar: "سنوي",
  },
  "dashboard.studentPassPlanAmountMonthly": { en: "12 €", ar: "12 €" },
  "dashboard.studentPassPlanAmountSemiannual": { en: "72 €", ar: "72 €" },
  "dashboard.studentPassPlanAmountAnnual": { en: "144 €", ar: "144 €" },
  "dashboard.studentPassPlanIntervalMonthly": {
    en: "per month",
    ar: "شهريًا",
  },
  "dashboard.studentPassPlanIntervalSemiannual": {
    en: "every 6 months",
    ar: "كل 6 أشهر",
  },
  "dashboard.studentPassPlanIntervalAnnual": {
    en: "per year",
    ar: "سنويًا",
  },
  "dashboard.studentPassChooseMonthly": {
    en: "Choose monthly",
    ar: "اختر الشهري",
  },
  "dashboard.studentPassChooseSemiannual": {
    en: "Choose 6 months",
    ar: "اختر 6 أشهر",
  },
  "dashboard.studentPassChooseAnnual": {
    en: "Choose annual",
    ar: "اختر السنوي",
  },
  "dashboard.studentPassSubscribeLoading": {
    en: "Redirecting to Stripe…",
    ar: "جارٍ التحويل إلى Stripe…",
  },
  "dashboard.studentPassCheckoutSuccess": {
    en: "Stripe has received your checkout. Your Digital Membership becomes ACTIVE when the subscription is confirmed — not from this page alone.",
    ar: "استلم Stripe عملية الدفع. تصبح العضوية الرقمية ACTIVE عندما يُؤكَّد الاشتراك — وليس من هذه الصفحة وحدها.",
  },
  "dashboard.studentPassCheckoutCancelled": {
    en: "Checkout was cancelled. Your Student Pass is unchanged.",
    ar: "تم إلغاء الدفع. لم تتغير حالة Student Pass.",
  },
  "dashboard.studentPassCheckoutError": {
    en: "We could not start Student Pass checkout. Please try again.",
    ar: "تعذّر بدء اشتراك Student Pass. يُرجى المحاولة مرة أخرى.",
  },
  "dashboard.studentPassAlreadyActive": {
    en: "Your Student Pass is already active.",
    ar: "Student Pass الخاص بك نشط بالفعل.",
  },
  "dashboard.certificatesTitle": { en: "My certificates", ar: "شهاداتي" },
  "dashboard.certificatesEmpty": {
    en: "No certificates have been issued to this account yet.",
    ar: "لم تُصدر أي شهادات لهذا الحساب بعد.",
  },
  "dashboard.certificateView": {
    en: "View verification",
    ar: "عرض التحقق",
  },
  "dashboard.certificateDownload": {
    en: "Download PDF",
    ar: "تحميل PDF",
  },
  "dashboard.certificateIssued": { en: "Issued", ar: "صادرة" },
  "dashboard.certificateRevoked": { en: "Revoked", ar: "ملغاة" },
  "verify.eyebrow": {
    en: "Official verification",
    ar: "تحقق رسمي",
  },
  "verify.valid": { en: "Certificate Valid", ar: "الشهادة صالحة" },
  "verify.revoked": { en: "Certificate Revoked", ar: "الشهادة ملغاة" },
  "verify.notFound": { en: "Certificate Not Found", ar: "الشهادة غير موجودة" },
  "verify.notFoundBody": {
    en: "No official Avatar Institut certificate matches this number.",
    ar: "لا توجد شهادة رسمية لمعهد الأفاتار بهذا الرقم.",
  },
  "verify.revokedBody": {
    en: "This certificate has been revoked and is no longer valid.",
    ar: "تم إلغاء هذه الشهادة ولم تعد صالحة.",
  },
  "verify.number": { en: "Certificate number", ar: "رقم الشهادة" },
  "verify.holder": { en: "Holder", ar: "حامل الشهادة" },
  "verify.course": { en: "Programme", ar: "البرنامج" },
  "verify.issuedAt": { en: "Date of issue", ar: "تاريخ الإصدار" },
  "verify.institute": {
    en: "Avatar Institut für Metaphysik GmbH",
    ar: "Avatar Institut für Metaphysik GmbH",
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
  "learning.markComplete": { en: "Mark as completed", ar: "وضع علامة الاكتمال" },
  "learning.markingComplete": { en: "Saving…", ar: "جارٍ الحفظ…" },
  "learning.alreadyCompleted": {
    en: "This lesson is marked as completed.",
    ar: "تم وضع علامة الاكتمال على هذا الدرس.",
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
    en: "Access denied. An active, payment-confirmed enrolment is required. A URL alone never unlocks a course.",
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
    ar: "معهد الأفاتار",
  },
  "learning.enrolledBadge": { en: "Enrolled", ar: "مسجّل" },
  "learning.sidebarLabel": { en: "Course summary", ar: "ملخص الدورة" },
  "learning.totalDuration": { en: "Total duration", ar: "المدة الإجمالية" },
  "learning.certificateStatus": {
    en: "Certificate",
    ar: "الشهادة",
  },
  "learning.certificateReady": {
    en: "Course complete — your official certificate is available in My certificates.",
    ar: "الدورة مكتملة — شهادتك الرسمية متاحة في شهاداتي.",
  },
  "learning.certificatePending": {
    en: "Complete all lessons to unlock certificate eligibility.",
    ar: "أكمل جميع الدروس لفتح أهلية الحصول على الشهادة.",
  },
  "learning.moduleLessonCount": {
    en: "{n} lessons",
    ar: "{n} دروس",
  },
  "learning.nextLesson": { en: "Next", ar: "التالي" },

  "footer.rights": {
    en: "© 2026 Avatar Institut für Metaphysik. All rights reserved.",
    ar: "© 2026 معهد الأفاتار للميتافيزيقا. جميع الحقوق محفوظة.",
  },
  "footer.tagline": {
    en: "Where Science Meets Consciousness",
    ar: "حيث يلتقي العلم بالوعي",
  },
  "footer.quickLinks": { en: "Quick links", ar: "روابط سريعة" },
  "footer.platform": { en: "Platform", ar: "المنصة" },
  "footer.aboutBody": {
    en: "Avatar Institut für Metaphysik GmbH advances consciousness studies and metaphysical education.",
    ar: "يعمل معهد الأفاتار للميتافيزيقا على تطوير دراسات الوعي والتعليم الميتافيزيقي.",
  },

  "notice.platformPhase": {
    en: "Avatar Institut — learning with care and clarity.",
    ar: "معهد الأفاتار — تعلّم بعناية ووضوح.",
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
