import { describe, expect, it } from "vitest";
import {
  readConsultationFormFields,
  validateConsultationRequest,
  validateConsultationStatusUpdate,
} from "@/lib/consultation/validation";

function fields(
  overrides: Partial<Record<string, string>> = {},
): ConsultationFormLike {
  return {
    fullName: "Imane Nasser",
    email: "imane@example.com",
    phone: "+33 6 00 00 00 00",
    locale: "ar",
    requestType: "consultation",
    message: "I would like a private consultation about the programme.",
    consent: "on",
    companyWebsite: "",
    ...overrides,
  };
}

type ConsultationFormLike = Record<string, string>;

function asFormData(values: ConsultationFormLike): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }
  return formData;
}

describe("consultation request validation", () => {
  it("accepts a complete bilingual consultation request", () => {
    const parsed = validateConsultationRequest(
      readConsultationFormFields(asFormData(fields())),
    );
    expect(parsed.ok).toBe(true);
    expect(parsed.spam).toBe(false);
    expect(parsed.values?.email).toBe("imane@example.com");
    expect(parsed.values?.requestType).toBe("consultation");
    expect(parsed.values?.locale).toBe("ar");
    expect(parsed.values?.consentAt).toMatch(/T/);
  });

  it("accepts an information request without phone", () => {
    const parsed = validateConsultationRequest(
      readConsultationFormFields(
        asFormData(fields({ requestType: "information", phone: "  " })),
      ),
    );
    expect(parsed.ok).toBe(true);
    expect(parsed.values?.phone).toBe("");
    expect(parsed.values?.requestType).toBe("information");
  });

  it("rejects missing name, invalid email, short message and no consent", () => {
    const parsed = validateConsultationRequest(
      readConsultationFormFields(
        asFormData(
          fields({
            fullName: " ",
            email: "not-an-email",
            requestType: "other",
            message: "too short",
            consent: "",
          }),
        ),
      ),
    );
    expect(parsed.ok).toBe(false);
    expect(parsed.errors.fullName).toBe("required");
    expect(parsed.errors.email).toBe("invalid");
    expect(parsed.errors.requestType).toBe("required");
    expect(parsed.errors.message).toBe("tooShort");
    expect(parsed.errors.consent).toBe("required");
    expect(parsed.values).toBeNull();
  });

  it("treats a filled honeypot as silent spam without storing values", () => {
    const parsed = validateConsultationRequest(
      readConsultationFormFields(
        asFormData(fields({ companyWebsite: "https://spam.example" })),
      ),
    );
    expect(parsed.ok).toBe(true);
    expect(parsed.spam).toBe(true);
    expect(parsed.values).toBeNull();
  });

  it("does not accept client-supplied status or admin notes in the public form", () => {
    const formData = asFormData(fields());
    formData.set("status", "closed");
    formData.set("adminNotes", "ignore me");
    const parsed = validateConsultationRequest(
      readConsultationFormFields(formData),
    );
    expect(parsed.ok).toBe(true);
    expect(parsed.values).not.toHaveProperty("status");
    expect(JSON.stringify(parsed.values)).not.toMatch(/closed/);
    expect(JSON.stringify(parsed.values)).not.toMatch(/ignore me/);
  });
});

describe("consultation admin status update", () => {
  it("accepts known statuses and trims notes", () => {
    const parsed = validateConsultationStatusUpdate({
      status: "contacted",
      adminNotes: "  Called  ",
    });
    expect(parsed.ok).toBe(true);
    expect(parsed.status).toBe("contacted");
    expect(parsed.adminNotes).toBe("Called");
  });

  it("rejects unknown statuses", () => {
    const parsed = validateConsultationStatusUpdate({
      status: "approved",
      adminNotes: "",
    });
    expect(parsed.ok).toBe(false);
    expect(parsed.status).toBeNull();
  });
});
