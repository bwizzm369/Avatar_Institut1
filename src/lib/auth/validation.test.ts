import { describe, expect, it } from "vitest";
import {
  MIN_PASSWORD_LENGTH,
  validateForgotPassword,
  validateLogin,
  validatePasswordReset,
  validateSignup,
} from "@/lib/auth/validation";
import type { SignupInput } from "@/lib/auth/signup-fields";

export function validSignupInput(
  overrides: Partial<SignupInput> = {},
): SignupInput {
  return {
    email: "new@avatar.example",
    password: "longenough",
    confirmPassword: "longenough",
    firstName: "Ada",
    lastName: "Lovelace",
    phone: "+212 600000000",
    country: "Morocco",
    locale: "en",
    previouslyStudied: "no",
    previousCourse: "",
    declaredCertificateNumber: "",
    ...overrides,
  };
}

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
    const result = validateSignup(
      validSignupInput({
        email: "a@b.co",
        password: "short",
        confirmPassword: "short",
        firstName: "",
        lastName: " ",
      }),
    );
    expect(result.ok).toBe(false);
    expect(result.errors.firstName).toBe("required");
    expect(result.errors.lastName).toBe("required");
    expect(result.errors.password).toBe("tooShort");
    expect(MIN_PASSWORD_LENGTH).toBe(8);
  });

  it("rejects mismatched signup password confirmation", () => {
    const result = validateSignup(
      validSignupInput({ confirmPassword: "different1" }),
    );
    expect(result.ok).toBe(false);
    expect(result.errors.confirmPassword).toBe("mismatch");
  });

  it("requires phone, country, and previous-study answer", () => {
    const result = validateSignup(
      validSignupInput({
        phone: "  ",
        country: "",
        previouslyStudied: "",
      }),
    );
    expect(result.ok).toBe(false);
    expect(result.errors.phone).toBe("required");
    expect(result.errors.country).toBe("required");
    expect(result.errors.previouslyStudied).toBe("required");
  });

  it("requires previous course when the student studied at Avatar before", () => {
    const result = validateSignup(
      validSignupInput({
        previouslyStudied: "yes",
        previousCourse: "  ",
      }),
    );
    expect(result.ok).toBe(false);
    expect(result.errors.previousCourse).toBe("required");
  });

  it("accepts a valid new-student signup payload", () => {
    const result = validateSignup(validSignupInput());
    expect(result.ok).toBe(true);
    expect(result.values.firstName).toBe("Ada");
    expect(result.values.email).toBe("new@avatar.example");
    expect(result.values.previouslyStudied).toBe(false);
    expect(result.values.previousCourse).toBeNull();
    expect(result.values.declaredCertificateNumber).toBeNull();
  });

  it("keeps an optional certificate number for returning students", () => {
    const result = validateSignup(
      validSignupInput({
        previouslyStudied: "yes",
        previousCourse: "Foundations",
        declaredCertificateNumber: " AVT-2024-000111 ",
      }),
    );
    expect(result.ok).toBe(true);
    expect(result.values.previouslyStudied).toBe(true);
    expect(result.values.previousCourse).toBe("Foundations");
    expect(result.values.declaredCertificateNumber).toBe("AVT-2024-000111");
  });

  it("coerces an injected locale to en or ar only", () => {
    const result = validateSignup(validSignupInput({ locale: "admin" }));
    expect(result.ok).toBe(true);
    expect(result.values.locale).toBe("en");
  });

  it("ignores previous-course fields when the student is new", () => {
    const result = validateSignup(
      validSignupInput({
        previouslyStudied: "no",
        previousCourse: "Should not keep",
        declaredCertificateNumber: "AVT-2024-000111",
      }),
    );
    expect(result.ok).toBe(true);
    expect(result.values.previousCourse).toBeNull();
    expect(result.values.declaredCertificateNumber).toBeNull();
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
