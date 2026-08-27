import { describe, expect, it, vi } from "vitest";
import {
  activateLegacyStudent,
  generateTemporaryPassword,
  isAlreadyRegisteredError,
  splitStudentName,
  type ActivateLegacyStudentDeps,
  type LegacyStudentActivationRow,
} from "@/lib/admin/students/activate";
import { readFileSync } from "node:fs";
import path from "node:path";

function baseStudent(
  overrides: Partial<LegacyStudentActivationRow> = {},
): LegacyStudentActivationRow {
  return {
    id: "legacy-1",
    full_name: "Nadia El Mansouri",
    email: "nadia@example.com",
    linked_profile_id: null,
    ...overrides,
  };
}

function createDeps(
  overrides: Partial<ActivateLegacyStudentDeps> & {
    student?: LegacyStudentActivationRow | null;
    profileId?: string | null;
  } = {},
): ActivateLegacyStudentDeps & {
  linkCalls: Array<{ legacyId: string; profileId: string }>;
  createCalls: Array<{ email: string; password: string; emailConfirm?: boolean }>;
} {
  const linkCalls: Array<{ legacyId: string; profileId: string }> = [];
  const createCalls: Array<{
    email: string;
    password: string;
  }> = [];
  const student = "student" in overrides ? overrides.student : baseStudent();

  return {
    linkCalls,
    createCalls,
    loadLegacyStudent: async () => student ?? null,
    findProfileIdByEmail: async () =>
      "profileId" in overrides ? (overrides.profileId ?? null) : null,
    linkLegacyStudent: async (legacyId, profileId) => {
      linkCalls.push({ legacyId, profileId });
      return { ok: true };
    },
    generateTemporaryPassword: () => "TempPass!234567890ab",
    createConfirmedUser: async ({ email, password }) => {
      createCalls.push({ email, password });
      return { ok: true, userId: "auth-user-1" };
    },
    ...overrides,
  };
}

describe("generateTemporaryPassword", () => {
  it("generates a strong random password", () => {
    const a = generateTemporaryPassword();
    const b = generateTemporaryPassword();
    expect(a.length).toBeGreaterThanOrEqual(16);
    expect(b.length).toBeGreaterThanOrEqual(16);
    expect(a).not.toBe(b);
  });
});

describe("splitStudentName", () => {
  it("splits first and last names", () => {
    expect(splitStudentName("Nadia El Mansouri")).toEqual({
      firstName: "Nadia",
      lastName: "El Mansouri",
    });
  });
});

describe("activateLegacyStudent", () => {
  it("creates a confirmed Auth user immediately with a temporary password", async () => {
    const deps = createDeps();
    const result = await activateLegacyStudent(deps, "legacy-1");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.action).toBe("created");
    expect(result.profileId).toBe("auth-user-1");
    expect(result.temporaryPassword).toBe("TempPass!234567890ab");
    expect(deps.createCalls).toHaveLength(1);
    expect(deps.createCalls[0]?.email).toBe("nadia@example.com");
    expect(deps.createCalls[0]?.password).toBe("TempPass!234567890ab");
    expect(deps.linkCalls).toEqual([
      { legacyId: "legacy-1", profileId: "auth-user-1" },
    ]);
  });

  it("does not persist the temporary password on the legacy student row", async () => {
    const activatePath = path.resolve(
      process.cwd(),
      "src/lib/admin/students/activate.ts",
    );
    const actionsPath = path.resolve(
      process.cwd(),
      "src/app/admin/(console)/students/actions.ts",
    );
    const activateSource = readFileSync(activatePath, "utf8");
    const actionsSource = readFileSync(actionsPath, "utf8");
    expect(activateSource).not.toMatch(/temporary_password/);
    expect(actionsSource).not.toMatch(/temporary_password/);
    expect(actionsSource).toMatch(/email_confirm:\s*true/);
    expect(actionsSource).toMatch(/createUser/);
    expect(actionsSource).not.toMatch(/inviteUserByEmail/);
    expect(activateSource).not.toMatch(/inviteUserByEmail/);
  });

  it("refuses activation without email", async () => {
    const deps = createDeps({
      student: baseStudent({ email: null }),
    });
    const result = await activateLegacyStudent(deps, "legacy-1");
    expect(result).toEqual({
      ok: false,
      error: "Activation requires an email address on the student record.",
    });
    expect(deps.createCalls).toHaveLength(0);
  });

  it("is idempotent when already linked", async () => {
    const deps = createDeps({
      student: baseStudent({ linked_profile_id: "profile-9" }),
    });
    const result = await activateLegacyStudent(deps, "legacy-1");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.action).toBe("already_active");
    expect(result.temporaryPassword).toBeUndefined();
    expect(deps.createCalls).toHaveLength(0);
    expect(deps.linkCalls).toHaveLength(0);
  });

  it("links an existing Auth/profile email without creating or resetting password", async () => {
    const deps = createDeps({
      profileId: "profile-existing",
    });
    const result = await activateLegacyStudent(deps, "legacy-1");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.action).toBe("linked_existing");
    expect(result.temporaryPassword).toBeUndefined();
    expect(deps.createCalls).toHaveLength(0);
    expect(deps.linkCalls).toEqual([
      { legacyId: "legacy-1", profileId: "profile-existing" },
    ]);
  });

  it("handles Auth already-registered by linking without a fake temp password", async () => {
    const findProfileIdByEmail = vi
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce("profile-from-auth");
    const deps = createDeps({
      findProfileIdByEmail,
      createConfirmedUser: async () => ({ ok: false, alreadyExists: true }),
    });
    const result = await activateLegacyStudent(deps, "legacy-1");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.action).toBe("linked_existing");
    expect(result.temporaryPassword).toBeUndefined();
    expect(deps.linkCalls[0]?.profileId).toBe("profile-from-auth");
  });

  it("does not update linked_profile_id when Auth creation fails", async () => {
    const deps = createDeps({
      createConfirmedUser: async () => ({
        ok: false,
        error: "Auth unavailable",
      }),
    });
    const result = await activateLegacyStudent(deps, "legacy-1");
    expect(result.ok).toBe(false);
    expect(deps.linkCalls).toHaveLength(0);
  });

  it("detects already-registered Auth error messages", () => {
    expect(
      isAlreadyRegisteredError(
        "A user with this email address has already been registered",
      ),
    ).toBe(true);
    expect(isAlreadyRegisteredError("network timeout")).toBe(false);
  });

  it("does not create Student Pass, enrollments, or certificates", () => {
    const activatePath = path.resolve(
      process.cwd(),
      "src/lib/admin/students/activate.ts",
    );
    const actionsPath = path.resolve(
      process.cwd(),
      "src/app/admin/(console)/students/actions.ts",
    );
    const activateSource = readFileSync(activatePath, "utf8");
    const actionsSource = readFileSync(actionsPath, "utf8");
    for (const source of [activateSource, actionsSource]) {
      expect(source).not.toMatch(/student_pass_subscriptions/);
      expect(source).not.toMatch(/from\("enrollments"\)/);
      expect(source).not.toMatch(/from\("certificates"\)/);
      expect(source).not.toMatch(/activateStudentPass/);
      expect(source).not.toMatch(/inviteUserByEmail/);
      expect(source).not.toMatch(/resetPasswordForEmail/);
    }
    expect(actionsSource).toMatch(/getAdminAccess/);
    expect(actionsSource).toMatch(/createServiceRoleSupabaseClient/);
  });
});

describe("activateLegacyStudentAction authorization surface", () => {
  it("wires admin gate and keeps service role server-side", () => {
    const actionsPath = path.resolve(
      process.cwd(),
      "src/app/admin/(console)/students/actions.ts",
    );
    const source = readFileSync(actionsPath, "utf8");
    expect(source).toMatch(/"use server"/);
    expect(source).toMatch(/Access denied/);
    expect(source).not.toMatch(/NEXT_PUBLIC_SUPABASE_SECRET/);
  });
});
