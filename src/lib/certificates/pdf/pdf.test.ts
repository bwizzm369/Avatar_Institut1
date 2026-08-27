import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import jsQR from "jsqr";
import { PNG } from "pngjs";
import { denyCertificatePdfAccess } from "@/lib/certificates/pdf/access";
import { countPdfImageXObjects } from "@/lib/certificates/pdf/document";
import { generateCertificatePdf, generateCertificatePreviewPdf } from "@/lib/certificates/pdf/generate";
import {
  CERTIFICATE_FRAME_RELATIVE_PATH,
  OFFICIAL_LOGO_RELATIVE_PATH,
} from "@/lib/certificates/pdf/assets";
import {
  buildCertificateTemplateHtml,
  CERTIFICATE_PDF_PREVIEW_MARK,
} from "@/lib/certificates/pdf/template";
import { buildCertificateQrArtifact } from "@/lib/certificates/qr";
import {
  buildCertificatePdfModel,
  CERTIFICATE_PDF_SELECT_COLUMNS,
  certificatePdfDownloadPath,
  certificatePdfFilename,
  certificatePdfPreviewFilename,
  certificatePdfPreviewPath,
  pdfModelHasPrivateFields,
  resolveCertificatePdfLocale,
  type CertificatePdfRecord,
} from "@/lib/certificates/pdf/model";
import {
  CertificatePdfPreviewDisabledError,
  OfficialPdfOriginError,
} from "@/lib/certificates/pdf/origin-error";
import { isCertificatePdfPreviewEnvironment } from "@/lib/certificates/pdf/preview-env";

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

function decodeQrPng(bytes: Uint8Array): string | null {
  const png = PNG.sync.read(Buffer.from(bytes));
  return (
    jsQR(
      new Uint8ClampedArray(
        png.data.buffer,
        png.data.byteOffset,
        png.data.byteLength,
      ),
      png.width,
      png.height,
    )?.data ?? null
  );
}

function issuedRecord(
  overrides: Partial<CertificatePdfRecord> = {},
): CertificatePdfRecord {
  return {
    certificateNumber: "AVT-2026-000002",
    holderDisplayName: "Sara Benali",
    courseTitleEn: "Foundations of Consciousness",
    courseTitleAr: "أسس الوعي",
    issuedAt: "2026-03-15",
    language: "en",
    status: "issued",
    ...overrides,
  };
}

describe("certificate PDF access", () => {
  it("refuses a student session", () => {
    const denied = denyCertificatePdfAccess({
      status: "forbidden",
      profile: null,
    });
    expect(denied?.status).toBe(403);
    expect(denied?.error).toMatch(/administrators only/i);
  });

  it("refuses an unauthenticated caller", () => {
    expect(denyCertificatePdfAccess({ status: "unauthenticated" })?.status).toBe(
      401,
    );
  });

  it("allows an admin session", () => {
    expect(
      denyCertificatePdfAccess({
        status: "ok",
        userId: "admin-1",
        profile: {
          id: "admin-1",
          email: "admin@example.com",
          first_name: "Ada",
          last_name: "Admin",
          role: "admin",
        },
      }),
    ).toBeNull();
  });
});

describe("certificate PDF model", () => {
  it("uses English when language is null", () => {
    expect(resolveCertificatePdfLocale(null)).toBe("en");
    const model = buildCertificatePdfModel(issuedRecord({ language: null }));
    expect(model.locale).toBe("en");
    expect(model.direction).toBe("ltr");
    expect(model.copy.title).toBe("Certificate");
  });

  it("uses Arabic RTL and the Arabic course title", () => {
    const model = buildCertificatePdfModel(issuedRecord({ language: "ar" }));
    expect(model.direction).toBe("rtl");
    expect(model.courseTitle).toBe("أسس الوعي");
    expect(model.copy.title).toBe("شهادة");
    expect(model.copy.revoked).toBe("ملغاة");
  });

  it("falls back to the other language when the requested title is empty", () => {
    expect(
      buildCertificatePdfModel(
        issuedRecord({ language: "en", courseTitleEn: "" }),
      ).courseTitle,
    ).toBe("أسس الوعي");
    expect(
      buildCertificatePdfModel(
        issuedRecord({ language: "ar", courseTitleAr: "" }),
      ).courseTitle,
    ).toBe("Foundations of Consciousness");
  });

  it("marks revoked certificates without hiding the status", () => {
    const model = buildCertificatePdfModel(
      issuedRecord({ status: "revoked" }),
    );
    expect(model.revoked).toBe(true);
    expect(model.status).toBe("revoked");
    expect(model.copy.revoked).toBe("Revoked");
  });

  it("keeps only public snapshot fields", () => {
    const model = buildCertificatePdfModel(issuedRecord());
    expect(pdfModelHasPrivateFields(model)).toBe(false);
    expect(JSON.stringify(model)).not.toMatch(/@/);
    expect(CERTIFICATE_PDF_SELECT_COLUMNS).not.toMatch(/email|phone|notes|profile_id/);
  });
});

describe("certificate Template 2", () => {
  it("keeps the official HTML placeholders before injection", () => {
    const source = readFileSync(
      path.resolve(
        process.cwd(),
        "public/certificates/template/certificate-template.html",
      ),
      "utf8",
    );
    expect(source).toContain("[STUDENT_NAME]");
    expect(source).toContain("[COURSE_TITLE]");
    expect(source).toContain("[CERTIFICATE_NUMBER]");
    expect(source).toContain("[ISSUE_DATE]");
    expect(source).toContain("[QR_CODE]");
    expect(source).toContain('src="assets/frame.png"');
    expect(source).toContain("Director");
    expect(source).toContain("Official Seal");
    expect(source).not.toContain("avatar-institut-certificate-reference.jpeg");
  });

  it("injects official snapshot fields, logo and QR into Template 2", async () => {
    const model = buildCertificatePdfModel(issuedRecord());
    const qr = await buildCertificateQrArtifact(model.officialNumber, {
      origin: "https://academy.example.test",
      purpose: "official",
    });
    const html = buildCertificateTemplateHtml({
      model,
      qrPngBytes: qr.qrPngBytes,
    });
    expect(html).toContain("Sara Benali");
    expect(html).toContain("Foundations of Consciousness");
    expect(html).toContain("AVT-2026-000002");
    expect(html).toMatch(/15 March 2026|March 15, 2026/);
    expect(html).toContain("data:image/png;base64,");
    expect(html).toContain("data:image/jpeg;base64,");
    expect(html).toContain("Director");
    expect(html).toContain("Official Seal");
    expect(html).not.toContain("[STUDENT_NAME]");
    expect(html).not.toContain("[COURSE_TITLE]");
    expect(html).not.toContain("[CERTIFICATE_NUMBER]");
    expect(html).not.toContain("[ISSUE_DATE]");
    expect(html).not.toContain("[QR_CODE]");
    expect(html).not.toContain("logo<br>Avatar Institut");
    expect(html).not.toContain(CERTIFICATE_PDF_PREVIEW_MARK);
    expect(html).not.toContain("avatar-institut-certificate-reference.jpeg");
    expect(html).not.toMatch(/signature\.png|cachet|seal\.png|director\.png/i);
  });

  it("marks only the preview HTML with the distribution warning", async () => {
    const model = buildCertificatePdfModel(issuedRecord());
    const qr = await buildCertificateQrArtifact(model.officialNumber, {
      origin: "http://localhost:3000",
      purpose: "local",
    });
    const html = buildCertificateTemplateHtml({
      model,
      qrPngBytes: qr.qrPngBytes,
      preview: true,
    });
    expect(html).toContain(CERTIFICATE_PDF_PREVIEW_MARK);
    expect(html).toContain("Sara Benali");
  });
});

describe("certificate PDF generation", { timeout: 60_000 }, () => {
  it("builds a valid issued PDF with public fields and the Lot 4A QR", async () => {
    const pdf = await generateCertificatePdf(issuedRecord(), {
      origin: "https://academy.example.test",
    });
    expect(Buffer.from(pdf.bytes).subarray(0, 4).toString()).toBe("%PDF");
    expect(pdf.filename).toBe("Avatar-Institut-AVT-2026-000002.pdf");
    expect(pdf.verificationUrl).toBe(
      "https://academy.example.test/verify/AVT-2026-000002",
    );
    expect(decodeQrPng(pdf.qrPngBytes)).toBe(pdf.verificationUrl);
    expect(pdf.verificationUrl).not.toMatch(/localhost/);
    expect(pdf.verificationUrl).not.toMatch(/@|student-pass|token/i);

    const doc = await PDFDocument.load(pdf.bytes);
    expect(doc.getPageCount()).toBe(1);
    const { width, height } = doc.getPage(0).getSize();
    expect(width).toBeCloseTo(595.28, 0);
    expect(height).toBeCloseTo(841.89, 0);
    expect(doc.getTitle()).toContain("AVT-2026-000002");
    expect(doc.getSubject()).toBe(pdf.verificationUrl);
    expect(doc.getKeywords()).toContain("AVT-2026-000002");
    expect(doc.getKeywords()).toContain("Sara Benali");
    expect(doc.getKeywords()).toContain("Foundations of Consciousness");
    expect(await countPdfImageXObjects(pdf.bytes)).toBeGreaterThanOrEqual(2);

    const model = buildCertificatePdfModel(issuedRecord());
    expect(model.holderDisplayName).toBe("Sara Benali");
    expect(model.courseTitle).toBe("Foundations of Consciousness");
    expect(model.issuedAtLabel).toMatch(/2026/);
    expect(model.issuedAtRaw).toBe("2026-03-15");
  });

  it("renders Arabic copy and the Arabic course title", async () => {
    const pdf = await generateCertificatePdf(issuedRecord({ language: "ar" }), {
      origin: "https://academy.example.test",
    });
    const model = buildCertificatePdfModel(issuedRecord({ language: "ar" }));
    expect(model.copy.verify).toBe("تحقق من هذه الشهادة");
    expect(model.courseTitle).toBe("أسس الوعي");
    expect(Buffer.from(pdf.bytes).subarray(0, 4).toString()).toBe("%PDF");
    expect(decodeQrPng(pdf.qrPngBytes)).toBe(
      "https://academy.example.test/verify/AVT-2026-000002",
    );
  });

  it("still generates a revoked PDF that exposes the revoked status", async () => {
    const record = issuedRecord({ status: "revoked" });
    const model = buildCertificatePdfModel(record);
    const pdf = await generateCertificatePdf(record, {
      origin: "https://academy.example.test",
    });
    expect(model.revoked).toBe(true);
    expect(model.copy.revoked).toBe("Revoked");
    expect(Buffer.from(pdf.bytes).subarray(0, 4).toString()).toBe("%PDF");
  });

  it("embeds NEXT_PUBLIC_APP_URL localhost in a local official PDF", async () => {
    const pdf = await generateCertificatePdf(issuedRecord(), {
      origin: "http://localhost:3000",
      env: { NODE_ENV: "development" },
    });
    expect(pdf.filename).toBe("Avatar-Institut-AVT-2026-000002.pdf");
    expect(pdf.verificationUrl).toBe(
      "http://localhost:3000/verify/AVT-2026-000002",
    );
    expect(decodeQrPng(pdf.qrPngBytes)).toBe(pdf.verificationUrl);
    expect(pdf.preview).toBe(false);
  });

  it("refuses an official PDF with localhost in production", async () => {
    await expect(
      generateCertificatePdf(issuedRecord(), {
        origin: "http://localhost:3000",
        env: { NODE_ENV: "production", VERCEL_ENV: "production" },
      }),
    ).rejects.toBeInstanceOf(OfficialPdfOriginError);
  });

  it("also refuses 127.0.0.1 in production and non-https public origins", async () => {
    await expect(
      generateCertificatePdf(issuedRecord(), {
        origin: "http://127.0.0.1:3000",
        env: { NODE_ENV: "production", VERCEL_ENV: "production" },
      }),
    ).rejects.toBeInstanceOf(OfficialPdfOriginError);
    await expect(
      generateCertificatePdf(issuedRecord(), {
        origin: "http://academy.example.test",
      }),
    ).rejects.toBeInstanceOf(OfficialPdfOriginError);
  });
});

describe("certificate PDF preview", { timeout: 60_000 }, () => {
  it("allows preview in non-production and marks the file as preview", async () => {
    expect(
      isCertificatePdfPreviewEnvironment({ NODE_ENV: "development" }),
    ).toBe(true);
    expect(isCertificatePdfPreviewEnvironment({ NODE_ENV: "test" })).toBe(true);

    const pdf = await generateCertificatePreviewPdf(issuedRecord(), {
      origin: "http://localhost:3000",
      env: { NODE_ENV: "development" },
    });
    expect(pdf.preview).toBe(true);
    expect(pdf.filename).toBe("AVT-2026-000002.preview.pdf");
    expect(Buffer.from(pdf.bytes).subarray(0, 4).toString()).toBe("%PDF");
    expect(pdf.verificationUrl).toBe(
      "http://localhost:3000/verify/AVT-2026-000002",
    );
    expect(decodeQrPng(pdf.qrPngBytes)).toBe(pdf.verificationUrl);

    const doc = await PDFDocument.load(pdf.bytes);
    expect(doc.getTitle()).toContain("PREVIEW");
    expect(doc.getKeywords()).toContain("PREVIEW — NOT FOR DISTRIBUTION");
    expect(doc.getKeywords()).toContain("Sara Benali");
    expect(doc.getPage(0).getSize().width).toBeCloseTo(595.28, 0);
  });

  it("refuses preview in production", async () => {
    expect(
      isCertificatePdfPreviewEnvironment({
        NODE_ENV: "production",
        VERCEL_ENV: "production",
      }),
    ).toBe(false);
    await expect(
      generateCertificatePreviewPdf(issuedRecord(), {
        origin: "http://localhost:3000",
        env: { NODE_ENV: "production", VERCEL_ENV: "production" },
      }),
    ).rejects.toBeInstanceOf(CertificatePdfPreviewDisabledError);
  });

  it("does not embed a public HTTPS origin in a preview QR", async () => {
    await expect(
      generateCertificatePreviewPdf(issuedRecord(), {
        origin: "https://academy.example.test",
        env: { NODE_ENV: "development" },
      }),
    ).rejects.toBeInstanceOf(CertificatePdfPreviewDisabledError);
  });

  it("uses the same snapshot data as the official template", async () => {
    const record = issuedRecord();
    const official = await generateCertificatePdf(record, {
      origin: "https://academy.example.test",
    });
    const preview = await generateCertificatePreviewPdf(record, {
      origin: "http://localhost:3000",
      env: { NODE_ENV: "development" },
    });
    const model = buildCertificatePdfModel(record);
    expect(official.officialNumber).toBe(preview.officialNumber);
    expect(official.officialNumber).toBe(model.officialNumber);
    expect(model.holderDisplayName).toBe("Sara Benali");
    expect(model.courseTitle).toBe("Foundations of Consciousness");
    expect(official.preview).toBe(false);
    expect(preview.preview).toBe(true);
    expect((await PDFDocument.load(official.bytes)).getTitle()).not.toContain(
      "PREVIEW",
    );
  });
});

describe("certificate PDF route wiring", () => {
  it("exposes an admin-only download path", () => {
    expect(certificatePdfDownloadPath("AVT-2026-000002")).toBe(
      "/api/admin/certificates/AVT-2026-000002/pdf",
    );
    expect(certificatePdfFilename("AVT-2026-000002")).toBe(
      "Avatar-Institut-AVT-2026-000002.pdf",
    );

    const route = readFileSync(
      path.resolve(
        process.cwd(),
        "src/app/api/admin/certificates/[certificateNumber]/pdf/route.ts",
      ),
      "utf8",
    );
    expect(route).toMatch(/getAdminAccess/);
    expect(route).toMatch(/denyCertificatePdfAccess/);
    expect(route).toMatch(/generateCertificatePdf/);
    expect(route).toMatch(/loadCertificatePdfRecord/);
    expect(route).not.toMatch(/SUPABASE_SECRET_KEY|SERVICE_ROLE/);
  });

  it("exposes a separate admin-only preview path", () => {
    expect(certificatePdfPreviewPath("AVT-2026-000001")).toBe(
      "/api/admin/certificates/AVT-2026-000001/pdf-preview",
    );
    expect(certificatePdfPreviewFilename("AVT-2026-000001")).toBe(
      "AVT-2026-000001.preview.pdf",
    );

    const route = readFileSync(
      path.resolve(
        process.cwd(),
        "src/app/api/admin/certificates/[certificateNumber]/pdf-preview/route.ts",
      ),
      "utf8",
    );
    expect(route).toMatch(/getAdminAccess/);
    expect(route).toMatch(/denyCertificatePdfAccess/);
    expect(route).toMatch(/generateCertificatePreviewPdf/);
    expect(route).toMatch(/isCertificatePdfPreviewEnvironment/);
    expect(route).not.toMatch(/insert\(|update\(|upsert\(|storage/);
    expect(route).not.toMatch(/SUPABASE_SECRET_KEY|SERVICE_ROLE/);
  });

  it("reuses Lot 4A QR generation and never writes certificates", () => {
    const source = readFileSync(
      path.resolve(process.cwd(), "src/lib/certificates/pdf/generate.ts"),
      "utf8",
    );
    expect(source).toMatch(/buildOfficialCertificateQrArtifact/);
    expect(source).toMatch(/buildCertificateQrArtifact/);
    expect(source).not.toMatch(/insert\(|update\(|upsert\(/);

    const load = readFileSync(
      path.resolve(process.cwd(), "src/lib/certificates/pdf/load.ts"),
      "utf8",
    );
    expect(load).toMatch(/\.select\(/);
    expect(load).not.toMatch(/insert\(|update\(|upsert\(/);
  });

  it("prints Template 2 and does not use the retired reference JPEG", () => {
    const files = [
      "src/lib/certificates/pdf/document.ts",
      "src/lib/certificates/pdf/generate.ts",
      "src/lib/certificates/pdf/background.ts",
      "src/lib/certificates/pdf/assets.ts",
      "src/lib/certificates/pdf/print.ts",
    ];
    for (const file of files) {
      const source = readFileSync(path.resolve(process.cwd(), file), "utf8");
      expect(source).not.toMatch(/avatar-institut-certificate-reference\.jpeg/);
      expect(source).not.toMatch(/CERTIFICATE_REFERENCE_RELATIVE_PATH/);
    }
    expect(CERTIFICATE_FRAME_RELATIVE_PATH).toBe(
      "public/certificates/template/assets/frame.png",
    );
    expect(OFFICIAL_LOGO_RELATIVE_PATH).toBe(
      "public/brand/avatar-institut-official.jpeg",
    );
  });
});
