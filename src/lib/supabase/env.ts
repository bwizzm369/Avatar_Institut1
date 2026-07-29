/**
 * Supabase environment helpers.
 * Public URL + publishable key are required for browser/server client auth.
 * Secret key (service role) must remain server-only.
 */

const PLACEHOLDER_MARKERS = [
  "your-project.supabase.co",
  "your-anon-key",
  "your-publishable-key",
  "your-service-role-key",
  "your-supabase-secret-key",
];

function isFilled(value: string | undefined): value is string {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  return !PLACEHOLDER_MARKERS.some((marker) => trimmed.includes(marker));
}

export function getSupabasePublicConfig(): {
  url: string;
  publishableKey: string;
} | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!isFilled(url) || !isFilled(publishableKey)) {
    return null;
  }
  return { url: url.trim(), publishableKey: publishableKey.trim() };
}

export function isSupabaseConfigured(): boolean {
  return getSupabasePublicConfig() !== null;
}

/**
 * Server-only Supabase secret (service role).
 * Prefer SUPABASE_SECRET_KEY; legacy SUPABASE_SERVICE_ROLE_KEY still accepted.
 * Never use in client bundles.
 */
export function getSupabaseSecretKey(): string | null {
  const key =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!isFilled(key)) return null;
  return key.trim();
}

/** @deprecated Prefer getSupabaseSecretKey — kept for existing call sites. */
export function getSupabaseServiceRoleKey(): string | null {
  return getSupabaseSecretKey();
}

export function assertSupabaseConfigured(): {
  url: string;
  publishableKey: string;
} {
  const config = getSupabasePublicConfig();
  if (!config) {
    throw new Error("SUPABASE_NOT_CONFIGURED");
  }
  return config;
}
