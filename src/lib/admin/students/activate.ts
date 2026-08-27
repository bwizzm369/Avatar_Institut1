import { randomBytes } from "node:crypto";
import { normalizeEmail } from "@/lib/admin/import/normalize";

export type LegacyStudentActivationRow = {
  id: string;
  full_name: string;
  email: string | null;
  linked_profile_id: string | null;
};

export type ActivateLegacyStudentResult =
  | {
      ok: true;
      action: "created" | "linked_existing" | "already_active";
      profileId: string;
      message: string;
      /**
       * Shown once to the admin UI after a new Auth user is created.
       * Never persisted to profiles / legacy_students / logs.
       */
      temporaryPassword?: string;
    }
  | { ok: false; error: string };

export type ActivateLegacyStudentDeps = {
  loadLegacyStudent: (
    legacyStudentId: string,
  ) => Promise<LegacyStudentActivationRow | null>;
  findProfileIdByEmail: (email: string) => Promise<string | null>;
  linkLegacyStudent: (
    legacyStudentId: string,
    profileId: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  /**
   * Creates a confirmed Auth user with the given temporary password.
   * When the email already exists in Auth, return alreadyExists: true.
   */
  createConfirmedUser: (input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => Promise<
    | { ok: true; userId: string }
    | { ok: false; alreadyExists: true }
    | { ok: false; alreadyExists?: false; error: string }
  >;
  generateTemporaryPassword?: () => string;
};

/** Ambiguity-light alphabet; length keeps entropy high with crypto RNG. */
const TEMP_PASSWORD_ALPHABET =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*";

/**
 * Cryptographically strong temporary password for admin hand-off.
 * Never store the return value in the database.
 */
export function generateTemporaryPassword(length = 20): string {
  const size = Math.max(16, Math.min(64, Math.trunc(length)));
  const bytes = randomBytes(size);
  let password = "";
  for (let i = 0; i < size; i += 1) {
    password += TEMP_PASSWORD_ALPHABET[bytes[i]! % TEMP_PASSWORD_ALPHABET.length];
  }
  return password;
}

export function splitStudentName(fullName: string): {
  firstName: string;
  lastName: string;
} {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

export function isAlreadyRegisteredError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("already been registered") ||
    lower.includes("already registered") ||
    lower.includes("user already exists") ||
    lower.includes("email_exists") ||
    lower.includes("already been taken")
  );
}

/**
 * Activates a legacy student by creating (or linking) a confirmed Supabase Auth user.
 * Never creates Student Pass, enrollments, or certificates.
 * Never emails an invite. Temporary password is returned only for newly created users.
 */
export async function activateLegacyStudent(
  deps: ActivateLegacyStudentDeps,
  legacyStudentId: string,
): Promise<ActivateLegacyStudentResult> {
  if (!legacyStudentId.trim()) {
    return { ok: false, error: "Missing student id." };
  }

  const student = await deps.loadLegacyStudent(legacyStudentId);
  if (!student) {
    return { ok: false, error: "Student not found." };
  }

  if (student.linked_profile_id) {
    return {
      ok: true,
      action: "already_active",
      profileId: student.linked_profile_id,
      message: "Account is already active.",
    };
  }

  const email = normalizeEmail(student.email);
  if (!email) {
    return {
      ok: false,
      error: "Activation requires an email address on the student record.",
    };
  }

  const { firstName, lastName } = splitStudentName(student.full_name);

  // Auth/profile already present → link only. Do not change their password.
  const existingProfileId = await deps.findProfileIdByEmail(email);
  if (existingProfileId) {
    const linked = await deps.linkLegacyStudent(
      legacyStudentId,
      existingProfileId,
    );
    if (!linked.ok) {
      return { ok: false, error: linked.error };
    }
    return {
      ok: true,
      action: "linked_existing",
      profileId: existingProfileId,
      message:
        "Existing account linked. No temporary password was generated — the student keeps their current credentials.",
    };
  }

  const temporaryPassword = (
    deps.generateTemporaryPassword ?? generateTemporaryPassword
  )();

  const created = await deps.createConfirmedUser({
    email,
    password: temporaryPassword,
    firstName: firstName || student.full_name,
    lastName,
  });

  if (!created.ok) {
    if (created.alreadyExists) {
      const profileId = await deps.findProfileIdByEmail(email);
      if (!profileId) {
        return {
          ok: false,
          error:
            "An Auth account already exists for this email, but no profile was found to link.",
        };
      }
      const linked = await deps.linkLegacyStudent(legacyStudentId, profileId);
      if (!linked.ok) {
        return { ok: false, error: linked.error };
      }
      return {
        ok: true,
        action: "linked_existing",
        profileId,
        message:
          "Existing Auth account linked. No temporary password was generated — the student keeps their current credentials.",
      };
    }
    // Auth failed → do not touch linked_profile_id
    return { ok: false, error: created.error };
  }

  const linked = await deps.linkLegacyStudent(legacyStudentId, created.userId);
  if (!linked.ok) {
    return {
      ok: false,
      error: `Auth user was created but linking failed: ${linked.error}. linked_profile_id was not updated.`,
    };
  }

  return {
    ok: true,
    action: "created",
    profileId: created.userId,
    temporaryPassword,
    message:
      "Account activated. Copy the temporary password now — it will not be shown again.",
  };
}
