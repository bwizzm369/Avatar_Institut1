import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  process.env.PUPPETEER_EXECUTABLE_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  process.env.LOCALAPPDATA
    ? path.join(
        process.env.LOCALAPPDATA,
        "Google\\Chrome\\Application\\chrome.exe",
      )
    : undefined,
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
];

export function findCertificateChromeExecutable(): string {
  for (const candidate of CHROME_CANDIDATES) {
    if (candidate && existsSync(candidate)) return candidate;
  }
  throw new Error(
    "Certificate PDF rendering requires Chrome or Edge to print Template 2. Install Chrome or set CHROME_PATH.",
  );
}

function pathToFileUrl(filePath: string): string {
  const resolved = path.resolve(filePath).replace(/\\/g, "/");
  if (/^[A-Za-z]:/.test(resolved)) {
    return `file:///${resolved}`;
  }
  return `file://${resolved}`;
}

export async function printCertificateHtmlToPdf(
  html: string,
): Promise<Uint8Array> {
  const chrome = findCertificateChromeExecutable();
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "avt-cert-"));
  const htmlPath = path.join(tempDir, "certificate.html");
  const pdfPath = path.join(tempDir, "certificate.pdf");
  const profileDir = path.join(tempDir, "chrome-profile");

  try {
    await writeFile(htmlPath, html, "utf8");
    await execFileAsync(
      chrome,
      [
        "--headless=new",
        "--disable-gpu",
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-extensions",
        "--hide-scrollbars",
        "--allow-file-access-from-files",
        "--virtual-time-budget=2000",
        "--no-pdf-header-footer",
        "--print-to-pdf-no-header",
        `--user-data-dir=${profileDir}`,
        `--print-to-pdf=${pdfPath}`,
        pathToFileUrl(htmlPath),
      ],
      { timeout: 45000, windowsHide: true },
    );

    if (!existsSync(pdfPath)) {
      throw new Error("Chrome did not write the certificate PDF.");
    }
    const bytes = await readFile(pdfPath);
    if (bytes.length < 100 || bytes.subarray(0, 4).toString() !== "%PDF") {
      throw new Error("Chrome wrote an invalid certificate PDF.");
    }
    return new Uint8Array(bytes);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}
