/**
 * Local PDF preview is for next dev / tests only.
 * Vercel production and `next start` (NODE_ENV=production) stay blocked.
 */
export function isCertificatePdfPreviewEnvironment(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (env.VERCEL_ENV === "production") return false;
  if (env.NODE_ENV === "production") return false;
  return true;
}

export const CERTIFICATE_PDF_PREVIEW_DISABLED_MESSAGE =
  "PDF preview is only available in local development. It is disabled in production.";
