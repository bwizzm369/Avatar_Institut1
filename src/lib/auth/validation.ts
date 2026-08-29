import {
  parsePreviouslyStudiedFlag,
  parseSignupLocale,
  type SignupFieldErrors,
  type SignupInput,
  type SignupValues,
} from "@/lib/auth/signup-fields";

export const MIN_PASSWORD_LENGTH = 8;

export type AuthFieldErrors = SignupFieldErrors;

export type LoginInput = {
  email: string;
  password: string;
};

export type { SignupInput, SignupValues };

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

const MAX_PHONE_LENGTH = 40;
const MAX_COUNTRY_LENGTH = 120;
const MAX_COURSE_LENGTH = 200;
const MAX_CERTIFICATE_LENGTH = 80;

export function validateSignup(input: SignupInput): {
  ok: boolean;
  errors: AuthFieldErrors;
  values: SignupValues;
} {
  const errors: AuthFieldErrors = {};
  const email = normalizeEmail(input.email);
  const password = input.password;
  const confirmPassword = input.confirmPassword;
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const phone = input.phone.trim();
  const country = input.country.trim();
  const locale = parseSignupLocale(input.locale);
  const previouslyStudied = parsePreviouslyStudiedFlag(input.previouslyStudied);
  const previousCourseRaw = input.previousCourse.trim();
  const declaredRaw = input.declaredCertificateNumber.trim();

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

  if (!phone) {
    errors.phone = "required";
  } else if (phone.length > MAX_PHONE_LENGTH) {
    errors.phone = "tooLong";
  }

  if (!country) {
    errors.country = "required";
  } else if (country.length > MAX_COUNTRY_LENGTH) {
    errors.country = "tooLong";
  }

  if (!password) {
    errors.password = "required";
  } else if (password.length < MIN_PASSWORD_LENGTH) {
    errors.password = "tooShort";
  }

  if (!confirmPassword) {
    errors.confirmPassword = "required";
  } else if (password && confirmPassword !== password) {
    errors.confirmPassword = "mismatch";
  }

  if (previouslyStudied == null) {
    errors.previouslyStudied = "required";
  }

  let previousCourse: string | null = null;
  let declaredCertificateNumber: string | null = null;

  if (previouslyStudied === true) {
    if (!previousCourseRaw) {
      errors.previousCourse = "required";
    } else if (previousCourseRaw.length > MAX_COURSE_LENGTH) {
      errors.previousCourse = "tooLong";
    } else {
      previousCourse = previousCourseRaw;
    }

    if (declaredRaw) {
      if (declaredRaw.length > MAX_CERTIFICATE_LENGTH) {
        errors.declaredCertificateNumber = "tooLong";
      } else {
        declaredCertificateNumber = declaredRaw;
      }
    }
  }

  const studied = previouslyStudied === true;

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    values: {
      email,
      password,
      firstName,
      lastName,
      phone,
      country,
      locale,
      previouslyStudied: studied,
      previousCourse: studied ? previousCourse : null,
      declaredCertificateNumber: studied ? declaredCertificateNumber : null,
    },
  };
}

export function validateForgotPassword(input: { email: string }): {
  ok: boolean;
  errors: AuthFieldErrors;
  values: { email: string };
} {
  const errors: AuthFieldErrors = {};
  const email = normalizeEmail(input.email);

  if (!email) {
    errors.email = "required";
  } else if (!isValidEmail(email)) {
    errors.email = "invalid";
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    values: { email },
  };
}

export function validatePasswordReset(input: {
  password: string;
  confirmPassword: string;
}): {
  ok: boolean;
  errors: AuthFieldErrors;
  values: { password: string };
} {
  const errors: AuthFieldErrors = {};
  const password = input.password;
  const confirmPassword = input.confirmPassword;

  if (!password) {
    errors.password = "required";
  } else if (password.length < MIN_PASSWORD_LENGTH) {
    errors.password = "tooShort";
  }

  if (!confirmPassword) {
    errors.confirmPassword = "required";
  } else if (password && confirmPassword !== password) {
    errors.confirmPassword = "mismatch";
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    values: { password },
  };
}
