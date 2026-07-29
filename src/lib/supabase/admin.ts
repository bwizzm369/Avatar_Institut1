import { createClient } from "@supabase/supabase-js";
import {
  assertSupabaseConfigured,
  getSupabaseSecretKey,
} from "@/lib/supabase/env";
import type { Database } from "@/types/database";

/**
 * Secret-key client — server only.
 * Bypasses RLS. Use exclusively for privileged operations such as creating
 * enrollments after payment confirmation. Never import from client components.
 */
export function createServiceRoleSupabaseClient() {
  const { url } = assertSupabaseConfigured();
  const secretKey = getSupabaseSecretKey();
  if (!secretKey) {
    throw new Error("SUPABASE_SECRET_KEY_NOT_CONFIGURED");
  }
  return createClient<Database>(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
