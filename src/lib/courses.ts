import type { Course } from "@/types";

/**
 * Three clearly identified demonstration courses.
 * Not a real catalogue — prices and content are placeholders for UI development.
 */
export const DEMO_COURSES: Course[] = [
  {
    id: "demo-course-metaphysics",
    slug: "foundations-of-metaphysics",
    title: {
      en: "Foundations of Metaphysics",
      ar: "أسس الميتافيزيقا",
    },
    summary: {
      en: "An introduction to metaphysical philosophy across Eastern and Western traditions. Demonstration course.",
      ar: "مقدمة في الفلسفة الميتافيزيقية عبر التقاليد الشرقية والغربية. دورة تجريبية.",
    },
    description: {
      en: "This demonstration programme explores ontology, epistemology, and the nature of existence. Content is sample material for platform testing only — not an active enrollment offering.",
      ar: "يستكشف هذا البرنامج التجريبي الأنطولوجيا ونظرية المعرفة وطبيعة الوجود. المحتوى نموذجي لاختبار المنصة فقط — وليس عرض تسجيل فعلي.",
    },
    priceCents: 9900,
    currency: "EUR",
    durationWeeks: 8,
    level: { en: "Beginner", ar: "مبتدئ" },
    isDemo: true,
    skills: {
      en: ["Philosophical frameworks", "Metaphysical inquiry", "Critical thinking"],
      ar: ["أطر فلسفية", "الاستقصاء الميتافيزيقي", "التفكير النقدي"],
    },
    modules: [
      {
        id: "meta-m1",
        title: { en: "What Is Metaphysics?", ar: "ما هي الميتافيزيقا؟" },
        order: 1,
        lessons: [
          {
            id: "meta-m1-l1",
            title: { en: "Origins and scope", ar: "الأصول والنطاق" },
            durationMinutes: 18,
            order: 1,
          },
          {
            id: "meta-m1-l2",
            title: { en: "Key questions of being", ar: "أسئلة الوجود الأساسية" },
            durationMinutes: 22,
            order: 2,
          },
        ],
      },
      {
        id: "meta-m2",
        title: { en: "East and West", ar: "الشرق والغرب" },
        order: 2,
        lessons: [
          {
            id: "meta-m2-l1",
            title: { en: "Comparative traditions", ar: "تقاليد مقارنة" },
            durationMinutes: 25,
            order: 1,
          },
        ],
      },
    ],
  },
  {
    id: "demo-course-consciousness",
    slug: "consciousness-exploration",
    title: {
      en: "Consciousness Exploration",
      ar: "استكشاف الوعي",
    },
    summary: {
      en: "Investigation into awareness, meditation, and consciousness science. Demonstration course.",
      ar: "بحث في الإدراك والتأمل وعلوم الوعي. دورة تجريبية.",
    },
    description: {
      en: "A demonstration curriculum covering neuroscience perspectives, contemplative practice, and self-inquiry. Sample content only — payment and enrollment are not connected yet.",
      ar: "منهج تجريبي يغطي منظورات علم الأعصاب والممارسة التأملية والاستقصاء الذاتي. محتوى نموذجي فقط — الدفع والتسجيل غير متصلين بعد.",
    },
    priceCents: 14900,
    currency: "EUR",
    durationWeeks: 12,
    level: { en: "Intermediate", ar: "متوسط" },
    isDemo: true,
    skills: {
      en: ["Meditation practice", "Consciousness science", "Self-inquiry"],
      ar: ["ممارسة التأمل", "علوم الوعي", "الاستقصاء الذاتي"],
    },
    modules: [
      {
        id: "con-m1",
        title: { en: "Maps of Awareness", ar: "خرائط الإدراك" },
        order: 1,
        lessons: [
          {
            id: "con-m1-l1",
            title: { en: "Attention and presence", ar: "الانتباه والحضور" },
            durationMinutes: 20,
            order: 1,
          },
          {
            id: "con-m1-l2",
            title: { en: "States and stages", ar: "الحالات والمراحل" },
            durationMinutes: 28,
            order: 2,
          },
        ],
      },
      {
        id: "con-m2",
        title: { en: "Practice Laboratory", ar: "مختبر الممارسة" },
        order: 2,
        lessons: [
          {
            id: "con-m2-l1",
            title: { en: "Guided inquiry", ar: "استقصاء موجّه" },
            durationMinutes: 30,
            order: 1,
          },
        ],
      },
    ],
  },
  {
    id: "demo-course-symbolism",
    slug: "sacred-symbolism",
    title: {
      en: "Sacred Symbolism",
      ar: "الرمزية المقدسة",
    },
    summary: {
      en: "Cross-cultural symbols and their spiritual significance. Demonstration course.",
      ar: "رموز عبر الثقافات ودلالاتها الروحية. دورة تجريبية.",
    },
    description: {
      en: "Explore universal symbolic languages found across cultures. This is demonstration material for the catalogue and cart flows — not a live programme.",
      ar: "استكشف لغات رمزية عالمية عبر الثقافات. هذه مادة تجريبية لتدفقات الكتالوج والسلة — وليست برنامجًا حيًا.",
    },
    priceCents: 7900,
    currency: "EUR",
    durationWeeks: 6,
    level: { en: "Beginner", ar: "مبتدئ" },
    isDemo: true,
    skills: {
      en: ["Symbol interpretation", "Cross-cultural wisdom", "Integrative meaning-making"],
      ar: ["تفسير الرموز", "حكمة عبر الثقافات", "صناعة المعنى التكاملي"],
    },
    modules: [
      {
        id: "sym-m1",
        title: { en: "Language of Symbols", ar: "لغة الرموز" },
        order: 1,
        lessons: [
          {
            id: "sym-m1-l1",
            title: { en: "Archetypes and signs", ar: "النماذج والرموز" },
            durationMinutes: 16,
            order: 1,
          },
          {
            id: "sym-m1-l2",
            title: { en: "Reading sacred geometry", ar: "قراءة الهندسة المقدسة" },
            durationMinutes: 24,
            order: 2,
          },
        ],
      },
    ],
  },
];

export function getAllCourses(): Course[] {
  return DEMO_COURSES;
}

export function getCourseBySlug(slug: string): Course | undefined {
  return DEMO_COURSES.find((course) => course.slug === slug);
}

export function formatPrice(
  priceCents: number,
  currency: Course["currency"],
  locale: "en" | "ar",
): string {
  const amount = priceCents / 100;
  return new Intl.NumberFormat(locale === "ar" ? "ar" : "en", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function countLessons(course: Course): number {
  return course.modules.reduce((total, module) => total + module.lessons.length, 0);
}
