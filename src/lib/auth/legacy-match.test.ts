import { describe, expect, it } from "vitest";
import {
  applyLegacyMatchDecision,
  decideLegacyMatch,
  type CertificateMatchRow,
  type LegacyMatchStore,
  type LegacyStudentMatchRow,
} from "@/lib/auth/legacy-match";
import { hasActiveStudentPass } from "@/lib/admin/student-pass/types";

const SIGNUP_EMAIL = "ada@avatar.example";

function legacyStudent(
  overrides: Partial<LegacyStudentMatchRow> = {},
): LegacyStudentMatchRow {
  return {
    id: "legacy-ada",
    email: SIGNUP_EMAIL,
    linked_profile_id: null,
    ...overrides,
  };
}

function certificate(overrides: Partial<CertificateMatchRow> = {}): CertificateMatchRow {
  const owner = overrides.legacy ?? legacyStudent();
  return {
    certificate_number: "AVT-2024-000111",
    legacy_student_id: owner.id,
    profile_id: null,
    legacy: owner,
    ...overrides,
  };
}

describe("decideLegacyMatch", () => {
  it("leaves a new student unmatched to legacy (status none)", () => {
    expect(
      decideLegacyMatch({
        previouslyStudied: false,
        signupEmail: SIGNUP_EMAIL,
        declaredCertificateNumber: null,
        emailMatches: [legacyStudent()],
        certificate: certificate(),
      }),
    ).toEqual({ status: "none", legacyStudentId: null });
  });

  it("auto-links a returning student by unique unlinked email without a certificate", () => {
    expect(
      decideLegacyMatch({
        previouslyStudied: true,
        signupEmail: SIGNUP_EMAIL,
        declaredCertificateNumber: null,
        emailMatches: [legacyStudent()],
        certificate: null,
      }),
    ).toEqual({ status: "linked", legacyStudentId: "legacy-ada" });
  });

  it("auto-links when official certificate number and email both match", () => {
    expect(
      decideLegacyMatch({
        previouslyStudied: true,
        signupEmail: SIGNUP_EMAIL,
        declaredCertificateNumber: "AVT-2024-000111",
        emailMatches: [legacyStudent()],
        certificate: certificate(),
      }),
    ).toEqual({ status: "linked", legacyStudentId: "legacy-ada" });
  });

  it("does not link a correct certificate when the legacy email differs", () => {
    expect(
      decideLegacyMatch({
        previouslyStudied: true,
        signupEmail: SIGNUP_EMAIL,
        declaredCertificateNumber: "AVT-2024-000111",
        emailMatches: [],
        certificate: certificate({
          legacy: legacyStudent({
            id: "legacy-other",
            email: "other@avatar.example",
          }),
        }),
      }),
    ).toEqual({ status: "pending_review", legacyStudentId: null });
  });

  it("does not link when the matching legacy student is already linked", () => {
    expect(
      decideLegacyMatch({
        previouslyStudied: true,
        signupEmail: SIGNUP_EMAIL,
        declaredCertificateNumber: null,
        emailMatches: [
          legacyStudent({ linked_profile_id: "existing-profile" }),
        ],
        certificate: null,
      }),
    ).toEqual({ status: "pending_review", legacyStudentId: null });
  });

  it("sends ambiguous email matches to pending_review", () => {
    expect(
      decideLegacyMatch({
        previouslyStudied: true,
        signupEmail: SIGNUP_EMAIL,
        declaredCertificateNumber: null,
        emailMatches: [
          legacyStudent({ id: "legacy-a" }),
          legacyStudent({ id: "legacy-b" }),
        ],
        certificate: null,
      }),
    ).toEqual({ status: "pending_review", legacyStudentId: null });
  });

  it("sends email vs certificate owner conflicts to pending_review", () => {
    expect(
      decideLegacyMatch({
        previouslyStudied: true,
        signupEmail: SIGNUP_EMAIL,
        declaredCertificateNumber: "AVT-2024-000111",
        emailMatches: [legacyStudent({ id: "legacy-email" })],
        certificate: certificate({
          legacy: legacyStudent({
            id: "legacy-cert",
            email: SIGNUP_EMAIL,
          }),
        }),
      }),
    ).toEqual({ status: "pending_review", legacyStudentId: null });
  });

  it("marks unmatched when no email or official certificate match exists", () => {
    expect(
      decideLegacyMatch({
        previouslyStudied: true,
        signupEmail: SIGNUP_EMAIL,
        declaredCertificateNumber: "AVT-1999-000000",
        emailMatches: [],
        certificate: null,
      }),
    ).toEqual({ status: "unmatched", legacyStudentId: null });
  });

  it("does not match on name, course, phone, or old certificate numbers", () => {
    const decision = decideLegacyMatch({
      previouslyStudied: true,
      signupEmail: SIGNUP_EMAIL,
      declaredCertificateNumber: "Conto2024-01-0050",
      emailMatches: [],
      certificate: null,
    });
    expect(decision.status).toBe("unmatched");
    expect(decision.legacyStudentId).toBeNull();
  });
});

describe("applyLegacyMatchDecision", () => {
  function createStore(options: {
    emailMatches?: LegacyStudentMatchRow[];
    certificate?: CertificateMatchRow | null;
    linkSucceeds?: boolean;
  }): LegacyMatchStore & {
    links: Array<{ legacyStudentId: string; profileId: string }>;
    statuses: Array<{ profileId: string; status: string }>;
    studentPassInserts: number;
  } {
    const links: Array<{ legacyStudentId: string; profileId: string }> = [];
    const statuses: Array<{ profileId: string; status: string }> = [];
    return {
      links,
      statuses,
      studentPassInserts: 0,
      findLegacyStudentsByEmail: async () => options.emailMatches ?? [],
      findCertificateByNumber: async () => options.certificate ?? null,
      linkLegacyStudent: async (legacyStudentId, profileId) => {
        if (options.linkSucceeds === false) return false;
        links.push({ legacyStudentId, profileId });
        return true;
      },
      updateProfileMatchStatus: async (profileId, status) => {
        statuses.push({ profileId, status });
      },
    };
  }

  it("does not query or link for a new student", async () => {
    const store = createStore({ emailMatches: [legacyStudent()] });
    const result = await applyLegacyMatchDecision(
      {
        profileId: "profile-1",
        email: SIGNUP_EMAIL,
        previouslyStudied: false,
        declaredCertificateNumber: null,
      },
      store,
    );
    expect(result.status).toBe("none");
    expect(store.links).toEqual([]);
    expect(store.statuses).toEqual([]);
    expect(store.studentPassInserts).toBe(0);
  });

  it("links a returning student without a certificate and never creates a Student Pass", async () => {
    const store = createStore({ emailMatches: [legacyStudent()] });
    const result = await applyLegacyMatchDecision(
      {
        profileId: "profile-1",
        email: SIGNUP_EMAIL,
        previouslyStudied: true,
        declaredCertificateNumber: null,
      },
      store,
    );
    expect(result).toEqual({ status: "linked", legacyStudentId: "legacy-ada" });
    expect(store.links).toEqual([
      { legacyStudentId: "legacy-ada", profileId: "profile-1" },
    ]);
    expect(store.statuses).toEqual([
      { profileId: "profile-1", status: "linked" },
    ]);
    expect(store.studentPassInserts).toBe(0);
    expect(hasActiveStudentPass(null)).toBe(false);
  });

  it("does not link when a race already attached the legacy row", async () => {
    const store = createStore({
      emailMatches: [legacyStudent()],
      linkSucceeds: false,
    });
    const result = await applyLegacyMatchDecision(
      {
        profileId: "profile-1",
        email: SIGNUP_EMAIL,
        previouslyStudied: true,
        declaredCertificateNumber: null,
      },
      store,
    );
    expect(result.status).toBe("pending_review");
    expect(store.statuses).toEqual([
      { profileId: "profile-1", status: "pending_review" },
    ]);
  });
});
