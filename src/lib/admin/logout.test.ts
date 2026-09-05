import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ADMIN_LOGIN_PATH } from "@/lib/admin/paths";
import { adminLogoutDestination } from "@/lib/admin/shell";

describe("admin logout contract", () => {
  it("lands on admin login after sign-out", () => {
    expect(ADMIN_LOGIN_PATH).toBe("/admin/login");
    expect(adminLogoutDestination()).toBe("/admin/login");
    expect(adminLogoutDestination()).not.toBe("/");
    expect(ADMIN_LOGIN_PATH.includes("signup")).toBe(false);
  });

  it("invalidates administrative email verification on logout", () => {
    const actions = readFileSync(
      path.resolve(process.cwd(), "src/lib/admin/actions.ts"),
      "utf8",
    );
    expect(actions).toMatch(/clearAdminVerificationCookie/);
  });
});
