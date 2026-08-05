/**
 * Institutional biography provided by Avatar Institut.
 * Source text: Arabic validated by the client. English is a faithful translation.
 * Do not treat these statements as independent scientific verification.
 * Do not invent degrees, dates, institutions, or publications.
 */

export type FounderWorkCategory = "intellectual_sufi" | "poetry";

/** Central bibliography config — set `link` when official Amazon KDP URLs are available. */
export type FounderWork = {
  titleEn: string;
  titleAr: string;
  category: FounderWorkCategory;
  link: string | null;
};

export type FounderResponsibility = {
  labelEn: string;
  labelAr: string;
  /** External URL only when already present in validated project content. */
  link: string | null;
};

export type FounderBiography = {
  name_ar: string;
  name_en: string;
  initials_ar: string;
  role_ar: string;
  role_en: string;
  /** Concise hero lead drawn from the institutional biography. */
  hero_lead_ar: string;
  hero_lead_en: string;
  /** Short hero description for the founder page. */
  hero_desc_ar: string;
  hero_desc_en: string;
  summary_ar: [string, string, string];
  summary_en: [string, string, string];
  presentation_ar: string[];
  presentation_en: string[];
  responsibilities: FounderResponsibility[];
  research_ar: string[];
  research_en: string[];
  /** Factual landmarks already provided by Avatar Institut — no invented dates or degrees. */
  landmarks_ar: string[];
  landmarks_en: string[];
  translations_ar: string[];
  translations_en: string[];
  works: FounderWork[];
};

export const founderBiography: FounderBiography = {
  name_ar: "الدكتور محمد رمضان الحسيني",
  name_en: "Dr Mohamed Ramadan Al-Husseini",
  initials_ar: "م ر ح",
  role_ar: "مؤسس ومدير مؤسسة الأفاتار للميتافيزيقا في كيل، ألمانيا",
  role_en:
    "Founder and Director of Avatar Institut für Metaphysik GmbH in Kiel, Germany",
  hero_lead_ar:
    "تجمع مسيرته بين دراسة الميتافيزيقا والوعي الإنساني والبحث الروحي، ضمن رؤية تسعى إلى بناء حوار مسؤول بين المعرفة والتجربة الإنسانية.",
  hero_lead_en:
    "His work brings together metaphysics, human consciousness, and spiritual inquiry, guided by a vision of responsible dialogue between knowledge and lived human experience.",
  hero_desc_ar:
    "سيرة فكرية ومؤسسية توثّق مسيرته ورؤيته وأبرز مؤلفاته.",
  hero_desc_en:
    "An intellectual and institutional biography presenting his journey, vision, and selected works.",
  summary_ar: [
    "مؤسس ومدير مؤسسة الأفاتار (Avatar Institut für Metaphysik GmbH) في مدينة كيل – ألمانيا.",
    "شخصية جمعت بين العلم والروح، وبين البحث الأكاديمي والقيادة الروحية.",
    "ألّف أكثر من عشرات الكتب في الفكر الصوفي، الميتافيزيقا، والشعر الروحاني.",
  ],
  summary_en: [
    "Founder and Director of Avatar Institut für Metaphysik GmbH in Kiel, Germany.",
    "A figure who brings together science and spirit, academic research and spiritual leadership.",
    "He has authored more than dozens of books on Sufi thought, metaphysics, and spiritual poetry.",
  ],
  presentation_ar: [
    "الدكتور محمد رمضان الحسيني شخصية جمعت بين العلم والروح، وبين البحث الأكاديمي والقيادة الروحية.",
    "فهو مؤسس ومدير مؤسسة الأفاتار (Avatar Institut für Metaphysik GmbH) في مدينة كيل – ألمانيا، المؤسسة التي تُعنى بالبحث في علوم الميتافيزيقا والوعي الإنساني.",
    "كما يشغل منصب مدير معهد طاووس العارفين، والأمين العام للمعهد الدولي للأنساب، إضافة إلى كونه شيخ الطريقة الرفاعية وحامل سرّها.",
    "ألّف الدكتور الحسيني أكثر من عشرات الكتب في الفكر الصوفي، الميتافيزيقا، والشعر الروحاني.",
  ],
  presentation_en: [
    "Dr. Mohamed Ramadan Al-Husseini is a figure who brings together science and spirit, academic research and spiritual leadership.",
    "He is the Founder and Director of Avatar Institut für Metaphysik GmbH in Kiel, Germany, an institution devoted to research in the metaphysical sciences and human consciousness.",
    "He also serves as Director of the Institute of Tawus al-Arifeen and as Secretary-General of the International Institute of Genealogy, in addition to being Sheikh of the Rifa‘i Order and bearer of its secret.",
    "Dr. Al-Husseini has authored more than dozens of books on Sufi thought, metaphysics, and spiritual poetry.",
  ],
  responsibilities: [
    {
      labelEn:
        "Founder and Director of Avatar Institut für Metaphysik GmbH in Kiel, Germany, an institution devoted to research in the metaphysical sciences and human consciousness.",
      labelAr:
        "مؤسس ومدير مؤسسة الأفاتار (Avatar Institut für Metaphysik GmbH) في مدينة كيل – ألمانيا، المؤسسة التي تُعنى بالبحث في علوم الميتافيزيقا والوعي الإنساني.",
      link: null,
    },
    {
      labelEn: "Director of the Institute of Tawus al-Arifeen.",
      labelAr: "مدير معهد طاووس العارفين.",
      link: null,
    },
    {
      labelEn: "Secretary-General of the International Institute of Genealogy.",
      labelAr: "الأمين العام للمعهد الدولي للأنساب.",
      link: null,
    },
    {
      labelEn: "Sheikh of the Rifa‘i Order and bearer of its secret.",
      labelAr: "شيخ الطريقة الرفاعية وحامل سرّها.",
      link: null,
    },
  ],
  research_ar: [
    "يهتم الدكتور الحسيني اهتمامًا فكريًا وفلسفيًا بالعلاقات بين الفيزياء والميتافيزيقا، وبين الوعي والتجربة الروحية، في إطار تأمّل يسعى إلى فهم أعمق للأسئلة الإنسانية الكبرى دون تقديم نظريات علمية محقَّقة.",
  ],
  research_en: [
    "Dr. Al-Husseini pursues an intellectual and philosophical interest in the relationships between physics and metaphysics, and between consciousness and spiritual experience — a reflective inquiry into fundamental human questions, not a presentation of verified scientific theories.",
  ],
  landmarks_ar: [
    "مؤسس ومدير مؤسسة الأفاتار (Avatar Institut für Metaphysik GmbH) في كيل، ألمانيا.",
    "مدير معهد طاووس العارفين.",
    "الأمين العام للمعهد الدولي للأنساب.",
    "شيخ الطريقة الرفاعية وحامل سرّها.",
    "مؤلف مؤلفات في الفكر الصوفي والميتافيزيقا والشعر الروحاني، وفق العناوين التي قدّمتها مؤسسة الأفاتار.",
    "يعمل حاليًا على ترجمة عدد من مؤلفاته إلى الألمانية والإنجليزية.",
  ],
  landmarks_en: [
    "Founder and Director of Avatar Institut für Metaphysik GmbH in Kiel, Germany.",
    "Director of the Institute of Tawus al-Arifeen.",
    "Secretary-General of the International Institute of Genealogy.",
    "Sheikh of the Rifa‘i Order and bearer of its secret.",
    "Author of works on Sufi thought, metaphysics, and spiritual poetry, as titled by Avatar Institut.",
    "Currently translating a number of his works into German and English.",
  ],
  translations_ar: [
    "يعمل الدكتور الحسيني حاليًا على ترجمة عدد من مؤلفاته إلى اللغتين الألمانية والإنجليزية، لفتح آفاق جديدة أمام القراء العالميين، ونقل التجربة الصوفية إلى فضاء أوسع.",
    "وتهدف هذه الترجمات إلى مدّ جسور بين الشرق والغرب، وإبراز البُعد الكوني للفكر الصوفي الذي يجمع بين العلم، الروح، والشعر.",
  ],
  translations_en: [
    "Dr. Al-Husseini is currently working on translating a number of his works into German and English, to open new horizons for international readers and to carry the Sufi experience into a wider space.",
    "These translations aim to build bridges between East and West, and to highlight the cosmic dimension of Sufi thought that unites science, spirit, and poetry.",
  ],
  works: [
    {
      titleEn: "Series “I Am the Secret and the Secret Is from Me”",
      titleAr: "سلسلة «أنا السر والسر مني»",
      category: "intellectual_sufi",
      link: null,
    },
    {
      titleEn:
        "The Book of the Madman… From Bewilderment to Annihilation… Then the Return from the Unseen",
      titleAr: "سِفر المجنون… من الحيرة إلى الفناء… ثم العودة من الغيب",
      category: "intellectual_sufi",
      link: null,
    },
    {
      titleEn: "The Secret of the Seal’s Lordship (99 chapters)",
      titleAr: "سر ربوبية الختم (99 فصلًا)",
      category: "intellectual_sufi",
      link: null,
    },
    {
      titleEn: "The Greatest Compelling Power (3333 stations)",
      titleAr: "القهر الأعظم (3333 مقامًا)",
      category: "intellectual_sufi",
      link: null,
    },
    {
      titleEn: "The Divine Presences",
      titleAr: "الحضرات الإلهية",
      category: "intellectual_sufi",
      link: null,
    },
    {
      titleEn: "Men of the Unseen",
      titleAr: "رجال الغيب",
      category: "intellectual_sufi",
      link: null,
    },
    {
      titleEn: "Forty Substitutes and the Choice of the Prince",
      titleAr: "أربعين بدلاً واختيار الأمير",
      category: "intellectual_sufi",
      link: null,
    },
    {
      titleEn: "The Greater Death for the Sufi (99 chapters)",
      titleAr: "الموت الأكبر للصوفي (99 فصلًا)",
      category: "intellectual_sufi",
      link: null,
    },
    {
      titleEn: "Mother of Spirits (99 scenes)",
      titleAr: "أم الأرواح (99 مشهدًا)",
      category: "intellectual_sufi",
      link: null,
    },
    {
      titleEn: "Forty Mahdis",
      titleAr: "أربعين مهديًا",
      category: "intellectual_sufi",
      link: null,
    },
    {
      titleEn: "And the Moon Fell in Karbala (77 poems)",
      titleAr: "وسقط القمر في كربلاء (77 قصيدة)",
      category: "poetry",
      link: null,
    },
    {
      titleEn: "Diwan: Dance of a Madman’s Death in His Presence",
      titleAr: "ديوان رقص موت مجنون في حضرته",
      category: "poetry",
      link: null,
    },
    {
      titleEn: "I Became Intoxicated Before It Was Poured (66 poems)",
      titleAr: "سُكرتُ قبل أن يُصبّ (66 قصيدة)",
      category: "poetry",
      link: null,
    },
    {
      titleEn: "A Heart at the Door… Wanting Nothing",
      titleAr: "قلب على الباب… لا يريد شيئًا",
      category: "poetry",
      link: null,
    },
    {
      titleEn:
        "Blessed Are the People of the Monastery, How Intoxicated They Became by It (40 parts)",
      titleAr: "هنيئًا لأهل الدير كم سكروا بها (40 جزءًا)",
      category: "poetry",
      link: null,
    },
    {
      titleEn: "The Knower Who Ascended (77 poems)",
      titleAr: "العارفة التي عرجت (77 قصيدة)",
      category: "poetry",
      link: null,
    },
    {
      titleEn: "Layla and Majnun (99 poems)",
      titleAr: "ليلى ومجنون (99 قصيدة)",
      category: "poetry",
      link: null,
    },
    {
      titleEn: "The Unveiling of My Secret",
      titleAr: "انكشاف سرّي",
      category: "poetry",
      link: null,
    },
  ],
};

export function getFounderWorksByCategory(
  category: FounderWorkCategory,
): FounderWork[] {
  return founderBiography.works.filter((work) => work.category === category);
}
