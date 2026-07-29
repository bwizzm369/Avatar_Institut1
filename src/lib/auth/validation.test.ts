import { describe, expect, it } from "vitest";
import {
  MIN_PASSWORD_LENGTH,
  validateLogin,
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
});
