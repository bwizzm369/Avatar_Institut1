import { describe, expect, it } from "vitest";
import {
  MIN_PASSWORD_LENGTH,
  validateForgotPassword,
  validateLogin,
  validatePasswordReset,
  validateSignup,
} from "@/lib/auth/validation";

describe("auth form validation", () => {
  it("rejects empty login fields", () => {
    const result = validateLogin({ email: "  ", password: "" });
    expect(result.ok).toBe(false);
    expect(result.errors.email).toBe("required");
    expect(result.errors.password).toBe("required");
  });

  it("rejects invalid email on login", () => {
    const result = validateLogin({ email: "not-an-email", password: "secret" });
    expect(result.ok).toBe(false);
    expect(result.errors.email).toBe("invalid");
  });

  it("accepts a valid login payload and normalizes email", () => {
    const result = validateLogin({
      email: " Student@Avatar.example ",
      password: "secret123",
    });
    expect(result.ok).toBe(true);
    expect(result.values.email).toBe("student@avatar.example");
  });

  it("requires names and a long enough password on signup", () => {
    const result = validateSignup({
      email: "a@b.co",
      password: "short",
      firstName: "",
      lastName: " ",
    });
    expect(result.ok).toBe(false);
    expect(result.errors.firstName).toBe("required");
    expect(result.errors.lastName).toBe("required");
    expect(result.errors.password).toBe("tooShort");
    expect(MIN_PASSWORD_LENGTH).toBe(8);
  });

  it("accepts a valid signup payload", () => {
    const result = validateSignup({
      email: "new@avatar.example",
      password: "longenough",
      firstName: "Ada",
      lastName: "Lovelace",
    });
    expect(result.ok).toBe(true);
    expect(result.values.firstName).toBe("Ada");
  });

  it("validates forgot-password email without touching passwords", () => {
    expect(validateForgotPassword({ email: "" }).errors.email).toBe("required");
    expect(validateForgotPassword({ email: "nope" }).errors.email).toBe(
      "invalid",
    );
    const ok = validateForgotPassword({
      email: " bwizzm369@gmail.com ",
    });
    expect(ok.ok).toBe(true);
    expect(ok.values.email).toBe("bwizzm369@gmail.com");
  });

  it("rejects mismatched or short password resets", () => {
    const short = validatePasswordReset({
      password: "short",
      confirmPassword: "short",
    });
    expect(short.ok).toBe(false);
    expect(short.errors.password).toBe("tooShort");

    const mismatch = validatePasswordReset({
      password: "longenough",
      confirmPassword: "different1",
    });
    expect(mismatch.ok).toBe(false);
    expect(mismatch.errors.confirmPassword).toBe("mismatch");
  });

  it("accepts a matching new password", () => {
    const result = validatePasswordReset({
      password: "longenough",
      confirmPassword: "longenough",
    });
    expect(result.ok).toBe(true);
    expect(result.values.password).toBe("longenough");
  });
});
