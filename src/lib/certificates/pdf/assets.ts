import { readFileSync } from "node:fs";
import path from "node:path";

export const CERTIFICATE_FONT_FILES = {
  latinRegular: "@fontsource/cairo/files/cairo-latin-400-normal.woff",
  latinBold: "@fontsource/cairo/files/cairo-latin-700-normal.woff",
  arabicRegular: "@fontsource/cairo/files/cairo-arabic-400-normal.woff",
  arabicBold: "@fontsource/cairo/files/cairo-arabic-700-normal.woff",
} as const;

export const CERTIFICATE_TEMPLATE_FONT_FILES = {
  quicksandLatin400:
    "@fontsource/quicksand/files/quicksand-latin-400-normal.woff",
  quicksandLatin500:
    "@fontsource/quicksand/files/quicksand-latin-500-normal.woff",
  quicksandLatin600:
    "@fontsource/quicksand/files/quicksand-latin-600-normal.woff",
  quicksandLatin700:
    "@fontsource/quicksand/files/quicksand-latin-700-normal.woff",
  quicksandLatinExt400:
    "@fontsource/quicksand/files/quicksand-latin-ext-400-normal.woff",
  quicksandLatinExt500:
    "@fontsource/quicksand/files/quicksand-latin-ext-500-normal.woff",
  quicksandLatinExt600:
    "@fontsource/quicksand/files/quicksand-latin-ext-600-normal.woff",
  quicksandLatinExt700:
    "@fontsource/quicksand/files/quicksand-latin-ext-700-normal.woff",
  greatVibesLatin:
    "@fontsource/great-vibes/files/great-vibes-latin-400-normal.woff",
  greatVibesLatinExt:
    "@fontsource/great-vibes/files/great-vibes-latin-ext-400-normal.woff",
} as const;

export const CERTIFICATE_TEMPLATE_HTML_RELATIVE_PATH =
  "public/certificates/template/certificate-template.html";

export const CERTIFICATE_FRAME_RELATIVE_PATH =
  "public/certificates/template/assets/frame.png";

export const OFFICIAL_LOGO_RELATIVE_PATH =
  "public/brand/avatar-institut-official.jpeg";

export function resolveProjectFile(relativePath: string): string {
  return path.join(process.cwd(), relativePath.replace(/^\//, ""));
}

export function readProjectFile(relativePath: string): Uint8Array {
  return new Uint8Array(readFileSync(resolveProjectFile(relativePath)));
}

export function readProjectTextFile(relativePath: string): string {
  return readFileSync(resolveProjectFile(relativePath), "utf8");
}

export function readNodeModuleFile(specifier: string): Uint8Array {
  return new Uint8Array(
    readFileSync(path.join(process.cwd(), "node_modules", specifier)),
  );
}

export function bytesToDataUri(bytes: Uint8Array, mime: string): string {
  return `data:${mime};base64,${Buffer.from(bytes).toString("base64")}`;
}

export function projectFileToDataUri(
  relativePath: string,
  mime: string,
): string {
  return bytesToDataUri(readProjectFile(relativePath), mime);
}
