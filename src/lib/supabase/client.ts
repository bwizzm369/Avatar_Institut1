import { createBrowserClient } from "@supabase/ssr";
import { assertSupabaseConfigured } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

export function createBrowserSupabaseClient() {
  const { url, publishableKey } = assertSupabaseConfigured();
  return createBrowserClient<Database>(url, publishableKey);
}
