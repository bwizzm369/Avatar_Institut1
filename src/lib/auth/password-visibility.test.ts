import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const SRC_ROOT = path.resolve(process.cwd(), "src");
const PASSWORD_INPUT_REL = "src/components/PasswordInput.tsx";

const AUTH_FORMS = [
  {
    file: "src/app/login/LoginForm.tsx",
    label: "student login",
    expected: 1,
  },
  {
    file: "src/components/admin/AdminLoginForm.tsx",
    label: "admin login",
    expected: 1,
  },
  {
    file: "src/app/signup/page.tsx",
    label: "signup (password + confirm password)",
    expected: 2,
  },
  {
    file: "src/app/update-password/UpdatePasswordForm.tsx",
    label: "update password (new + confirm)",
    expected: 2,
  },
] as const;

function walkTsx(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next") continue;
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) {
      out.push(...walkTsx(full));
      continue;
    }
    if (/\.(tsx|jsx)$/.test(name)) out.push(full);
  }
  return out;
}

function readSource(relativePath: string): string {
  return readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
}

describe("shared password visibility toggle", () => {
  it("keeps show/hide logic only in PasswordInput", () => {
    const component = readSource(PASSWORD_INPUT_REL);
    const styles = readSource("src/app/globals.css");
    expect(component).toMatch(/type="button"/);
    expect(component).toMatch(/type=\{visible \? "text" : "password"\}/);
    expect(component).toMatch(/useState\(false\)/);
    expect(component).toMatch(/auth\.showPassword/);
    expect(component).toMatch(/auth\.hidePassword/);
    expect(component).toMatch(/setSelectionRange/);
    expect(component).toMatch(/dir=\{dir\}/);
    expect(component).toMatch(/preventDefault/);
    expect(component).not.toMatch(/createBrowserSupabaseClient|signupAction|updatePasswordAction/);
    expect(styles).toMatch(/\.password-toggle[\s\S]*min-width:\s*44px/);
    expect(styles).toMatch(/\.password-toggle[\s\S]*min-height:\s*44px/);
    expect(styles).toMatch(/\.password-toggle[\s\S]*inset-inline-end/);
  });

  it("covers every auth password form with independent PasswordInput instances", () => {
    for (const form of AUTH_FORMS) {
      const source = readSource(form.file);
      const uses = source.match(/<PasswordInput\b/g) ?? [];
      expect(uses.length, form.label).toBe(form.expected);
      expect(source).toMatch(/from "@\/components\/PasswordInput"/);
      expect(source).not.toMatch(/type=["']password["']/);
    }
  });

  it("leaves no leftover type=password inputs outside PasswordInput", () => {
    const leftovers: string[] = [];
    for (const file of walkTsx(SRC_ROOT)) {
      const relative = path.relative(process.cwd(), file).replaceAll("\\", "/");
      if (relative === PASSWORD_INPUT_REL) continue;
      const source = readFileSync(file, "utf8");
      if (
        /type=["']password["']/.test(source) ||
        /type=\{[^}]*password/.test(source)
      ) {
        leftovers.push(relative);
      }
    }
    expect(leftovers).toEqual([]);
  });
});
