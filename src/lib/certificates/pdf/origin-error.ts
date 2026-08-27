export class OfficialPdfOriginError extends Error {
  constructor(
    message = "Official PDF cannot be generated because NEXT_PUBLIC_APP_URL is not a public HTTPS origin. Localhost is not allowed on an official certificate.",
  ) {
    super(message);
    this.name = "OfficialPdfOriginError";
  }
}

export function isOfficialPdfOriginError(
  error: unknown,
): error is OfficialPdfOriginError {
  return error instanceof OfficialPdfOriginError;
}

export class CertificatePdfPreviewDisabledError extends Error {
  constructor(
    message = "PDF preview is only available in local development. It is disabled in production.",
  ) {
    super(message);
    this.name = "CertificatePdfPreviewDisabledError";
  }
}

export function isCertificatePdfPreviewDisabledError(
  error: unknown,
): error is CertificatePdfPreviewDisabledError {
  return error instanceof CertificatePdfPreviewDisabledError;
}
