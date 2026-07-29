import { afterEach, describe, expect, it } from "vitest";
import {
  getSupabasePublicConfig,
  getSupabaseSecretKey,
  isSupabaseConfigured,
} from "@/lib/supabase/env";

const KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SECRET_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

const original = Object.fromEntries(
  KEYS.map((key) => [key, process.env[key]]),
) as Record<(typeof KEYS)[number], string | undefined>;

afterEach(() => {
  for (const key of KEYS) {
    if (original[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = original[key];
    }
  }
});

describe("Supabase env without real project", () => {
  it("reports not configured when variables are missing", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    expect(isSupabaseConfigured()).toBe(false);
    expect(getSupabasePublicConfig()).toBeNull();
  });

  it("rejects placeholder values from .env.example", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://your-project.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "your-publishable-key";
    expect(isSupabaseConfigured()).toBe(false);
  });

  it("accepts non-placeholder public values", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abcd.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY =
      "eyJhbGciOi.test-publishable";
    expect(isSupabaseConfigured()).toBe(true);
    expect(getSupabasePublicConfig()?.url).toBe("https://abcd.supabase.co");
  });

  it("reads SUPABASE_SECRET_KEY for server grants", () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    process.env.SUPABASE_SECRET_KEY = "sb_secret_test_placeholder_value";
    expect(getSupabaseSecretKey()).toBe("sb_secret_test_placeholder_value");
  });
});
