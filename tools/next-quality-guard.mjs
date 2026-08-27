#!/usr/bin/env node
/**
 * Keep Avatar Institut `next dev` and `next build` from sharing a live `.next`.
 * Detects this project's Next processes by command line + project path (no fixed PID).
 */
import { spawn, spawnSync } from "node:child_process";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { closeSync, openSync, unlinkSync, writeFileSync } from "node:fs";
import {
  classifyNextCommand,
  commandBelongsToProject,
  isBlockingBuild,
  isProtectedPid,
  shouldStopForQualityCheck,
} from "./next-quality-guard-lib.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEV_PORT = 3000;
const LOCK_PATH = path.join(
  os.tmpdir(),
  `avatar-institut-quality-${hashString(PROJECT_ROOT)}.lock`,
);

function hashString(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(16);
}

function log(message) {
  console.log(`[next-quality-guard] ${message}`);
}

function fail(message) {
  throw new Error(message);
}

function listNodeProcesses() {
  if (process.platform === "win32") {
    const result = spawnSync(
      "powershell.exe",
      [
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        "Get-CimInstance Win32_Process -Filter \"Name = 'node.exe'\" | Select-Object ProcessId,CommandLine | ConvertTo-Json -Compress",
      ],
      { encoding: "utf8", timeout: 20000 },
    );
    if (result.status !== 0) {
      throw new Error(result.stderr?.trim() || "Could not list node processes.");
    }
    const parsed = JSON.parse(result.stdout.trim() || "[]");
    const rows = Array.isArray(parsed) ? parsed : [parsed];
    return rows
      .filter((row) => row && row.ProcessId)
      .map((row) => ({
        pid: Number(row.ProcessId),
        command: String(row.CommandLine ?? ""),
      }));
  }

  const result = spawnSync("ps", ["-eo", "pid=,args="], {
    encoding: "utf8",
    timeout: 20000,
  });
  if (result.status !== 0) {
    throw new Error(result.stderr?.trim() || "Could not list processes.");
  }
  return result.stdout
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^(\d+)\s+(.*)$/);
      if (!match) return null;
      return { pid: Number(match[1]), command: match[2] };
    })
    .filter((row) => row && !Number.isNaN(row.pid));
}

function listListeningPids(port) {
  if (process.platform === "win32") {
    const result = spawnSync(
      "powershell.exe",
      [
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        `Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess`,
      ],
      { encoding: "utf8", timeout: 20000 },
    );
    if (result.status !== 0) return [];
    return [
      ...new Set(
        result.stdout
          .split(/\s+/)
          .map((value) => Number(value))
          .filter((pid) => Number.isInteger(pid) && pid > 0),
      ),
    ];
  }

  const result = spawnSync(
    "lsof",
    ["-iTCP:" + port, "-sTCP:LISTEN", "-n", "-P", "-t"],
    { encoding: "utf8", timeout: 20000 },
  );
  if (result.status !== 0) return [];
  return [
    ...new Set(
      result.stdout
        .split(/\s+/)
        .map((value) => Number(value))
        .filter((pid) => Number.isInteger(pid) && pid > 0),
    ),
  ];
}

function inspectProjectNext() {
  const processes = listNodeProcesses();
  const owned = processes.filter((proc) =>
    commandBelongsToProject(proc.command, PROJECT_ROOT),
  );
  return owned.map((proc) => ({
    ...proc,
    kind: classifyNextCommand(proc.command),
  }));
}

function inspectProjectNextSafe(required) {
  try {
    return inspectProjectNext();
  } catch (error) {
    if (required) {
      throw error;
    }
    log(
      `Process listing unavailable (${error instanceof Error ? error.message : error}). Continuing.`,
    );
    return [];
  }
}

function stopPid(pid) {
  if (isProtectedPid(pid, process.pid, process.ppid ?? 0)) return;
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/PID", String(pid), "/T", "/F"], {
      encoding: "utf8",
      timeout: 15000,
    });
    return;
  }
  try {
    process.kill(pid, "SIGTERM");
  } catch {
    /* already gone */
  }
}

function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host: "127.0.0.1" }, () => {
      socket.end();
      resolve(true);
    });
    socket.setTimeout(800, () => {
      socket.destroy();
      resolve(false);
    });
    socket.on("error", () => resolve(false));
  });
}

async function waitFor(predicate, timeoutMs, label) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await predicate()) return true;
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  throw new Error(`Timed out waiting for ${label}.`);
}

function acquireLock() {
  try {
    const fd = openSync(LOCK_PATH, "wx");
    writeFileSync(fd, `${process.pid}\n${PROJECT_ROOT}\n`);
    closeSync(fd);
  } catch {
    fail(
      `Another quality/build command is already running for this project.\nLock: ${LOCK_PATH}`,
    );
  }
}

function releaseLock() {
  try {
    unlinkSync(LOCK_PATH);
  } catch {
    /* ignore */
  }
}

function runNpmScript(script) {
  const result = spawnSync("npm", ["run", script], {
    cwd: PROJECT_ROOT,
    stdio: "inherit",
    shell: true,
    env: process.env,
  });
  if (result.status !== 0) {
    fail(`npm run ${script} failed.`);
  }
}

function startDevDetached() {
  const nextBin = path.join(PROJECT_ROOT, "node_modules", "next", "dist", "bin", "next");
  const child = spawn(process.execPath, [nextBin, "dev"], {
    cwd: PROJECT_ROOT,
    detached: true,
    stdio: "ignore",
    windowsHide: true,
    env: process.env,
  });
  child.unref();
}

async function stopProjectDev() {
  let stopped = false;
  const found = inspectProjectNext().filter((proc) =>
    shouldStopForQualityCheck(proc.kind),
  );
  const portPids = listListeningPids(DEV_PORT);
  const byPid = new Map(inspectProjectNext().map((proc) => [proc.pid, proc]));

  for (const pid of portPids) {
    const proc = byPid.get(pid);
    if (proc && shouldStopForQualityCheck(proc.kind)) {
      found.push(proc);
    } else if (proc && proc.kind === "other") {
      fail(
        `Port ${DEV_PORT} is in use by a non-Next process (PID ${pid}). Refusing to kill it.`,
      );
    }
  }

  const unique = [...new Map(found.map((proc) => [proc.pid, proc])).values()];
  if (unique.length === 0 && portPids.length > 0) {
    const stillOpen = await isPortOpen(DEV_PORT);
    if (stillOpen) {
      fail(
        `Port ${DEV_PORT} is busy but no Avatar Institut next dev command was identified. Not killing unknown processes.`,
      );
    }
  }

  for (const proc of unique) {
    log(`Stopping ${proc.kind} (PID ${proc.pid})`);
    stopPid(proc.pid);
    stopped = true;
  }

  if (stopped) {
    await waitFor(async () => !(await isPortOpen(DEV_PORT)), 30000, `port ${DEV_PORT} to be free`);
    log(`Port ${DEV_PORT} is free.`);
  }

  return stopped;
}

async function assertNoConcurrentBuild() {
  const builds = inspectProjectNext().filter((proc) => isBlockingBuild(proc.kind));
  const foreign = builds.filter(
    (proc) => !isProtectedPid(proc.pid, process.pid, process.ppid ?? 0),
  );
  if (foreign.length > 0) {
    fail(
      `A Next.js build is already running for this project (PID ${foreign[0].pid}).`,
    );
  }
}

async function runNextBuild() {
  const nextBin = path.join(PROJECT_ROOT, "node_modules", "next", "dist", "bin", "next");
  const result = spawnSync(process.execPath, [nextBin, "build"], {
    cwd: PROJECT_ROOT,
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) {
    fail("next build failed.");
  }
}

async function runCheck() {
  acquireLock();
  let stoppedDev = false;
  try {
    await assertNoConcurrentBuild();
    log("Running lint, typecheck, and tests (dev server may stay up).");
    runNpmScript("lint");
    runNpmScript("typecheck");
    runNpmScript("test");
    stoppedDev = await stopProjectDev();
    await assertNoConcurrentBuild();
    log("Running next build.");
    await runNextBuild();
    if (stoppedDev) {
      log("Restarting npm run dev.");
      startDevDetached();
      await waitFor(() => isPortOpen(DEV_PORT), 90000, `port ${DEV_PORT} to listen`);
      log(`Local server is back on http://localhost:${DEV_PORT}`);
    } else {
      log("No project next dev was running; leaving the port untouched.");
    }
  } finally {
    releaseLock();
  }
}

async function runBuild() {
  acquireLock();
  try {
    const inspected = inspectProjectNextSafe(false);
    const dev = inspected.filter((proc) => shouldStopForQualityCheck(proc.kind));
    if (dev.length > 0) {
      fail(
        "Refusing `next build` while `next dev` is running for this project.\nUse `npm run check:safe` (stops the server, runs checks, then restarts one `npm run dev`).",
      );
    }
    await assertNoConcurrentBuild();
    log("Running next build.");
    await runNextBuild();
  } finally {
    releaseLock();
  }
}

async function main() {
  const command = process.argv[2] ?? "check";
  if (command === "check") {
    await runCheck();
    return;
  }
  if (command === "build") {
    await runBuild();
    return;
  }
  fail(`Unknown command "${command}". Use check or build.`);
}

const invoked = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invoked) {
  main().catch((error) => {
    releaseLock();
    console.error(
      `[next-quality-guard] ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  });
}
