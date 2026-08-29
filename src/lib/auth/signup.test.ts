import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { hasActiveStudentPass } from "@/lib/admin/student-pass/types";
import { messages } from "@/lib/i18n";
import {
  buildSignupUserMetadata,
  isForbiddenSignupMetadataKey,
  readSignupFormFields,
  SIGNUP_USER_METADATA_KEYS,
  signupMetadataContainsForbiddenKeys,
} from "@/lib/auth/signup-fields";
import { validateSignup } from "@/lib/auth/validation";

function readSource(relativePath: string): string {
  return readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
}

describe("signup metadata is an explicit allow-list", () => {
  it("copies only safe fields and ignores injected privileges", () => {
    const hostile = new FormData();
    hostile.set("firstName", "Ada");
    hostile.set("lastName", "Lovelace");
    hostile.set("email", "Ada@Avatar.example");
    hostile.set("phone", "0600000000");
    hostile.set("country", "Morocco");
    hostile.set("password", "longenough");
    hostile.set("confirmPassword", "longenough");
    hostile.set("locale", "ar");
    hostile.set("previouslyStudied", "no");
    hostile.set("role", "admin");
    hostile.set("legacy_match_status", "linked");
    hostile.set("linked_profile_id", "someone-else");
    hostile.set("legacy_student_id", "legacy-hack");
    hostile.set("student_pass", "active");
    hostile.set("payment_confirmed", "true");
    hostile.set("enrollment", "grant-me");
    hostile.set("certificate", "AVT-2024-000111");

    const fields = readSignupFormFields(hostile);
    expect(fields).not.toHaveProperty("role");
    expect(fields).not.toHaveProperty("legacy_match_status");
    expect(fields).not.toHaveProperty("student_pass");

    const parsed = validateSignup(fields);
    expect(parsed.ok).toBe(true);
    const metadata = buildSignupUserMetadata(parsed.values);
    expect(Object.keys(metadata).sort()).toEqual(
      [...SIGNUP_USER_METADATA_KEYS].sort(),
    );
    expect(signupMetadataContainsForbiddenKeys(metadata)).toBe(false);
    expect(metadata).not.toHaveProperty("role");
    expect(metadata).not.toHaveProperty("legacy_match_status");
    expect(metadata).not.toHaveProperty("student_pass");
    expect(isForbiddenSignupMetadataKey("role")).toBe(true);
    expect(isForbiddenSignupMetadataKey("legacy_match_status")).toBe(true);
  });
});

describe("signup source invariants", () => {
  it("never sends the raw FormData as Auth metadata", () => {
    const actions = readSource("src/lib/auth/actions.ts");
    expect(actions).toMatch(/buildSignupUserMetadata\(parsed\.values\)/);
    expect(actions).toMatch(/readSignupFormFields\(formData\)/);
    expect(actions).not.toMatch(/data:\s*formData/);
    expect(actions).not.toMatch(/data:\s*Object\.fromEntries/);
    expect(actions).toMatch(/needsEmailConfirmation: true/);
    expect(actions).not.toMatch(/email_confirm:\s*true/);
    expect(actions).not.toMatch(/student_pass_subscriptions/);
    expect(actions).not.toMatch(/from\("enrollments"\)/);
    expect(actions).not.toMatch(/role:\s*["']admin["']/);
  });

  it("keeps matching and Student Pass writes out of the public signup form", () => {
    const page = readSource("src/app/signup/page.tsx");
    expect(page).toMatch(/name="firstName"/);
    expect(page).toMatch(/name="lastName"/);
    expect(page).toMatch(/name="phone"/);
    expect(page).toMatch(/name="country"/);
    expect(page).toMatch(/name="confirmPassword"/);
    expect(page).toMatch(/name="locale"/);
    expect(page).toMatch(/name="previouslyStudied"/);
    expect(page).not.toMatch(/date of birth|dateOfBirth|birthDate|naissance/i);
    expect(page).not.toMatch(/name="role"/);
    expect(page).not.toMatch(/name="legacy_match_status"/);
    expect(page).not.toMatch(/student_pass/);
    expect(page).toMatch(/auth\.language\.ar/);
    expect(page).toMatch(/auth\.language\.en/);
  });

  it("never creates a Student Pass row during matching", () => {
    const store = readSource("src/lib/auth/legacy-match-store.ts");
    const match = readSource("src/lib/auth/legacy-match.ts");
    expect(store).not.toMatch(/student_pass_subscriptions/);
    expect(match).not.toMatch(/student_pass_subscriptions/);
    expect(store).not.toMatch(/from\("enrollments"\)/);
    expect(hasActiveStudentPass(null)).toBe(false);
  });
});

describe("signup bilingual copy", () => {
  const keys = [
    "auth.phone",
    "auth.country",
    "auth.preferredLanguage",
    "auth.language.ar",
    "auth.language.en",
    "auth.previouslyStudied",
    "auth.previouslyStudiedYes",
    "auth.previouslyStudiedNo",
    "auth.previousCourse",
    "auth.certificateNumberOptional",
    "auth.accountExists",
    "auth.confirmEmail",
    "auth.error.passwordMismatch",
    "auth.error.passwordShort",
    "auth.error.emailInvalid",
  ] as const;

  it("has English and Arabic strings for signup fields and errors", () => {
    for (const key of keys) {
      const entry = messages[key];
      expect(entry, key).toBeDefined();
      expect(entry.en.trim().length).toBeGreaterThan(0);
      expect(entry.ar.trim().length).toBeGreaterThan(0);
    }
    expect(messages["auth.previouslyStudied"].en).toMatch(/previously studied/i);
    expect(messages["auth.previouslyStudied"].ar).toMatch(/الأفاتار/);
    expect(messages["auth.language.ar"].ar).toBe("العربية");
  });
});

describe("self-registration SQL migration", () => {
  const sql = readSource(
    "supabase/migrations/20260827180000_student_self_registration.sql",
  );

  it("adds the validated profile columns without a date of birth", () => {
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS phone TEXT/);
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS country TEXT/);
    expect(sql).toMatch(
      /ADD COLUMN IF NOT EXISTS previously_studied BOOLEAN NOT NULL DEFAULT false/,
    );
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS previous_course TEXT/);
    expect(sql).toMatch(
      /ADD COLUMN IF NOT EXISTS declared_certificate_number TEXT/,
    );
    expect(sql).toMatch(
      /ADD COLUMN IF NOT EXISTS legacy_match_status TEXT NOT NULL DEFAULT 'none'/,
    );
    expect(sql).toMatch(/'none'/);
    expect(sql).toMatch(/'linked'/);
    expect(sql).toMatch(/'pending_review'/);
    expect(sql).toMatch(/'unmatched'/);
    expect(sql).not.toMatch(/ADD COLUMN.*date_of_birth|ADD COLUMN.*birth_date/i);
    expect(sql).not.toMatch(/legacy_match_notes/);
  });

  it("copies only safe metadata and keeps role at the SQL student default", () => {
    expect(sql).toMatch(/CREATE OR REPLACE FUNCTION public\.handle_new_user/);
    expect(sql).toMatch(/meta ->> 'first_name'/);
    expect(sql).toMatch(/meta ->> 'last_name'/);
    expect(sql).toMatch(/meta ->> 'locale'/);
    expect(sql).toMatch(/meta ->> 'phone'/);
    expect(sql).toMatch(/meta ->> 'country'/);
    expect(sql).toMatch(/meta ->> 'previously_studied'/);
    expect(sql).toMatch(/meta ->> 'previous_course'/);
    expect(sql).toMatch(/meta ->> 'declared_certificate_number'/);
    expect(sql).not.toMatch(/meta ->> 'role'/);
    expect(sql).not.toMatch(/meta ->> 'legacy_match_status'/);
    expect(sql).not.toMatch(/meta ->> 'linked_profile_id'/);
    expect(sql).not.toMatch(/student_pass/);
    expect(sql).not.toMatch(/INSERT INTO public\.student_pass_subscriptions/);
    expect(sql).toMatch(/NEW\.legacy_match_status IS DISTINCT FROM OLD\.legacy_match_status/);
    expect(sql).toMatch(/profiles privileged columns can only be changed by the service role/);
  });
});
