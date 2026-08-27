import bidiFactory from "bidi-js";
import { containsArabic, shapeArabic } from "@/lib/certificates/pdf/arabic-shape";

const bidi = bidiFactory();

function reverseInclusive(chars: string[], start: number, end: number): void {
  let left = start;
  let right = end;
  while (left < right) {
    const tmp = chars[left] ?? "";
    chars[left] = chars[right] ?? "";
    chars[right] = tmp;
    left += 1;
    right -= 1;
  }
}

export function preparePdfLine(
  text: string,
  direction: "ltr" | "rtl",
): string {
  if (!text) return "";
  const needsRtl = direction === "rtl" || containsArabic(text);
  const shaped = needsRtl ? shapeArabic(text) : text;
  if (!needsRtl) return shaped;

  const embedding = bidi.getEmbeddingLevels(shaped, direction);
  const chars = Array.from(shaped);
  const mirrored = bidi.getMirroredCharactersMap(shaped, embedding);
  for (const [index, replacement] of mirrored) {
    chars[index] = replacement;
  }
  const segments = bidi.getReorderSegments(shaped, embedding);
  for (const [start, end] of segments) {
    reverseInclusive(chars, start, end);
  }
  return chars.join("");
}
