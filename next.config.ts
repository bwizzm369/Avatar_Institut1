import type { NextConfig } from "next";
import { getApplicationSecurityHeaders } from "./src/lib/security/headers";

/** Template 2 assets + fonts are read from disk at PDF time, not imported. */
const certificatePdfTraceIncludes = [
  "./public/certificates/template/**/*",
  "./public/brand/avatar-institut-official.jpeg",
  "./node_modules/@fontsource/cairo/files/**/*",
  "./node_modules/@fontsource/quicksand/files/**/*",
  "./node_modules/@fontsource/great-vibes/files/**/*",
  "./node_modules/@sparticuz/chromium/bin/**",
];

const nextConfig: NextConfig = {
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: getApplicationSecurityHeaders(),
      },
    ];
  },
  outputFileTracingIncludes: {
    "/api/admin/certificates/[certificateNumber]/pdf":
      certificatePdfTraceIncludes,
    "/api/dashboard/certificates/[certificateNumber]/pdf":
      certificatePdfTraceIncludes,
  },
};

export default nextConfig;
