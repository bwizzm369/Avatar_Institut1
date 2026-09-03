import { describe, expect, it } from "vitest";

import {
  buildContentSecurityPolicy,
  getApplicationSecurityHeaders,
} from "./headers";

describe("application security headers", () => {
  it("covers the browser protections confirmed missing by the assessment", () => {
    const headers = new Map(
      getApplicationSecurityHeaders("production").map(({ key, value }) => [
        key,
        value,
      ]),
    );

    expect(headers.get("Content-Security-Policy")).toContain(
      "frame-ancestors 'none'",
    );
    expect(headers.get("X-Frame-Options")).toBe("DENY");
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.get("Referrer-Policy")).toBe(
      "strict-origin-when-cross-origin",
    );
    expect(headers.get("Permissions-Policy")).toContain("camera=()");
  });

  it("keeps required application services inside a restrictive production CSP", () => {
    const policy = buildContentSecurityPolicy("production");

    expect(policy).toContain("default-src 'self'");
    expect(policy).toContain("base-uri 'self'");
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("https://*.supabase.co");
    expect(policy).toContain("wss://*.supabase.co");
    expect(policy).toContain("https://checkout.stripe.com");
    expect(policy).toContain("upgrade-insecure-requests");
    expect(policy).not.toContain("'unsafe-eval'");
  });

  it("allows the Next.js development runtime without weakening production", () => {
    const policy = buildContentSecurityPolicy("development");

    expect(policy).toContain("'unsafe-eval'");
    expect(policy).toContain("ws://localhost:*");
    expect(policy).not.toContain("upgrade-insecure-requests");
  });
});
