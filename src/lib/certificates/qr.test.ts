import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import jsQR from "jsqr";
import { PNG } from "pngjs";
import {
  buildCertificateQrArtifact,
  buildOfficialCertificateQrArtifact,
} from "@/lib/certificates/qr";
import {
  assertOfficialCertificateOrigin,
  buildCertificateVerificationUrl,
  getCertificatePublicOrigin,
  LOCAL_CERTIFICATE_ORIGIN,
} from "@/lib/certificates/verification-url";

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
  const decoded = jsQR(
    new Uint8ClampedArray(
      png.data.buffer,
      png.data.byteOffset,
      png.data.byteLength,
    ),
    png.width,
    png.height,
  );
  return decoded?.data ?? null;
}

describe("certificate public origin", () => {
  it("uses localhost when NEXT_PUBLIC_APP_URL is unset", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    expect(getCertificatePublicOrigin()).toBe(LOCAL_CERTIFICATE_ORIGIN);
  });

  it("uses configured NEXT_PUBLIC_APP_URL and strips a trailing slash", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://academy.example.test/";
    expect(getCertificatePublicOrigin()).toBe("https://academy.example.test");
  });
});

describe("certificate verification URL", () => {
  it("builds the public verify URL from a valid official number", () => {
    expect(
      buildCertificateVerificationUrl("AVT-2026-000001", {
        origin: "https://academy.example.test",
      }),
    ).toBe("https://academy.example.test/verify/AVT-2026-000001");
  });

  it("normalizes and percent-encodes the official number in the path", () => {
    const url = buildCertificateVerificationUrl(" avt-2026-000001 ", {
      origin: "https://academy.example.test",
    });
    expect(url).toBe("https://academy.example.test/verify/AVT-2026-000001");
    expect(encodeURIComponent("AVT-2026-000001")).toBe("AVT-2026-000001");
  });

  it("uses the local origin when NEXT_PUBLIC_APP_URL is localhost", () => {
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    expect(buildCertificateVerificationUrl("AVT-2026-000001")).toBe(
      "http://localhost:3000/verify/AVT-2026-000001",
    );
  });

  it("uses the configured https origin in production-like config", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://academy.example.test";
    expect(buildCertificateVerificationUrl("AVT-2026-000001")).toBe(
      "https://academy.example.test/verify/AVT-2026-000001",
    );
  });

  it("contains only the public verify path — no personal or internal data", () => {
    const url = buildCertificateVerificationUrl("AVT-2026-000001", {
      origin: "https://academy.example.test",
    });
    expect(url).toBe("https://academy.example.test/verify/AVT-2026-000001");
    expect(url).not.toMatch(/@/);
    expect(url).not.toMatch(/[?&#]/);
    expect(url.toLowerCase()).not.toContain("student-pass");
    expect(url.toLowerCase()).not.toContain("token");
    expect(url).not.toMatch(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
    );
  });

  it("rejects an email or other non-official value instead of encoding it", () => {
    expect(() =>
      buildCertificateVerificationUrl("sara.benali@example.com", {
        origin: "https://academy.example.test",
      }),
    ).toThrow(/invalid certificate number/);
  });
});

describe("official certificate origin", () => {
  it("rejects localhost and http for official QR artifacts", () => {
    expect(() =>
      assertOfficialCertificateOrigin("http://localhost:3000"),
    ).toThrow(/https public origin/);
    expect(() =>
      assertOfficialCertificateOrigin("https://localhost:3000"),
    ).toThrow(/must not use localhost/);
  });

  it("accepts a configured https public origin", () => {
    expect(() =>
      assertOfficialCertificateOrigin("https://academy.example.test"),
    ).not.toThrow();
  });
});

describe("certificate QR artifact", () => {
  it("encodes only the verification URL for AVT-2026-000001", async () => {
    const artifact = await buildCertificateQrArtifact("AVT-2026-000001", {
      origin: "http://localhost:3000",
      purpose: "local",
    });
    expect(artifact.officialNumber).toBe("AVT-2026-000001");
    expect(artifact.verificationUrl).toBe(
      "http://localhost:3000/verify/AVT-2026-000001",
    );
    expect(decodeQrPng(artifact.qrPngBytes)).toBe(artifact.verificationUrl);
    expect(artifact.qrPngDataUrl.startsWith("data:image/png;base64,")).toBe(
      true,
    );
  });

  it("is deterministic for the same official number", async () => {
    const first = await buildCertificateQrArtifact("AVT-2026-000001", {
      origin: "https://academy.example.test",
      purpose: "official",
    });
    const second = await buildCertificateQrArtifact("AVT-2026-000001", {
      origin: "https://academy.example.test",
      purpose: "official",
    });
    expect(first.verificationUrl).toBe(second.verificationUrl);
    expect(Buffer.from(first.qrPngBytes).equals(Buffer.from(second.qrPngBytes))).toBe(
      true,
    );
  });

  it("never embeds localhost in an official PDF QR", async () => {
    await expect(
      buildOfficialCertificateQrArtifact("AVT-2026-000001", {
        origin: "http://localhost:3000",
      }),
    ).rejects.toThrow(/https public origin|localhost/);
  });

  it("builds an official QR from a configured https origin", async () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://academy.example.test";
    const artifact = await buildOfficialCertificateQrArtifact("AVT-2026-000001");
    expect(artifact.verificationUrl).toBe(
      "https://academy.example.test/verify/AVT-2026-000001",
    );
    expect(decodeQrPng(artifact.qrPngBytes)).toBe(artifact.verificationUrl);
  });
});

describe("verify page remains the QR target", () => {
  it("still looks up AVT numbers via lookupPublicCertificate", () => {
    const page = readFileSync(
      path.resolve(
        process.cwd(),
        "src/app/verify/[certificateNumber]/page.tsx",
      ),
      "utf8",
    );
    expect(page).toMatch(/lookupPublicCertificate/);
    expect(page).toMatch(/params: Promise<\{ certificateNumber: string \}>/);
  });
});
