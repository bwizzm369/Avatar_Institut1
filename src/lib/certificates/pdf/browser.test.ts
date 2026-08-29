import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  isServerlessCertificatePdfRuntime,
  resolveCertificatePdfBrowser,
} from "@/lib/certificates/pdf/browser";
import { getCertificatePublicOrigin } from "@/lib/certificates/verification-url";

const ENV_KEYS = [
  "VERCEL",
  "VERCEL_ENV",
  "CHROME_PATH",
  "PUPPETEER_EXECUTABLE_PATH",
  "NEXT_PUBLIC_APP_URL",
] as const;

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

describe("certificate PDF browser resolution", () => {
  it("selects local Chrome when Vercel env is unset", () => {
    delete process.env.VERCEL;
    delete process.env.VERCEL_ENV;
    const plan = resolveCertificatePdfBrowser(process.env);
    expect(isServerlessCertificatePdfRuntime(process.env)).toBe(false);
    expect(plan.strategy).toBe("local-chrome");
    if (plan.strategy === "local-chrome") {
      expect(plan.executablePath.length).toBeGreaterThan(0);
      expect(plan.executablePath.toLowerCase()).not.toContain("vercel.app");
    }
  });

  it("selects serverless Chromium on Vercel production", () => {
    const env = {
      ...process.env,
      VERCEL: "1",
      VERCEL_ENV: "production",
    };
    const plan = resolveCertificatePdfBrowser(env);
    expect(isServerlessCertificatePdfRuntime(env)).toBe(true);
    expect(plan).toEqual({ strategy: "serverless-chromium" });
  });

  it("selects serverless Chromium on Vercel preview", () => {
    expect(
      resolveCertificatePdfBrowser({
        ...process.env,
        VERCEL: "1",
        VERCEL_ENV: "preview",
      }),
    ).toEqual({ strategy: "serverless-chromium" });
  });
});

describe("certificate PDF print source invariants", () => {
  it("keeps verification URLs on NEXT_PUBLIC_APP_URL and never hardcodes a host", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://academy.example.test";
    expect(getCertificatePublicOrigin()).toBe("https://academy.example.test");

    const files = [
      "src/lib/certificates/pdf/browser.ts",
      "src/lib/certificates/pdf/print.ts",
    ];
    for (const file of files) {
      const source = readFileSync(path.resolve(process.cwd(), file), "utf8");
      expect(source).not.toMatch(/vercel\.app/);
      expect(source).not.toMatch(/https:\/\/avatar/i);
    }
  });

  it("loads serverless Chromium only through puppeteer-core", () => {
    const source = readFileSync(
      path.resolve(process.cwd(), "src/lib/certificates/pdf/print.ts"),
      "utf8",
    );
    expect(source).toMatch(/@sparticuz\/chromium/);
    expect(source).toMatch(/puppeteer-core/);
    expect(source).not.toMatch(/from ["']puppeteer["']/);
    expect(source).toMatch(/print-to-pdf=/);
  });

  it("keeps PDF routes on the Node runtime", () => {
    const routes = [
      "src/app/api/dashboard/certificates/[certificateNumber]/pdf/route.ts",
      "src/app/api/admin/certificates/[certificateNumber]/pdf/route.ts",
    ];
    for (const file of routes) {
      const source = readFileSync(path.resolve(process.cwd(), file), "utf8");
      expect(source).toMatch(/export const runtime = "nodejs"/);
      expect(source).toMatch(/export const maxDuration = 60/);
      expect(source).not.toMatch(/runtime = "edge"/);
    }
  });
});
