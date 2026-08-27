import {
  buildCertificateQrArtifact,
  buildOfficialCertificateQrArtifact,
  type CertificateQrArtifact,
} from "@/lib/certificates/qr";
import { renderCertificatePdf } from "@/lib/certificates/pdf/document";
import {
  buildCertificatePdfModel,
  certificatePdfFilename,
  certificatePdfPreviewFilename,
  type CertificatePdfRecord,
} from "@/lib/certificates/pdf/model";
import {
  CertificatePdfPreviewDisabledError,
  OfficialPdfOriginError,
} from "@/lib/certificates/pdf/origin-error";
import { isCertificatePdfPreviewEnvironment } from "@/lib/certificates/pdf/preview-env";
import {
  getCertificatePublicOrigin,
  isLoopbackCertificateOrigin,
  LOCAL_CERTIFICATE_ORIGIN,
} from "@/lib/certificates/verification-url";

export type GeneratedCertificatePdf = {
  bytes: Uint8Array;
  filename: string;
  officialNumber: string;
  verificationUrl: string;
  qrPngBytes: Uint8Array;
  preview: boolean;
};

async function buildOfficialDownloadQr(
  officialNumber: string,
  options?: { origin?: string; env?: NodeJS.ProcessEnv },
): Promise<CertificateQrArtifact> {
  const env = options?.env ?? process.env;
  const origin = (options?.origin ?? getCertificatePublicOrigin(env)).replace(
    /\/$/,
    "",
  );
  const localDownloadAllowed = isCertificatePdfPreviewEnvironment(env);

  if (isLoopbackCertificateOrigin(origin)) {
    if (!localDownloadAllowed) {
      throw new OfficialPdfOriginError();
    }
    return buildCertificateQrArtifact(officialNumber, {
      origin,
      purpose: "local",
    });
  }

  try {
    return await buildOfficialCertificateQrArtifact(officialNumber, { origin });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (
      message.includes("localhost") ||
      message.includes("https public origin") ||
      message.includes("not a valid URL")
    ) {
      throw new OfficialPdfOriginError();
    }
    throw error;
  }
}

export async function generateCertificatePdf(
  record: CertificatePdfRecord,
  options?: { origin?: string; env?: NodeJS.ProcessEnv },
): Promise<GeneratedCertificatePdf> {
  const model = buildCertificatePdfModel(record);
  const qr = await buildOfficialDownloadQr(model.officialNumber, options);

  const bytes = await renderCertificatePdf({
    model,
    verificationUrl: qr.verificationUrl,
    qrPngBytes: qr.qrPngBytes,
  });

  return {
    bytes,
    filename: certificatePdfFilename(model.officialNumber),
    officialNumber: model.officialNumber,
    verificationUrl: qr.verificationUrl,
    qrPngBytes: qr.qrPngBytes,
    preview: false,
  };
}

export async function generateCertificatePreviewPdf(
  record: CertificatePdfRecord,
  options?: { origin?: string; env?: NodeJS.ProcessEnv },
): Promise<GeneratedCertificatePdf> {
  if (!isCertificatePdfPreviewEnvironment(options?.env ?? process.env)) {
    throw new CertificatePdfPreviewDisabledError();
  }

  const origin = (options?.origin ?? LOCAL_CERTIFICATE_ORIGIN).replace(/\/$/, "");
  if (!isLoopbackCertificateOrigin(origin)) {
    throw new CertificatePdfPreviewDisabledError(
      "Preview PDF QR must use a localhost origin.",
    );
  }

  const model = buildCertificatePdfModel(record);
  const qr = await buildCertificateQrArtifact(model.officialNumber, {
    origin,
    purpose: "local",
  });
  const bytes = await renderCertificatePdf({
    model,
    verificationUrl: qr.verificationUrl,
    qrPngBytes: qr.qrPngBytes,
    preview: true,
  });

  return {
    bytes,
    filename: certificatePdfPreviewFilename(model.officialNumber),
    officialNumber: model.officialNumber,
    verificationUrl: qr.verificationUrl,
    qrPngBytes: qr.qrPngBytes,
    preview: true,
  };
}
