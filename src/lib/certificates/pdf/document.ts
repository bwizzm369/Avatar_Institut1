import { PDFDocument, PDFName } from "pdf-lib";
import type { CertificatePdfModel } from "@/lib/certificates/pdf/model";
import { printCertificateHtmlToPdf } from "@/lib/certificates/pdf/print";
import {
  buildCertificateTemplateHtml,
  CERTIFICATE_PDF_PREVIEW_MARK,
} from "@/lib/certificates/pdf/template";

export async function renderCertificatePdf(options: {
  model: CertificatePdfModel;
  verificationUrl: string;
  qrPngBytes: Uint8Array;
  preview?: boolean;
}): Promise<Uint8Array> {
  const { model, verificationUrl, qrPngBytes, preview = false } = options;
  const html = buildCertificateTemplateHtml({
    model,
    qrPngBytes,
    preview,
  });
  const printed = await printCertificateHtmlToPdf(html);
  const pdf = await PDFDocument.load(printed);

  pdf.setTitle(
    preview
      ? `PREVIEW ${model.copy.documentTitle} ${model.officialNumber}`
      : `${model.copy.documentTitle} ${model.officialNumber}`,
  );
  pdf.setAuthor(model.copy.institute);
  pdf.setSubject(verificationUrl);
  pdf.setKeywords(
    [
      model.officialNumber,
      model.holderDisplayName,
      model.courseTitle,
      model.issuedAtLabel,
      "Avatar Institut",
      preview ? CERTIFICATE_PDF_PREVIEW_MARK : "",
    ].filter(Boolean),
  );
  pdf.setCreator(preview ? "Avatar Institut (preview)" : "Avatar Institut");

  return pdf.save();
}

export async function countPdfImageXObjects(
  pdfBytes: Uint8Array,
): Promise<number> {
  const doc = await PDFDocument.load(pdfBytes);
  let count = 0;
  for (const [, object] of doc.context.enumerateIndirectObjects()) {
    const dict = (
      object as {
        dict?: { get: (name: ReturnType<typeof PDFName.of>) => unknown };
      }
    ).dict;
    if (!dict?.get) continue;
    if (dict.get(PDFName.of("Subtype")) === PDFName.of("Image")) {
      count += 1;
    }
  }
  return count;
}
