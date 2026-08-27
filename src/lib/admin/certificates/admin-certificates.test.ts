import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  CERTIFICATE_ISSUANCE_ENABLED,
  CERTIFICATE_REVOKE_ENABLED,
  type AdminCertificateHolder,
  type AdminCertificateListItem,
} from "@/lib/admin/certificates/types";
import {
  buildIssuancePreview,
  certificateHolderKind,
  duplicateLookupsForCompletion,
  duplicateLookupsForEnrollment,
  enrollmentStatusLabel,
  filterCertificates,
  findBlockingCertificate,
  formatCourseTitle,
  formatHolderKey,
  parseHolderKey,
  parseItemKey,
  searchIssuanceHolders,
  summarizeCertificates,
} from "@/lib/admin/certificates/query";

const LEGACY_ID = "11111111-1111-4111-8111-111111111111";
const PROFILE_ID = "22222222-2222-4222-8222-222222222222";
const COURSE_ID = "33333333-3333-4333-8333-333333333333";
const COMPLETION_ID = "44444444-4444-4444-8444-444444444444";
const CERT_ID = "55555555-5555-4555-8555-555555555555";

function cert(
  overrides: Partial<AdminCertificateListItem> = {},
): AdminCertificateListItem {
  return {
    id: CERT_ID,
    certificateNumber: "AVT-2026-000002",
    holderDisplayName: "Lina Nasser",
    courseTitleEn: "Gratitude Course",
    courseTitleAr: "دورة الشكر",
    issuedAt: "2026-08-01",
    status: "issued",
    oldCertificateNumber: "Conto2024-01-0050",
    holderKind: "legacy",
    profileId: null,
    legacyStudentId: LEGACY_ID,
    enrollmentId: null,
    legacyCompletionId: COMPLETION_ID,
    courseId: COURSE_ID,
    language: "ar",
    ...overrides,
  };
}

function holder(
  overrides: Partial<AdminCertificateHolder> = {},
): AdminCertificateHolder {
  return {
    key: formatHolderKey("legacy", LEGACY_ID),
    kind: "legacy",
    name: "Lina Nasser",
    email: "lina@example.com",
    profileId: null,
    legacyStudentId: LEGACY_ID,
    linkedProfileId: null,
    ...overrides,
  };
}

describe("admin certificate search", () => {
  const rows = [
    cert(),
    cert({
      id: "66666666-6666-4666-8666-666666666666",
      certificateNumber: "AVT-2026-000003",
      holderDisplayName: "Omar Haddad",
      courseTitleEn: "Kontou Course",
      courseTitleAr: "دورة الكونتو",
      oldCertificateNumber: null,
      status: "revoked",
      holderKind: "modern",
      profileId: PROFILE_ID,
      legacyStudentId: null,
      legacyCompletionId: null,
    }),
  ];

  it("filters by official number, old number, holder name, and course", () => {
    expect(filterCertificates(rows, "AVT-2026-000002")).toHaveLength(1);
    expect(filterCertificates(rows, "conto2024")).toHaveLength(1);
    expect(filterCertificates(rows, "Omar")).toHaveLength(1);
    expect(filterCertificates(rows, "الكونتو")).toHaveLength(1);
    expect(filterCertificates(rows, "missing")).toHaveLength(0);
  });

  it("summarizes issued and revoked totals from the full set", () => {
    expect(summarizeCertificates(rows)).toEqual({
      total: 2,
      issued: 1,
      revoked: 1,
    });
  });
});

describe("admin issuance student search", () => {
  const holders = [
    holder(),
    holder({
      key: formatHolderKey("modern", PROFILE_ID),
      kind: "modern",
      name: "Omar Haddad",
      email: "omar@example.com",
      profileId: PROFILE_ID,
      legacyStudentId: null,
    }),
  ];

  it("requires a query and distinguishes modern from legacy", () => {
    expect(searchIssuanceHolders(holders, "")).toEqual([]);
    expect(searchIssuanceHolders(holders, "Lina").map((row) => row.kind)).toEqual([
      "legacy",
    ]);
    expect(searchIssuanceHolders(holders, "omar@").map((row) => row.kind)).toEqual([
      "modern",
    ]);
  });

  it("matches a full name even when Next.js keeps '+' from the query string", () => {
    const sara = holder({
      name: "Sara Benali",
      email: "sara.benali@example.com",
    });
    const found = searchIssuanceHolders([sara, ...holders], "Sara+Benali");
    expect(found.map((row) => row.name)).toEqual(["Sara Benali"]);
    expect(
      searchIssuanceHolders([sara], "Sara Benali").map((row) => row.name),
    ).toEqual(["Sara Benali"]);
    expect(searchIssuanceHolders([sara], "Benali").map((row) => row.name)).toEqual(
      ["Sara Benali"],
    );
    expect(
      searchIssuanceHolders([sara], "sara.benali@example.com").map(
        (row) => row.name,
      ),
    ).toEqual(["Sara Benali"]);
  });

  it("does not require a certificate or an activated account to appear", () => {
    const unactivated = holder({
      name: "Sara Benali",
      email: null,
      profileId: null,
      linkedProfileId: null,
    });
    expect(searchIssuanceHolders([unactivated], "Sara Benali")).toHaveLength(1);
  });

  it("rejects invented holder keys", () => {
    expect(parseHolderKey("legacy:not-a-uuid")).toBeNull();
    expect(parseHolderKey(`legacy:${LEGACY_ID}`)).toEqual({
      kind: "legacy",
      id: LEGACY_ID,
    });
    expect(parseHolderKey(`profile:${PROFILE_ID}`)).toEqual({
      kind: "modern",
      id: PROFILE_ID,
    });
    expect(parseItemKey(`completion:${COMPLETION_ID}`)?.source).toBe(
      "completion",
    );
  });

  it("labels modern, legacy, and linked holders", () => {
    expect(
      certificateHolderKind({ profileId: PROFILE_ID, legacyStudentId: null }),
    ).toBe("modern");
    expect(
      certificateHolderKind({ profileId: null, legacyStudentId: LEGACY_ID }),
    ).toBe("legacy");
    expect(
      certificateHolderKind({
        profileId: PROFILE_ID,
        legacyStudentId: LEGACY_ID,
      }),
    ).toBe("linked");
  });
});

describe("completion display and duplicate detection", () => {
  it("shows historical completion status without inventing a course English title", () => {
    expect(enrollmentStatusLabel("completed")).toBe("Enrollment completed");
    expect(formatCourseTitle("", "دورة الشكر")).toBe("دورة الشكر");
  });

  it("blocks on legacy_completion_id", () => {
    const existing = cert();
    const found = findBlockingCertificate(
      [existing],
      duplicateLookupsForCompletion({
        legacyCompletionId: COMPLETION_ID,
        legacyStudentId: LEGACY_ID,
        courseId: COURSE_ID,
        linkedProfileId: null,
      }),
    );
    expect(found?.certificateNumber).toBe("AVT-2026-000002");
  });

  it("blocks on (legacy_student_id, course_id)", () => {
    const existing = cert({ legacyCompletionId: null });
    const found = findBlockingCertificate(
      [existing],
      duplicateLookupsForCompletion({
        legacyCompletionId: "77777777-7777-4777-8777-777777777777",
        legacyStudentId: LEGACY_ID,
        courseId: COURSE_ID,
        linkedProfileId: null,
      }),
    );
    expect(found?.certificateNumber).toBe("AVT-2026-000002");
  });

  it("blocks on (profile_id, course_id)", () => {
    const existing = cert({
      profileId: PROFILE_ID,
      legacyStudentId: null,
      legacyCompletionId: null,
      holderKind: "modern",
    });
    const found = findBlockingCertificate(
      [existing],
      duplicateLookupsForEnrollment({
        profileId: PROFILE_ID,
        courseId: COURSE_ID,
        linkedLegacyStudentIds: [],
      }),
    );
    expect(found?.certificateNumber).toBe("AVT-2026-000002");
  });

  it("does not match a test certificate with a null course_id against a real course", () => {
    const testCert = cert({
      certificateNumber: "AVT-2026-000001",
      courseId: null,
      legacyCompletionId: null,
      courseTitleEn: "Avatar Certificate Verification Test",
    });
    const found = findBlockingCertificate(
      [testCert],
      duplicateLookupsForEnrollment({
        profileId: PROFILE_ID,
        courseId: COURSE_ID,
        linkedLegacyStudentIds: [LEGACY_ID],
      }),
    );
    expect(found).toBeNull();
  });
});

describe("issuance preview flags", () => {
  it("enables issuance in Lot 3B and keeps revoke disabled", () => {
    expect(CERTIFICATE_ISSUANCE_ENABLED).toBe(true);
    expect(CERTIFICATE_REVOKE_ENABLED).toBe(false);
  });

  it("builds public snapshots without allocating a number", () => {
    const item = {
      key: `completion:${COMPLETION_ID}`,
      source: "completion" as const,
      courseId: COURSE_ID,
      courseTitleEn: "Gratitude Course",
      courseTitleAr: "دورة الشكر",
      statusLabel: "Historical completion 2024-01-15",
      oldCertificateNumber: "Conto2024-01-0050",
      language: "ar" as const,
      existingCertificateNumber: null,
    };
    const preview = buildIssuancePreview({
      holder: holder(),
      item,
      proposedIssuedAt: "2026-08-18",
    });
    expect(preview.holderDisplayName).toBe("Lina Nasser");
    expect(preview.courseTitleAr).toBe("دورة الشكر");
    expect(preview.alreadyExists).toBe(false);
    expect(preview.issuanceEnabled).toBe(true);
    expect(JSON.stringify(preview)).not.toMatch(/next_certificate_number/);
  });

  it("surfaces Certificate already exists with the official number", () => {
    const preview = buildIssuancePreview({
      holder: holder(),
      item: {
        key: `completion:${COMPLETION_ID}`,
        source: "completion",
        courseId: COURSE_ID,
        courseTitleEn: "Gratitude Course",
        courseTitleAr: "دورة الشكر",
        statusLabel: "Historical completion 2024-01-15",
        oldCertificateNumber: "Conto2024-01-0050",
        language: "ar",
        existingCertificateNumber: "AVT-2026-000002",
      },
      proposedIssuedAt: "2026-08-18",
    });
    expect(preview.alreadyExists).toBe(true);
    expect(preview.existingCertificateNumber).toBe("AVT-2026-000002");
  });
});

describe("admin certificates source invariants", () => {
  const files = [
    "src/lib/admin/certificates/types.ts",
    "src/lib/admin/certificates/query.ts",
    "src/lib/admin/certificates/load.ts",
    "src/app/admin/(console)/certificates/page.tsx",
    "src/components/admin/CertificatesClient.tsx",
  ];

  it("does not call next_certificate_number or mutate certificates from the list/preview layer", () => {
    for (const relative of files) {
      const source = readFileSync(path.resolve(process.cwd(), relative), "utf8");
      expect(source).not.toMatch(/next_certificate_number/);
      expect(source).not.toMatch(/\.insert\s*\(/);
      expect(source).not.toMatch(/\.update\s*\(/);
      expect(source).not.toMatch(/\.delete\s*\(/);
      expect(source).not.toMatch(/rpc\("issue_certificate"/);
    }
  });

  it("does not select phone, notes, or revoked_reason", () => {
    const load = readFileSync(
      path.resolve(process.cwd(), "src/lib/admin/certificates/load.ts"),
      "utf8",
    );
    expect(load).not.toMatch(/\bphone\b/);
    expect(load).not.toMatch(/\bnotes\b/);
    expect(load).not.toMatch(/revoked_reason/);
    expect(load).toMatch(/id, full_name, email, linked_profile_id/);
    expect(load).toMatch(/id, email, first_name, last_name, locale/);
  });

  it("keeps list and holder payloads free of private fields", () => {
    const listKeys = Object.keys(cert());
    const holderKeys = Object.keys(holder());
    for (const leaked of ["phone", "notes", "revokedReason", "revoked_reason"]) {
      expect(listKeys).not.toContain(leaked);
      expect(holderKeys).not.toContain(leaked);
    }
  });

  it("keeps Issue certificate behind confirmation and a disabled-when-invalid button", () => {
    const client = readFileSync(
      path.resolve(
        process.cwd(),
        "src/components/admin/CertificatesClient.tsx",
      ),
      "utf8",
    );
    expect(client).toMatch(/Issue certificate/);
    expect(client).toMatch(/window\.confirm/);
    expect(client).toMatch(/canSubmitIssuance/);
    expect(client).toMatch(/issueCertificateAction/);
    expect(client).not.toMatch(/next_certificate_number/);
    expect(client).not.toMatch(/Revoke certificate/);
  });
});
