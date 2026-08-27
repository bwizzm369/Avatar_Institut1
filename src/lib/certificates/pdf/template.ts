import {
  bytesToDataUri,
  CERTIFICATE_FONT_FILES,
  CERTIFICATE_FRAME_RELATIVE_PATH,
  CERTIFICATE_TEMPLATE_FONT_FILES,
  CERTIFICATE_TEMPLATE_HTML_RELATIVE_PATH,
  OFFICIAL_LOGO_RELATIVE_PATH,
  projectFileToDataUri,
  readNodeModuleFile,
  readProjectTextFile,
} from "@/lib/certificates/pdf/assets";
import type { CertificatePdfModel } from "@/lib/certificates/pdf/model";

export const CERTIFICATE_PDF_PREVIEW_MARK = "PREVIEW — NOT FOR DISTRIBUTION";

const GOOGLE_FONTS_LINK =
  '<link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&family=Great+Vibes&display=swap" rel="stylesheet">';

const LOGO_PLACEHOLDER =
  '<div style="position:absolute;z-index:2;top:20.4cqw;left:50%;transform:translateX(-50%);width:19cqw;height:19cqw;border:1px dashed #c9bf9e;display:flex;align-items:center;justify-content:center;text-align:center;font-family:ui-monospace,monospace;font-size:1.1cqw;color:#9b9384;line-height:1.3;background:#fdfdfb">logo<br>Avatar Institut</div>';

const QR_PLACEHOLDER =
  '<div style="width:12cqw;height:12cqw;margin:0 auto;border:1px dashed #c9bf9e;display:flex;align-items:center;justify-content:center;font-family:ui-monospace,monospace;font-size:1.2cqw;color:#9b9384;background:#fff">[QR_CODE]</div>';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function replaceOnce(
  source: string,
  search: string,
  replacement: string,
  label: string,
): string {
  const count = source.split(search).length - 1;
  if (count !== 1) {
    throw new Error(
      `Certificate Template 2: expected 1 occurrence of ${label}, found ${count}.`,
    );
  }
  return source.replace(search, replacement);
}

const UNICODE_LATIN =
  "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD";
const UNICODE_LATIN_EXT =
  "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF";
const UNICODE_ARABIC =
  "U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0897-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC";

function fontFace(
  family: string,
  weight: number,
  specifier: string,
  unicodeRange: string,
): string {
  const uri = bytesToDataUri(readNodeModuleFile(specifier), "font/woff");
  return `@font-face{font-family:'${family}';font-style:normal;font-weight:${weight};font-display:block;src:url('${uri}') format('woff');unicode-range:${unicodeRange}}`;
}

function embeddedTemplateFontsCss(): string {
  return [
    fontFace("Quicksand", 400, CERTIFICATE_TEMPLATE_FONT_FILES.quicksandLatin400, UNICODE_LATIN),
    fontFace("Quicksand", 400, CERTIFICATE_TEMPLATE_FONT_FILES.quicksandLatinExt400, UNICODE_LATIN_EXT),
    fontFace("Quicksand", 500, CERTIFICATE_TEMPLATE_FONT_FILES.quicksandLatin500, UNICODE_LATIN),
    fontFace("Quicksand", 500, CERTIFICATE_TEMPLATE_FONT_FILES.quicksandLatinExt500, UNICODE_LATIN_EXT),
    fontFace("Quicksand", 600, CERTIFICATE_TEMPLATE_FONT_FILES.quicksandLatin600, UNICODE_LATIN),
    fontFace("Quicksand", 600, CERTIFICATE_TEMPLATE_FONT_FILES.quicksandLatinExt600, UNICODE_LATIN_EXT),
    fontFace("Quicksand", 700, CERTIFICATE_TEMPLATE_FONT_FILES.quicksandLatin700, UNICODE_LATIN),
    fontFace("Quicksand", 700, CERTIFICATE_TEMPLATE_FONT_FILES.quicksandLatinExt700, UNICODE_LATIN_EXT),
    fontFace("Great Vibes", 400, CERTIFICATE_TEMPLATE_FONT_FILES.greatVibesLatin, UNICODE_LATIN),
    fontFace("Great Vibes", 400, CERTIFICATE_TEMPLATE_FONT_FILES.greatVibesLatinExt, UNICODE_LATIN_EXT),
    fontFace("Cairo", 400, CERTIFICATE_FONT_FILES.latinRegular, UNICODE_LATIN),
    fontFace("Cairo", 400, CERTIFICATE_FONT_FILES.arabicRegular, UNICODE_ARABIC),
    fontFace("Cairo", 700, CERTIFICATE_FONT_FILES.latinBold, UNICODE_LATIN),
    fontFace("Cairo", 700, CERTIFICATE_FONT_FILES.arabicBold, UNICODE_ARABIC),
    "html,body,.sheet{width:210mm;height:297mm}",
  ].join("");
}

function previewMarkHtml(): string {
  return `<div data-preview-mark="true" style="position:absolute;z-index:20;top:1.15cqw;left:0;right:0;text-align:center;font-family:Quicksand,Cairo,sans-serif;font-size:1.15cqw;letter-spacing:0.14em;color:#5c5c5c;opacity:0.55;pointer-events:none">${CERTIFICATE_PDF_PREVIEW_MARK}</div>`;
}

function revokedMarkHtml(label: string): string {
  return `<div data-revoked-mark="true" style="position:absolute;z-index:15;inset:0;display:flex;align-items:center;justify-content:center;font-family:Quicksand,Cairo,sans-serif;font-size:8cqw;font-weight:700;color:#991b1b;opacity:0.12;transform:rotate(-18deg);pointer-events:none">${escapeHtml(label)}</div>`;
}

export function buildCertificateTemplateHtml(options: {
  model: CertificatePdfModel;
  qrPngBytes: Uint8Array;
  preview?: boolean;
}): string {
  const { model, qrPngBytes, preview = false } = options;
  let html = readProjectTextFile(CERTIFICATE_TEMPLATE_HTML_RELATIVE_PATH);

  html = replaceOnce(
    html,
    GOOGLE_FONTS_LINK,
    `<style>${embeddedTemplateFontsCss()}</style>`,
    "Google Fonts link",
  );

  html = replaceOnce(
    html,
    'src="assets/frame.png"',
    `src="${projectFileToDataUri(CERTIFICATE_FRAME_RELATIVE_PATH, "image/png")}"`,
    "frame.png",
  );

  html = replaceOnce(
    html,
    "font-family:Quicksand, sans-serif",
    "font-family:Quicksand, Cairo, sans-serif",
    "Quicksand stack",
  );

  const logoUri = projectFileToDataUri(
    OFFICIAL_LOGO_RELATIVE_PATH,
    "image/jpeg",
  );
  html = replaceOnce(
    html,
    LOGO_PLACEHOLDER,
    `<div style="position:absolute;z-index:2;top:20.4cqw;left:50%;transform:translateX(-50%);width:19cqw;height:19cqw;display:flex;align-items:center;justify-content:center;background:#fdfdfb"><img src="${logoUri}" alt="" style="width:100%;height:100%;object-fit:contain"></div>`,
    "logo placeholder",
  );

  html = replaceOnce(
    html,
    'color:#b08d3f">[STUDENT_NAME]</div>',
    `color:#b08d3f" dir="auto">${escapeHtml(model.holderDisplayName)}</div>`,
    "[STUDENT_NAME]",
  );

  html = replaceOnce(
    html,
    'color:#b08d3f">[COURSE_TITLE]</div>',
    `color:#b08d3f" dir="auto">${escapeHtml(model.courseTitle)}</div>`,
    "[COURSE_TITLE]",
  );

  html = replaceOnce(
    html,
    ">[CERTIFICATE_NUMBER]</div>",
    `>${escapeHtml(model.officialNumber)}</div>`,
    "[CERTIFICATE_NUMBER]",
  );

  html = replaceOnce(
    html,
    ">[ISSUE_DATE]</div>",
    `" dir="auto">${escapeHtml(model.issuedAtLabel)}</div>`,
    "[ISSUE_DATE]",
  );

  const qrUri = bytesToDataUri(qrPngBytes, "image/png");
  html = replaceOnce(
    html,
    QR_PLACEHOLDER,
    `<div style="width:12cqw;height:12cqw;margin:0 auto;display:flex;align-items:center;justify-content:center;background:#fff"><img src="${qrUri}" alt="" style="width:100%;height:100%;object-fit:contain"></div>`,
    "[QR_CODE]",
  );

  const overlays: string[] = [];
  if (preview) overlays.push(previewMarkHtml());
  if (model.revoked) overlays.push(revokedMarkHtml(model.copy.revoked));
  if (overlays.length > 0) {
    html = replaceOnce(
      html,
      '<div class="sheet">',
      `<div class="sheet">${overlays.join("")}`,
      "sheet root",
    );
  }

  if (
    html.includes("[STUDENT_NAME]") ||
    html.includes("[COURSE_TITLE]") ||
    html.includes("[CERTIFICATE_NUMBER]") ||
    html.includes("[ISSUE_DATE]") ||
    html.includes("[QR_CODE]")
  ) {
    throw new Error("Certificate Template 2 still contains unfilled placeholders.");
  }

  if (html.includes("avatar-institut-certificate-reference.jpeg")) {
    throw new Error("Certificate Template 2 must not use the retired reference JPEG.");
  }

  return html;
}
