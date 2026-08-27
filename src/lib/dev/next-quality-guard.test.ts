import { describe, expect, it } from "vitest";
import {
  classifyNextCommand,
  commandBelongsToProject,
  isBlockingBuild,
  isProtectedPid,
  shouldStopForQualityCheck,
} from "../../../tools/next-quality-guard-lib.mjs";

const root = "C:/Users/hp/Desktop/Avatar_Institut1-platform";

describe("next quality guard detection", () => {
  it("recognizes next dev for this project", () => {
    const cmd = `${root}/node_modules/next/dist/bin/next dev`;
    expect(commandBelongsToProject(cmd, root)).toBe(true);
    expect(classifyNextCommand(cmd)).toBe("dev");
    expect(shouldStopForQualityCheck("dev")).toBe(true);
  });

  it("recognizes npm run dev wrappers", () => {
    expect(
      classifyNextCommand(
        `node ${root}/node_modules/npm/bin/npm-cli.js run dev`,
      ),
    ).toBe("dev-wrapper");
  });

  it("recognizes next build", () => {
    expect(
      classifyNextCommand(`${root}/node_modules/next/dist/bin/next build`),
    ).toBe("build");
    expect(isBlockingBuild("build")).toBe(true);
  });

  it("does not treat the quality guard as a stoppable dev server", () => {
    expect(
      classifyNextCommand(
        `node ${root}/tools/next-quality-guard.mjs check`,
      ),
    ).toBe("quality-guard");
    expect(shouldStopForQualityCheck("quality-guard")).toBe(false);
  });

  it("ignores Next.js from another directory", () => {
    expect(
      commandBelongsToProject(
        "C:/other-app/node_modules/next/dist/bin/next dev",
        root,
      ),
    ).toBe(false);
  });

  it("does not treat next start as a stoppable dev server", () => {
    expect(
      classifyNextCommand(`${root}/node_modules/next/dist/bin/next start`),
    ).toBe("other");
    expect(shouldStopForQualityCheck("other")).toBe(false);
  });

  it("never targets the current process or its parent", () => {
    expect(isProtectedPid(10, 10, 1)).toBe(true);
    expect(isProtectedPid(1, 10, 1)).toBe(true);
    expect(isProtectedPid(99, 10, 1)).toBe(false);
  });
});
