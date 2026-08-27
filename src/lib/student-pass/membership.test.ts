import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  STUDENT_PASS_PRICE_EUR,
  STUDENT_PASS_PRICE_LABEL,
} from "@/lib/admin/student-pass/types";
import {
  digitalMemberCardStatus,
  formatMembershipDate,
  membershipJoinedAt,
  PUBLIC_MEMBER_ID_FALLBACK,
  studentMemberId,
  toStudentMembershipCard,
} from "@/lib/student-pass/membership";

const PROFILE_ID = "a1b2c3d4-e5f6-4789-8abc-def012345678";
const PUBLIC_MEMBER_ID = "AVT-M-A1B2C3D4";

describe("Digital Membership identifier", () => {
  it("derives a public AVT-M-XXXXXXXX id from profiles.id", () => {
    expect(studentMemberId(PROFILE_ID)).toBe(PUBLIC_MEMBER_ID);
    expect(studentMemberId(` ${PROFILE_ID} `)).toBe(PUBLIC_MEMBER_ID);
    expect(studentMemberId(PROFILE_ID.replaceAll("-", ""))).toBe(
      PUBLIC_MEMBER_ID,
    );
  });

  it("is deterministic, uppercase, and has no dashes in the hex body", () => {
    expect(studentMemberId(PROFILE_ID)).toBe(studentMemberId(PROFILE_ID));
    expect(studentMemberId(PROFILE_ID.toUpperCase())).toBe(PUBLIC_MEMBER_ID);
    expect(studentMemberId(PROFILE_ID)).toMatch(/^AVT-M-[0-9A-F]{8}$/);
    expect(studentMemberId(PROFILE_ID).slice("AVT-M-".length)).not.toContain(
      "-",
    );
  });

  it("never exposes the full UUID as the public Member ID", () => {
    const card = toStudentMembershipCard({
      profileId: PROFILE_ID,
      firstName: "Imane",
      lastName: "Benali",
      email: "imane@example.test",
      profileCreatedAt: "2026-01-15T10:00:00.000Z",
      subscription: null,
    });
    expect(card.memberId).toBe(PUBLIC_MEMBER_ID);
    expect(card.memberId).not.toBe(PROFILE_ID);
    expect(card.memberId).not.toMatch(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
    );
  });

  it("falls back cleanly when the identifier is missing or invalid", () => {
    expect(studentMemberId("")).toBe(PUBLIC_MEMBER_ID_FALLBACK);
    expect(studentMemberId("   ")).toBe(PUBLIC_MEMBER_ID_FALLBACK);
    expect(studentMemberId(null)).toBe(PUBLIC_MEMBER_ID_FALLBACK);
    expect(studentMemberId(undefined)).toBe(PUBLIC_MEMBER_ID_FALLBACK);
    expect(studentMemberId("not-a-uuid")).toBe(PUBLIC_MEMBER_ID_FALLBACK);
    expect(studentMemberId("zzzz")).toBe(PUBLIC_MEMBER_ID_FALLBACK);
    expect(
      toStudentMembershipCard({
        profileId: "",
        email: "anon@example.test",
      }).memberId,
    ).toBe(PUBLIC_MEMBER_ID_FALLBACK);
  });
});

describe("Digital Member Card status", () => {
  const now = new Date("2026-08-27T12:00:00.000Z");

  it("is ACTIVE only when the existing Student Pass entitlement is true", () => {
    expect(
      digitalMemberCardStatus({ status: "active", expires_at: null }, now),
    ).toBe("ACTIVE");
    expect(
      digitalMemberCardStatus(
        { status: "active", expires_at: "2026-09-01T00:00:00.000Z" },
        now,
      ),
    ).toBe("ACTIVE");
  });

  it("is INACTIVE for missing, inactive, cancelled, expired, or past expiry", () => {
    expect(digitalMemberCardStatus(null, now)).toBe("INACTIVE");
    expect(
      digitalMemberCardStatus({ status: "inactive", expires_at: null }, now),
    ).toBe("INACTIVE");
    expect(
      digitalMemberCardStatus({ status: "cancelled", expires_at: null }, now),
    ).toBe("INACTIVE");
    expect(
      digitalMemberCardStatus({ status: "expired", expires_at: null }, now),
    ).toBe("INACTIVE");
    expect(
      digitalMemberCardStatus(
        { status: "active", expires_at: "2026-08-01T00:00:00.000Z" },
        now,
      ),
    ).toBe("INACTIVE");
  });
});

describe("membership date", () => {
  it("prefers Student Pass started_at over profile created_at", () => {
    expect(
      membershipJoinedAt({
        startedAt: "2026-03-01T00:00:00.000Z",
        profileCreatedAt: "2025-12-01T00:00:00.000Z",
      }),
    ).toBe("2026-03-01T00:00:00.000Z");
  });

  it("falls back to profile created_at when no subscription start exists", () => {
    expect(
      membershipJoinedAt({
        startedAt: null,
        profileCreatedAt: "2025-12-01T00:00:00.000Z",
      }),
    ).toBe("2025-12-01T00:00:00.000Z");
  });

  it("formats EN and AR dates without introducing a third locale", () => {
    expect(formatMembershipDate("2026-03-01T00:00:00.000Z", "en")).toMatch(
      /March/,
    );
    expect(formatMembershipDate("2026-03-01T00:00:00.000Z", "ar").length).toBeGreaterThan(4);
    expect(formatMembershipDate(null, "en")).toBe("—");
  });
});

describe("Student Pass commercial constants stay unchanged", () => {
  it("keeps the 12 € / month price", () => {
    expect(STUDENT_PASS_PRICE_EUR).toBe(12);
    expect(STUDENT_PASS_PRICE_LABEL).toBe("12 €/month");
  });
});

describe("membership module boundaries", () => {
  it("does not import Stripe, checkout, or webhooks", () => {
    const source = readFileSync(
      path.join(process.cwd(), "src/lib/student-pass/membership.ts"),
      "utf8",
    );
    const load = readFileSync(
      path.join(process.cwd(), "src/lib/student-pass/load.ts"),
      "utf8",
    );
    expect(`${source}\n${load}`).not.toMatch(/stripe|checkout|webhook/i);
  });

  it("does not add a QR or new member_number column", () => {
    const source = readFileSync(
      path.join(process.cwd(), "src/lib/student-pass/membership.ts"),
      "utf8",
    );
    const card = readFileSync(
      path.join(process.cwd(), "src/components/DigitalMemberCard.tsx"),
      "utf8",
    );
    const client = readFileSync(
      path.join(process.cwd(), "src/components/DashboardStudentPassClient.tsx"),
      "utf8",
    );
    const adminClient = readFileSync(
      path.join(process.cwd(), "src/components/admin/StudentPassClient.tsx"),
      "utf8",
    );
    const adminList = readFileSync(
      path.join(process.cwd(), "src/lib/admin/student-pass/list.ts"),
      "utf8",
    );
    expect(source).not.toMatch(/qrcode|member_number/i);
    expect(card).not.toMatch(/qrcode|QR/i);
    expect(client).not.toMatch(/from ["']@\/lib\/student-pass\/load["']/);
    expect(card).toMatch(/card\.memberId/);
    expect(card).not.toMatch(/profileId/);
    expect(adminClient).toMatch(/studentMemberId\(member\.profileId\)/);
    expect(adminClient).not.toMatch(
      /<td className="admin-member-id"[^>]*>\s*\{member\.profileId\}/,
    );
    expect(adminList).toMatch(/studentMemberId\(item\.profileId\)/);
  });
});
