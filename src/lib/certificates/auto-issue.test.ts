import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { PreparedCertificateIssuance } from "@/lib/admin/certificates/issue";
import {
  evaluateModernCourseAutoIssueEligibility,
  maybeIssueModernCourseCertificate,
  type ModernCourseAutoIssueSnapshot,
  type ModernCourseAutoIssueStore,
} from "@/lib/certificates/auto-issue";

const ACTOR = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";
const COURSE = "33333333-3333-4333-8333-333333333333";
const ENROLLMENT = "44444444-4444-4444-8444-444444444444";
const OTHER_COURSE = "55555555-5555-4555-8555-555555555555";
const LESSONS = [
  "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
  "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2",
  "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3",
  "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4",
  "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5",
] as const;

function snapshot(
  overrides: Partial<ModernCourseAutoIssueSnapshot> = {},
): ModernCourseAutoIssueSnapshot {
  return {
    actorUserId: ACTOR,
    courseId: COURSE,
    enrollment: {
      id: ENROLLMENT,
      user_id: ACTOR,
      course_id: COURSE,
      status: "active",
      payment_confirmed_at: "2026-08-01T00:00:00.000Z",
    },
    lessonIds: [...LESSONS],
    completedLessonIds: [...LESSONS],
    existingCertificateNumber: null,
    holderDisplayName: "Omar Haddad",
    profileRole: "student",
    profileLocale: "ar",
    isDemo: false,
    legacyOnly: false,
    courseFound: true,
    ...overrides,
  };
}

function createStore(
  overrides: Partial<ModernCourseAutoIssueStore> = {},
): {
  store: ModernCourseAutoIssueStore;
  payloads: PreparedCertificateIssuance[];
} {
  const payloads: PreparedCertificateIssuance[] = [];
  const store: ModernCourseAutoIssueStore = {
    loadCourse: async () => ({
      id: COURSE,
      title_en: "Gratitude Course",
      title_ar: "دورة الشكر",
    }),
    listLinkedLegacyIds: async () => [],
    findDuplicates: async () => [],
    issueAtomic: async (payload) => {
      payloads.push(payload);
      return {
        data: {
          certificate_number: `AVT-${payload.year}-000010`,
          already_existed: false,
          status: "issued",
          holder_display_name: payload.holderDisplayName,
          course_title_en: payload.courseTitleEn,
          course_title_ar: payload.courseTitleAr,
          issued_at: payload.issuedAt,
        },
        error: null,
      };
    },
    ...overrides,
  };
  return { store, payloads };
}

describe("evaluateModernCourseAutoIssueEligibility", () => {
  it("refuses 80% progress", () => {
    const result = evaluateModernCourseAutoIssueEligibility(
      snapshot({
        completedLessonIds: LESSONS.slice(0, 4),
      }),
    );
    expect(result).toEqual({ eligible: false, reason: "not_complete" });
  });

  it("accepts 100% of a course with lessons", () => {
    expect(evaluateModernCourseAutoIssueEligibility(snapshot())).toEqual({
      eligible: true,
    });
  });

  it("refuses a course with no lessons", () => {
    expect(
      evaluateModernCourseAutoIssueEligibility(
        snapshot({ lessonIds: [], completedLessonIds: [] }),
      ),
    ).toEqual({ eligible: false, reason: "no_lessons" });
  });

  it("refuses when a certificate already exists for the profile and course", () => {
    expect(
      evaluateModernCourseAutoIssueEligibility(
        snapshot({ existingCertificateNumber: "AVT-2026-000001" }),
      ),
    ).toEqual({ eligible: false, reason: "already_issued" });
  });

  it("refuses student A using student B's enrollment", () => {
    expect(
      evaluateModernCourseAutoIssueEligibility(
        snapshot({
          enrollment: {
            id: ENROLLMENT,
            user_id: OTHER,
            course_id: COURSE,
            status: "active",
            payment_confirmed_at: "2026-08-01T00:00:00.000Z",
          },
        }),
      ),
    ).toEqual({ eligible: false, reason: "enrollment_not_owned" });
  });

  it("refuses an enrollment for a different course", () => {
    expect(
      evaluateModernCourseAutoIssueEligibility(
        snapshot({
          enrollment: {
            id: ENROLLMENT,
            user_id: ACTOR,
            course_id: OTHER_COURSE,
            status: "active",
            payment_confirmed_at: "2026-08-01T00:00:00.000Z",
          },
        }),
      ),
    ).toEqual({ eligible: false, reason: "enrollment_course_mismatch" });
  });

  it("refuses Student Pass access without an enrollment", () => {
    expect(
      evaluateModernCourseAutoIssueEligibility(snapshot({ enrollment: null })),
    ).toEqual({ eligible: false, reason: "no_enrollment" });
  });
});

describe("maybeIssueModernCourseCertificate", () => {
  it("does not call the issuer at 80%", async () => {
    let created = false;
    const result = await maybeIssueModernCourseCertificate({
      snapshot: snapshot({ completedLessonIds: LESSONS.slice(0, 4) }),
      issuedAt: "2026-08-20",
      createIssueStore: () => {
        created = true;
        return createStore().store;
      },
    });
    expect(created).toBe(false);
    expect(result).toEqual({ status: "skipped", reason: "not_complete" });
  });

  it("issues through the existing RPC store at 100%", async () => {
    const { store, payloads } = createStore();
    const result = await maybeIssueModernCourseCertificate({
      snapshot: snapshot(),
      issuedAt: "2026-08-20",
      createIssueStore: () => store,
    });
    expect(result).toEqual({
      status: "issued",
      certificateNumber: "AVT-2026-000010",
    });
    expect(payloads).toHaveLength(1);
    expect(payloads[0]?.profileId).toBe(ACTOR);
    expect(payloads[0]?.courseId).toBe(COURSE);
    expect(payloads[0]?.enrollmentId).toBe(ENROLLMENT);
    expect(payloads[0]?.legacyCompletionId).toBeNull();
    expect(payloads[0]).not.toHaveProperty("certificateNumber");
  });

  it("does not allocate a second number on a second call", async () => {
    let created = 0;
    let atomicCalls = 0;
    const first = await maybeIssueModernCourseCertificate({
      snapshot: snapshot(),
      issuedAt: "2026-08-20",
      createIssueStore: () => {
        created += 1;
        return createStore({
          issueAtomic: async (payload) => {
            atomicCalls += 1;
            return {
              data: {
                certificate_number: `AVT-${payload.year}-000010`,
                already_existed: false,
                status: "issued",
                holder_display_name: payload.holderDisplayName,
                course_title_en: payload.courseTitleEn,
                course_title_ar: payload.courseTitleAr,
                issued_at: payload.issuedAt,
              },
              error: null,
            };
          },
        }).store;
      },
    });
    const second = await maybeIssueModernCourseCertificate({
      snapshot: snapshot({ existingCertificateNumber: "AVT-2026-000010" }),
      issuedAt: "2026-08-20",
      createIssueStore: () => {
        created += 1;
        return createStore({
          issueAtomic: async () => {
            atomicCalls += 1;
            return { data: null, error: null };
          },
        }).store;
      },
    });
    expect(first).toEqual({
      status: "issued",
      certificateNumber: "AVT-2026-000010",
    });
    expect(second).toEqual({
      status: "already_issued",
      certificateNumber: "AVT-2026-000010",
    });
    expect(created).toBe(1);
    expect(atomicCalls).toBe(1);
  });

  it("never issues student B's certificate from student A's snapshot", async () => {
    let created = false;
    const result = await maybeIssueModernCourseCertificate({
      snapshot: snapshot({
        enrollment: {
          id: ENROLLMENT,
          user_id: OTHER,
          course_id: COURSE,
          status: "active",
          payment_confirmed_at: "2026-08-01T00:00:00.000Z",
        },
      }),
      issuedAt: "2026-08-20",
      createIssueStore: () => {
        created = true;
        return createStore().store;
      },
    });
    expect(created).toBe(false);
    expect(result).toEqual({
      status: "skipped",
      reason: "enrollment_not_owned",
    });
  });

  it("issues nothing for a course without lessons", async () => {
    let created = false;
    const result = await maybeIssueModernCourseCertificate({
      snapshot: snapshot({ lessonIds: [], completedLessonIds: [] }),
      issuedAt: "2026-08-20",
      createIssueStore: () => {
        created = true;
        return createStore().store;
      },
    });
    expect(created).toBe(false);
    expect(result).toEqual({ status: "skipped", reason: "no_lessons" });
  });

  it("does not consume a new number when a certificate already exists", async () => {
    let atomicCalls = 0;
    const result = await maybeIssueModernCourseCertificate({
      snapshot: snapshot({ existingCertificateNumber: "AVT-2026-000001" }),
      issuedAt: "2026-08-20",
      createIssueStore: () =>
        createStore({
          issueAtomic: async () => {
            atomicCalls += 1;
            return { data: null, error: null };
          },
        }).store,
    });
    expect(atomicCalls).toBe(0);
    expect(result).toEqual({
      status: "already_issued",
      certificateNumber: "AVT-2026-000001",
    });
  });

  it("treats a concurrent unique hit as already issued without a new number", async () => {
    let atomicCalls = 0;
    const result = await maybeIssueModernCourseCertificate({
      snapshot: snapshot(),
      issuedAt: "2026-08-20",
      createIssueStore: () =>
        createStore({
          issueAtomic: async () => {
            atomicCalls += 1;
            return {
              data: {
                certificate_number: "AVT-2026-000001",
                already_existed: true,
                status: "issued",
                holder_display_name: "Omar Haddad",
                course_title_en: "Gratitude Course",
                course_title_ar: "دورة الشكر",
                issued_at: "2026-08-20",
              },
              error: null,
            };
          },
        }).store,
    });
    expect(atomicCalls).toBe(1);
    expect(result).toEqual({
      status: "already_issued",
      certificateNumber: "AVT-2026-000001",
    });
  });
});

describe("auto-issue source invariants", () => {
  it("reuses issue_certificate via the existing store and never grants students the RPC", () => {
    const source = readFileSync(
      path.resolve(process.cwd(), "src/lib/certificates/auto-issue.ts"),
      "utf8",
    );
    const actions = readFileSync(
      path.resolve(process.cwd(), "src/lib/learning/actions.ts"),
      "utf8",
    );
    expect(source).toMatch(/issuePreparedCertificate/);
    expect(source).toMatch(/createIssueStore/);
    expect(source).not.toMatch(/next_certificate_number/);
    expect(source).not.toMatch(/from\("certificates"\)\s*\n\s*\.insert/);
    expect(source).not.toMatch(/rpc\("issue_certificate"/);
    expect(source).not.toMatch(/GRANT EXECUTE/);
    expect(source).not.toMatch(/is_admin\(\)/);
    expect(actions).toMatch(/maybeIssueModernCourseCertificate/);
    expect(actions).toMatch(/createServiceRoleSupabaseClient/);
    expect(actions).toMatch(/createCertificateIssueStore/);
    expect(actions).not.toMatch(/\.rpc\("issue_certificate"/);
    expect(actions).not.toMatch(/context:\s*"student"/);
  });

  it("keeps issueCertificate admin-only so students cannot call the RPC with their JWT", () => {
    const source = readFileSync(
      path.resolve(process.cwd(), "src/lib/admin/certificates/issue.ts"),
      "utf8",
    );
    expect(source).toMatch(/return context === "admin"/);
    expect(source).toMatch(/rpc\("issue_certificate"/);
    expect(source).toMatch(/export async function issuePreparedCertificate/);
  });
});
