import { describe, expect, it } from "vitest";
import { getDirection, isLocale, msg } from "@/lib/i18n";

describe("i18n helpers", () => {
  it("validates locales and directions", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale("ar")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(getDirection("en")).toBe("ltr");
    expect(getDirection("ar")).toBe("rtl");
  });

  it("returns bilingual messages", () => {
    expect(msg("nav.courses", "en")).toBe("Courses");
    expect(msg("nav.courses", "ar")).toBe("الدورات");
  });
});
