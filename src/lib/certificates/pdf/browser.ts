import { existsSync } from "node:fs";
import path from "node:path";

export type CertificatePdfBrowserStrategy = "local-chrome" | "serverless-chromium";

export type CertificatePdfBrowserPlan =
  | { strategy: "serverless-chromium" }
  | { strategy: "local-chrome"; executablePath: string };

const LOCAL_CHROME_PATHS = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
] as const;

/**
 * Vercel production and Preview run Linux serverless functions.
 * Local `next dev` / `next start` keep desktop Chrome/Edge.
 */
export function isServerlessCertificatePdfRuntime(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (env.VERCEL === "1") return true;
  return env.VERCEL_ENV === "production" || env.VERCEL_ENV === "preview";
}

function localChromeCandidates(env: NodeJS.ProcessEnv): string[] {
  const fromEnv = [env.CHROME_PATH, env.PUPPETEER_EXECUTABLE_PATH]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));
  const localAppData = env.LOCALAPPDATA?.trim();
  const roamingChrome = localAppData
    ? path.join(localAppData, "Google\\Chrome\\Application\\chrome.exe")
    : undefined;
  return [...fromEnv, ...(roamingChrome ? [roamingChrome] : []), ...LOCAL_CHROME_PATHS];
}

export function findCertificateChromeExecutable(
  env: NodeJS.ProcessEnv = process.env,
): string {
  for (const candidate of localChromeCandidates(env)) {
    if (existsSync(candidate)) return candidate;
  }
  throw new Error(
    "Certificate PDF rendering requires Chrome or Edge to print Template 2. Install Chrome or set CHROME_PATH.",
  );
}

export function resolveCertificatePdfBrowser(
  env: NodeJS.ProcessEnv = process.env,
): CertificatePdfBrowserPlan {
  if (isServerlessCertificatePdfRuntime(env)) {
    return { strategy: "serverless-chromium" };
  }
  return {
    strategy: "local-chrome",
    executablePath: findCertificateChromeExecutable(env),
  };
}
