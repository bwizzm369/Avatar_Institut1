const productionScriptSources = ["'self'", "'unsafe-inline'", "https://js.stripe.com"];

/**
 * Next.js currently emits small inline bootstrap scripts. Until the app adopts
 * request-scoped nonces, `unsafe-inline` is required to keep hydration working.
 * `unsafe-eval` is limited to local development for the Next.js dev runtime.
 */
export function buildContentSecurityPolicy(
  environment: string | undefined = process.env.NODE_ENV,
): string {
  const scriptSources = [...productionScriptSources];
  const connectSources = [
    "'self'",
    "https://*.supabase.co",
    "wss://*.supabase.co",
    "https://api.stripe.com",
    "https://checkout.stripe.com",
  ];

  if (environment !== "production") {
    scriptSources.push("'unsafe-eval'");
    connectSources.push("ws://localhost:*", "http://localhost:*");
  }

  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    `script-src ${scriptSources.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src ${connectSources.join(" ")}`,
    "frame-src https://js.stripe.com https://checkout.stripe.com",
    "media-src 'self' blob: https:",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
  ];

  if (environment === "production") {
    directives.push("upgrade-insecure-requests");
  }

  return directives.join("; ");
}

export function getApplicationSecurityHeaders(
  environment: string | undefined = process.env.NODE_ENV,
) {
  return [
    {
      key: "Content-Security-Policy",
      value: buildContentSecurityPolicy(environment),
    },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
    },
  ];
}
