/**
 * Pure helpers to keep `next dev` and `next build` from sharing a live `.next`.
 */

export function normalizeCommand(commandLine) {
  return (commandLine ?? "").replace(/\\/g, "/").toLowerCase();
}

export function commandBelongsToProject(commandLine, projectRoot) {
  const cmd = normalizeCommand(commandLine);
  if (!cmd) return false;
  const root = String(projectRoot)
    .replace(/\\/g, "/")
    .toLowerCase()
    .replace(/\/+$/, "");
  return cmd.includes(root);
}

export function classifyNextCommand(commandLine) {
  const cmd = normalizeCommand(commandLine);
  if (!cmd) return "other";

  if (
    cmd.includes("next-quality-guard") ||
    cmd.includes("check:safe") ||
    cmd.includes("check:run")
  ) {
    return "quality-guard";
  }

  if (/\bnext(?:\.js)?\s+start\b/.test(cmd)) {
    return "other";
  }

  if (/\bnext(?:\.js)?\s+build\b/.test(cmd)) {
    return "build";
  }

  if (/\bnext(?:\.js)?\s+dev\b/.test(cmd)) {
    return "dev";
  }

  if (
    cmd.includes("next/dist/server/lib/start-server") ||
    cmd.includes("next/dist/bin/next")
  ) {
    if (cmd.includes(" build")) return "build";
    return "dev";
  }

  if (cmd.includes("npm-cli.js") || cmd.includes("npm.cmd") || /\bnpm\b/.test(cmd)) {
    if (/\brun\s+dev\b/.test(cmd)) return "dev-wrapper";
    if (/\brun\s+build\b/.test(cmd)) return "build";
  }

  return "other";
}

export function shouldStopForQualityCheck(kind) {
  return kind === "dev" || kind === "dev-wrapper";
}

export function isBlockingBuild(kind) {
  return kind === "build";
}

export function isProtectedPid(pid, selfPid, parentPid) {
  return pid === selfPid || pid === parentPid;
}
