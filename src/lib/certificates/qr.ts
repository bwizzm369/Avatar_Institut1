import QRCode from "qrcode";
import { normalizeCertificateNumberInput } from "@/lib/certificates/number";
import {
  assertOfficialCertificateOrigin,
  buildCertificateVerificationUrl,
  getCertificatePublicOrigin,
} from "@/lib/certificates/verification-url";

/** Fixed render options so the same number always yields the same PNG. */
export const CERTIFICATE_QR_RENDER = {
  errorCorrectionLevel: "M",
  margin: 2,
  width: 256,
  color: { dark: "#000000", light: "#FFFFFF" },
} as const;

export type CertificateQrPurpose = "local" | "official";

export type CertificateQrArtifact = {
  officialNumber: string;
  verificationUrl: string;
  qrPngDataUrl: string;
  qrPngBytes: Uint8Array;
};

async function pngBytesForVerificationUrl(
  verificationUrl: string,
): Promise<Uint8Array> {
  const buffer = await QRCode.toBuffer(verificationUrl, {
    type: "png",
    errorCorrectionLevel: CERTIFICATE_QR_RENDER.errorCorrectionLevel,
    margin: CERTIFICATE_QR_RENDER.margin,
    width: CERTIFICATE_QR_RENDER.width,
    color: CERTIFICATE_QR_RENDER.color,
  });
  return new Uint8Array(buffer);
}

/**
 * QR + URL for one official certificate. Encodes only the public verify URL.
 * `purpose: "official"` (Lot 4B PDF) rejects localhost and non-https origins.
 */
export async function buildCertificateQrArtifact(
  rawNumber: string,
  options?: {
    origin?: string;
    purpose?: CertificateQrPurpose;
  },
): Promise<CertificateQrArtifact> {
  const origin = (options?.origin ?? getCertificatePublicOrigin()).replace(
    /\/$/,
    "",
  );
  const purpose = options?.purpose ?? "local";
  if (purpose === "official") {
    assertOfficialCertificateOrigin(origin);
  }

  const officialNumber = normalizeCertificateNumberInput(rawNumber);
  const verificationUrl = buildCertificateVerificationUrl(officialNumber, {
    origin,
  });
  const qrPngBytes = await pngBytesForVerificationUrl(verificationUrl);

  return {
    officialNumber,
    verificationUrl,
    qrPngBytes,
    qrPngDataUrl: `data:image/png;base64,${Buffer.from(qrPngBytes).toString("base64")}`,
  };
}

/** Lot 4B entry: official PDF must never embed a localhost QR. */
export async function buildOfficialCertificateQrArtifact(
  rawNumber: string,
  options?: { origin?: string },
): Promise<CertificateQrArtifact> {
  return buildCertificateQrArtifact(rawNumber, {
    origin: options?.origin,
    purpose: "official",
  });
}
