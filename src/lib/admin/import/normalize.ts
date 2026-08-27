/** Trim and collapse internal whitespace. */
export function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function normalizeEmail(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = normalizeWhitespace(String(value)).toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

export function normalizeName(value: string): string {
  return normalizeWhitespace(value);
}

export function normalizeCourseTitle(value: string): string {
  return normalizeWhitespace(value).toLowerCase();
}

export function isValidEmailFormat(email: string): boolean {
  // Practical admin import check — not a full RFC parser.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Accepts YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY, or Excel serial (number as string).
 * Returns ISO date YYYY-MM-DD or null.
 */
export function parseImportDate(raw: string): string | null {
  const value = normalizeWhitespace(raw);
  if (!value) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const d = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(d.getTime())) return null;
    if (d.toISOString().slice(0, 10) !== value) return null;
    return value;
  }

  const slash = value.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (slash) {
    const day = Number(slash[1]);
    const month = Number(slash[2]);
    const year = Number(slash[3]);
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    const iso = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const d = new Date(`${iso}T00:00:00.000Z`);
    if (Number.isNaN(d.getTime())) return null;
    if (d.getUTCFullYear() !== year || d.getUTCMonth() + 1 !== month || d.getUTCDate() !== day) {
      return null;
    }
    return iso;
  }

  if (/^\d+(\.\d+)?$/.test(value)) {
    const serial = Number(value);
    if (!Number.isFinite(serial) || serial < 1) return null;
    // Excel serial date (days since 1899-12-30, accounting for Excel leap bug epoch)
    const utc = Date.UTC(1899, 11, 30) + Math.round(serial) * 86400000;
    const d = new Date(utc);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 10);
  }

  return null;
}

export function normalizeCertificateLanguage(
  raw: string | null | undefined,
): "en" | "ar" | null | "invalid" {
  if (raw == null) return null;
  const value = normalizeWhitespace(String(raw)).toLowerCase();
  if (!value) return null;
  if (value === "en" || value === "english") return "en";
  if (value === "ar" || value === "arabic" || value === "العربية") return "ar";
  return "invalid";
}
