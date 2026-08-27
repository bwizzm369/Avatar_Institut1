import { normalizeWhitespace } from "@/lib/admin/import/normalize";

/** Normalize Arabic/English titles for duplicate detection (not for display). */
export function normalizeCourseTitleKey(value: string): string {
  return normalizeWhitespace(value).toLowerCase();
}

export function normalizeOptionalText(value: string | null | undefined): string {
  return normalizeWhitespace(String(value ?? ""));
}

/**
 * Parse academy price cell into cents.
 * Accepts major units (99 or 99.50) — never invents a price for empty cells.
 */
export function parsePriceToCents(raw: string): number | null | "invalid" {
  const value = normalizeWhitespace(raw);
  if (!value) return null;
  if (!/^\d+([.,]\d{1,2})?$/.test(value)) return "invalid";
  const normalized = value.replace(",", ".");
  const major = Number(normalized);
  if (!Number.isFinite(major) || major < 0) return "invalid";
  return Math.round(major * 100);
}

export function formatCentsForInput(cents: number | null): string {
  if (cents == null) return "";
  return (cents / 100).toFixed(2).replace(/\.00$/, "");
}

export function parseBooleanCell(
  raw: string | null | undefined,
): boolean | null | "invalid" {
  const value = normalizeWhitespace(String(raw ?? "")).toLowerCase();
  if (!value) return null;
  if (["true", "1", "yes", "y", "oui"].includes(value)) return true;
  if (["false", "0", "no", "n", "non"].includes(value)) return false;
  return "invalid";
}

export function parseCurrencyCell(
  raw: string | null | undefined,
): "EUR" | "USD" | "CHF" | "invalid" {
  const value = normalizeWhitespace(String(raw ?? "")).toUpperCase();
  if (!value) return "EUR";
  if (value === "EUR" || value === "USD" || value === "CHF") return value;
  return "invalid";
}

/** Student Pass discount percent 0–100 (integers). Empty → 0. */
export function parseDiscountPercent(
  raw: string | null | undefined,
): number | "invalid" {
  const value = normalizeWhitespace(String(raw ?? ""));
  if (!value) return 0;
  if (!/^\d{1,3}$/.test(value)) return "invalid";
  const percent = Number(value);
  if (!Number.isInteger(percent) || percent < 0 || percent > 100) {
    return "invalid";
  }
  return percent;
}
