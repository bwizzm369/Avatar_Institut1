import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  studentCertificatePdfPath,
  studentCertificateVerifyPath,
  studentOwnsCertificate,
  toStudentCertificateListItem,
} from "@/lib/certificates/student-view";
import {
  isCertificatePdfDownloadAvailable,
  isOfficialCertificatePdfOriginConfigured,
} from "@/lib/certificates/verification-url";
import { msg } from "@/lib/i18n";

const ENV_KEYS = ["NEXT_PUBLIC_APP_URL"] as const;
const originalEnv = Object.fromEntries(
  ENV_KEYS.map((key) => [key, process.env[key]]),
) as Record<(typeof ENV_KEYS)[number], string | undefined>;

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (originalEnv[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = originalEnv[key];
    }
  }
});

const USER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_ID = "22222222-2222-4222-8222-222222222222";
const LEGACY_ID = "33333333-3333-4333-8333-333333333333";

describe("student certificate ownership", () => {
  it("allows a modern certificate linked to the signed-in profile", () => {
    expect(
      studentOwnsCertificate(USER_ID, {
        profileId: USER_ID,
        legacyStudentId: null,
      }),
    ).toBe(true);
  });

  it("allows a legacy certificate whose student is linked to the profile", () => {
    expect(
      studentOwnsCertificate(
        USER_ID,
        { profileId: null, legacyStudentId: LEGACY_ID },
        [LEGACY_ID],
      ),
    ).toBe(true);
  });

  it("rejects another student's modern certificate", () => {
    expect(
      studentOwnsCertificate(USER_ID, {
        profileId: OTHER_ID,
        legacyStudentId: null,
      }),
    ).toBe(false);
  });

  it("rejects a legacy certificate that is not linked to the profile", () => {
    expect(
      studentOwnsCertificate(
        USER_ID,
        { profileId: null, legacyStudentId: LEGACY_ID },
        [],
      ),
    ).toBe(false);
  });

  it("does not leak private fields on the dashboard list item", () => {
    const item = toStudentCertificateListItem({
      certificateNumber: "AVT-2026-000002",
      courseTitleEn: "Foundations of Consciousness",
      courseTitleAr: "أسس الوعي",
      issuedAt: "2026-03-15",
      language: "en",
      status: "issued",
    });
    expect(JSON.stringify(item)).not.toMatch(/email|phone|notes|profileId|uuid/i);
    expect(item.certificateNumber).toBe("AVT-2026-000002");
  });
});

describe("student certificate paths", () => {
  it("links verification to the existing public verify page", () => {
    expect(studentCertificateVerifyPath("AVT-2026-000002")).toBe(
      "/verify/AVT-2026-000002",
    );
  });

  it("uses a student PDF route distinct from the admin download", () => {
    expect(studentCertificatePdfPath("AVT-2026-000002")).toBe(
      "/api/dashboard/certificates/AVT-2026-000002/pdf",
    );
    expect(studentCertificatePdfPath("AVT-2026-000002")).not.toMatch(
      /\/api\/admin\//,
    );
  });

  it("labels the dashboard download in EN and AR", () => {
    expect(msg("dashboard.certificateDownload", "en")).toBe("Download PDF");
    expect(msg("dashboard.certificateDownload", "ar")).toBe("تحميل PDF");
    expect(msg("dashboard.certificateView", "en")).toBe("View verification");
    expect(msg("dashboard.certificateView", "ar")).toBe("عرض التحقق");
  });
});

describe("official student PDF availability", () => {
  it("keeps the strict official-origin check false on localhost", () => {
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    expect(isOfficialCertificatePdfOriginConfigured()).toBe(false);
  });

  it("allows dashboard download on localhost in local/dev", () => {
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    expect(
      isCertificatePdfDownloadAvailable({
        NEXT_PUBLIC_APP_URL: "http://localhost:3000",
        NODE_ENV: "development",
      }),
    ).toBe(true);
  });

  it("refuses localhost download in production", () => {
    expect(
      isCertificatePdfDownloadAvailable({
        NEXT_PUBLIC_APP_URL: "http://localhost:3000",
        NODE_ENV: "production",
        VERCEL_ENV: "production",
      }),
    ).toBe(false);
  });

  it("is available with a public HTTPS origin", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://academy.example.test";
    expect(isOfficialCertificatePdfOriginConfigured()).toBe(true);
    expect(isCertificatePdfDownloadAvailable()).toBe(true);
  });
});

describe("student certificate source invariants", () => {
  it("reuses the official PDF generator and never issues a certificate", () => {
    const route = readFileSync(
      path.resolve(
        process.cwd(),
        "src/app/api/dashboard/certificates/[certificateNumber]/pdf/route.ts",
      ),
      "utf8",
    );
    expect(route).toMatch(/generateCertificatePdf/);
    expect(route).toMatch(/loadOwnedStudentCertificatePdfRecord/);
    expect(route).toMatch(/getUser/);
    expect(route).not.toMatch(/generateCertificatePreviewPdf/);
    expect(route).not.toMatch(/next_certificate_number/);
    expect(route).not.toMatch(/issue_certificate/);
    expect(route).toMatch(/maxDuration = 60/);
    expect(route).toMatch(/export const runtime = "nodejs"/);
    expect(route).not.toMatch(/runtime = "edge"/);
    expect(route).not.toMatch(/SUPABASE_SECRET_KEY|SERVICE_ROLE/);
  });

  it("does not issue certificates or allocate numbers from the dashboard list", () => {
    const source = readFileSync(
      path.resolve(process.cwd(), "src/lib/certificates/student.ts"),
      "utf8",
    );
    const view = readFileSync(
      path.resolve(process.cwd(), "src/lib/certificates/student-view.ts"),
      "utf8",
    );
    expect(view).toMatch(/certificate_is_own/);
    expect(source).toMatch(/isCertificatePdfDownloadAvailable/);
    expect(source).toMatch(/studentOwnsCertificate/);
    expect(source).toMatch(/linked_profile_id/);
    expect(source).toMatch(/\.from\("certificates"\)/);
    expect(source).toMatch(/\.select\(/);
    expect(source).not.toMatch(/insert\(|update\(|upsert\(/);
    expect(source).not.toMatch(/next_certificate_number/);
    expect(source).not.toMatch(/issue_certificate/);
    expect(view).not.toMatch(/next_certificate_number/);
    expect(view).not.toMatch(/issue_certificate/);
  });

  it("isolates cookie-based Supabase loading from the client-safe view module", () => {
    const view = readFileSync(
      path.resolve(process.cwd(), "src/lib/certificates/student-view.ts"),
      "utf8",
    );
    expect(view).not.toMatch(/@\/lib\/supabase\/server/);
    expect(view).not.toMatch(/next\/headers/);
    expect(view).not.toMatch(/createServerSupabaseClient/);
  });

  it("keeps the dashboard certificates page on the existing route", () => {
    const page = readFileSync(
      path.resolve(process.cwd(), "src/app/dashboard/certificates/page.tsx"),
      "utf8",
    );
    expect(page).toMatch(/loadStudentCertificatesState/);
    expect(page).toMatch(/DashboardCertificatesClient/);
    expect(page).not.toMatch(/issue_certificate|next_certificate_number/);
  });

  it("does not import the cookie Supabase server client from the Client Component", () => {
    const client = readFileSync(
      path.resolve(
        process.cwd(),
        "src/components/DashboardCertificatesClient.tsx",
      ),
      "utf8",
    );
    expect(client).toMatch(/@\/lib\/certificates\/student-view/);
    expect(client).toMatch(/dashboard\.certificateDownload/);
    expect(client).toMatch(/dashboard\.certificateView/);
    expect(client.indexOf("certificateDownload")).toBeLessThan(
      client.indexOf("certificateView"),
    );
    expect(client).not.toMatch(/@\/lib\/certificates\/student"/);
    expect(client).not.toMatch(/@\/lib\/supabase\/server/);
    expect(client).not.toMatch(/next\/headers/);
  });
});
