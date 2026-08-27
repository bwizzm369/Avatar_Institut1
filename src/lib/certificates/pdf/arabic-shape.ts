/**
 * Arabic presentation-form shaping for PDF drawing (pdf-lib does not apply GSUB).
 * Mapping uses Unicode Arabic Presentation Forms-B.
 */

const ARABIC_RE = /[\u0600-\u06FF]/;

/** isolated, final, initial, medial — empty string means the form does not exist */
const FORMS: Record<string, [string, string, string, string]> = {
  ء: ["ء", "ء", "", ""],
  آ: ["آ", "ﺎ", "", ""],
  أ: ["أ", "ﺄ", "", ""],
  ؤ: ["ؤ", "ﺆ", "", ""],
  إ: ["إ", "ﺈ", "", ""],
  ئ: ["ئ", "ﺊ", "ﺋ", "ﺌ"],
  ا: ["ا", "ﺎ", "", ""],
  ب: ["ب", "ﺐ", "ﺑ", "ﺒ"],
  ة: ["ة", "ﺔ", "", ""],
  ت: ["ت", "ﺖ", "ﺗ", "ﺘ"],
  ث: ["ث", "ﺚ", "ﺛ", "ﺜ"],
  ج: ["ج", "ﺞ", "ﺟ", "ﺠ"],
  ح: ["ح", "ﺢ", "ﺣ", "ﺤ"],
  خ: ["خ", "ﺦ", "ﺧ", "ﺨ"],
  د: ["د", "ﺪ", "", ""],
  ذ: ["ذ", "ﺬ", "", ""],
  ر: ["ر", "ﺮ", "", ""],
  ز: ["ز", "ﺰ", "", ""],
  س: ["س", "ﺲ", "ﺳ", "ﺴ"],
  ش: ["ش", "ﺶ", "ﺷ", "ﺸ"],
  ص: ["ص", "ﺺ", "ﺻ", "ﺼ"],
  ض: ["ض", "ﺾ", "ﺿ", "ﻀ"],
  ط: ["ط", "ﻂ", "ﻃ", "ﻄ"],
  ظ: ["ظ", "ﻆ", "ﻇ", "ﻈ"],
  ع: ["ع", "ﻊ", "ﻋ", "ﻌ"],
  غ: ["غ", "ﻎ", "ﻏ", "ﻐ"],
  ف: ["ف", "ﻒ", "ﻓ", "ﻔ"],
  ق: ["ق", "ﻖ", "ﻗ", "ﻘ"],
  ك: ["ك", "ﻚ", "ﻛ", "ﻜ"],
  ل: ["ل", "ﻞ", "ﻟ", "ﻠ"],
  م: ["م", "ﻢ", "ﻣ", "ﻤ"],
  ن: ["ن", "ﻦ", "ﻧ", "ﻨ"],
  ه: ["ه", "ﻪ", "ﻫ", "ﻬ"],
  و: ["و", "ﻮ", "", ""],
  ى: ["ى", "ﻰ", "", ""],
  ي: ["ي", "ﻲ", "ﻳ", "ﻴ"],
};

const LAM_ALEF: Record<string, string> = {
  ا: "ﻻ",
  أ: "ﻷ",
  إ: "ﻹ",
  آ: "ﻵ",
};

function canConnectBefore(char: string): boolean {
  const forms = FORMS[char];
  return Boolean(forms && forms[1]);
}

function canConnectAfter(char: string): boolean {
  const forms = FORMS[char];
  return Boolean(forms && forms[2]);
}

function shapeLetter(
  char: string,
  connectPrev: boolean,
  connectNext: boolean,
): string {
  const forms = FORMS[char];
  if (!forms) return char;
  const [isolated, final, initial, medial] = forms;
  if (connectPrev && connectNext) return medial || final || isolated;
  if (connectPrev) return final || isolated;
  if (connectNext) return initial || isolated;
  return isolated;
}

export function containsArabic(text: string): boolean {
  return ARABIC_RE.test(text);
}

export function shapeArabic(text: string): string {
  const chars = Array.from(text);
  const out: string[] = [];

  for (let i = 0; i < chars.length; i += 1) {
    const current = chars[i] ?? "";
    if (current === "ل") {
      const next = chars[i + 1] ?? "";
      const ligature = LAM_ALEF[next];
      if (ligature) {
        out.push(ligature);
        i += 1;
        continue;
      }
    }

    if (!FORMS[current]) {
      out.push(current);
      continue;
    }

    const prev = chars[i - 1] ?? "";
    const next = chars[i + 1] ?? "";
    const connectPrev = canConnectAfter(prev) && canConnectBefore(current);
    const connectNext = canConnectAfter(current) && canConnectBefore(next);
    out.push(shapeLetter(current, connectPrev, connectNext));
  }

  return out.join("");
}
