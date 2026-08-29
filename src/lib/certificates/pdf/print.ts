import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import type { Browser } from "puppeteer-core";
import {
  resolveCertificatePdfBrowser,
  type CertificatePdfBrowserStrategy,
} from "@/lib/certificates/pdf/browser";

export {
  findCertificateChromeExecutable,
  isServerlessCertificatePdfRuntime,
  resolveCertificatePdfBrowser,
} from "@/lib/certificates/pdf/browser";

const execFileAsync = promisify(execFile);

const LOCAL_PRINT_FLAGS = [
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
] as const;

function pathToFileUrl(filePath: string): string {
  const resolved = path.resolve(filePath).replace(/\\/g, "/");
  if (/^[A-Za-z]:/.test(resolved)) {
    return `file:///${resolved}`;
  }
  return `file://${resolved}`;
}

function logCertificatePdfFailure(strategy: CertificatePdfBrowserStrategy): void {
  console.error("Certificate PDF browser failed", { strategy });
}

function certificatePdfRenderFailed(): Error {
  return new Error("Certificate PDF rendering failed.");
}

function assertPdfBytes(bytes: Uint8Array): Uint8Array {
  const looksLikePdf =
    bytes.length >= 100 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46;
  if (!looksLikePdf) {
    throw certificatePdfRenderFailed();
  }
  return bytes;
}

async function printWithLocalChrome(
  html: string,
  executablePath: string,
): Promise<Uint8Array> {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "avt-cert-"));
  const htmlPath = path.join(tempDir, "certificate.html");
  const pdfPath = path.join(tempDir, "certificate.pdf");
  const profileDir = path.join(tempDir, "chrome-profile");

  try {
    await writeFile(htmlPath, html, "utf8");
    await execFileAsync(
      executablePath,
      [
        ...LOCAL_PRINT_FLAGS,
        `--user-data-dir=${profileDir}`,
        `--print-to-pdf=${pdfPath}`,
        pathToFileUrl(htmlPath),
      ],
      { timeout: 45000, windowsHide: true },
    );

    if (!existsSync(pdfPath)) {
      throw certificatePdfRenderFailed();
    }
    return assertPdfBytes(new Uint8Array(await readFile(pdfPath)));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === certificatePdfRenderFailed().message
    ) {
      throw error;
    }
    logCertificatePdfFailure("local-chrome");
    throw certificatePdfRenderFailed();
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

async function printWithServerlessChromium(html: string): Promise<Uint8Array> {
  const chromium = (await import("@sparticuz/chromium")).default;
  const puppeteer = await import("puppeteer-core");
  chromium.setGraphicsMode = false;

  let browser: Browser | undefined;
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: {
        width: 794,
        height: 1123,
        deviceScaleFactor: 1,
      },
      executablePath: await chromium.executablePath(),
      headless: true,
      timeout: 45000,
    });
    const page = await browser.newPage();
    page.setDefaultTimeout(45000);
    await page.setContent(html, { waitUntil: "load", timeout: 45000 });
    const pdf = await page.pdf({
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: false,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      timeout: 45000,
    });
    return assertPdfBytes(new Uint8Array(pdf));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === certificatePdfRenderFailed().message
    ) {
      throw error;
    }
    logCertificatePdfFailure("serverless-chromium");
    throw certificatePdfRenderFailed();
  } finally {
    await browser?.close().catch(() => undefined);
  }
}

export async function printCertificateHtmlToPdf(
  html: string,
  env: NodeJS.ProcessEnv = process.env,
): Promise<Uint8Array> {
  const plan = resolveCertificatePdfBrowser(env);
  if (plan.strategy === "serverless-chromium") {
    return printWithServerlessChromium(html);
  }
  return printWithLocalChrome(html, plan.executablePath);
}
