export const MIN_PASSWORD_LENGTH = 8;

export type AuthFieldErrors = {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type SignupInput = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  const value = normalizeEmail(email);
  // Practical email check — not a full RFC parser.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function validateLogin(input: LoginInput): {
  ok: boolean;
  errors: AuthFieldErrors;
  values: LoginInput;
} {
  const errors: AuthFieldErrors = {};
  const email = normalizeEmail(input.email);
  const password = input.password;

  if (!email) {
    errors.email = "required";
  } else if (!isValidEmail(email)) {
    errors.email = "invalid";
  }

  if (!password) {
    errors.password = "required";
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    values: { email, password },
  };
}

export function validateSignup(input: SignupInput): {
  ok: boolean;
  errors: AuthFieldErrors;
  values: SignupInput;
} {
  const errors: AuthFieldErrors = {};
  const email = normalizeEmail(input.email);
  const password = input.password;
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();

  if (!firstName) {
    errors.firstName = "required";
  }

  if (!lastName) {
    errors.lastName = "required";
  }

  if (!email) {
    errors.email = "required";
  } else if (!isValidEmail(email)) {
    errors.email = "invalid";
  }

  if (!password) {
    errors.password = "required";
  } else if (password.length < MIN_PASSWORD_LENGTH) {
    errors.password = "tooShort";
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    values: { email, password, firstName, lastName },
  };
}
