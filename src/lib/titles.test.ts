import { describe, expect, it } from "vitest";
import { formatDocumentTitle, resolveTitleKey, englishAbsoluteTitle } from "@/lib/titles";

describe("document titles", () => {
  it("resolves route keys", () => {
    expect(resolveTitleKey("/")).toBe("home");
    expect(resolveTitleKey("/courses")).toBe("courses");
    expect(resolveTitleKey("/courses/foo")).toBe("courseDetail");
    expect(resolveTitleKey("/cart")).toBe("cart");
    expect(resolveTitleKey("/login")).toBe("login");
    expect(resolveTitleKey("/signup")).toBe("signup");
    expect(resolveTitleKey("/dashboard")).toBe("dashboard");
    expect(resolveTitleKey("/dashboard/courses")).toBe("dashboardCourses");
    expect(resolveTitleKey("/dashboard/certificates")).toBe("dashboardCertificates");
  });

  it("formats bilingual titles", () => {
    expect(formatDocumentTitle("/", "en")).toBe("Home · Avatar Institut");
    expect(formatDocumentTitle("/", "ar")).toBe("الرئيسية · Avatar Institut");
    expect(formatDocumentTitle("/courses", "en")).toBe("Courses · Avatar Institut");
    expect(englishAbsoluteTitle("home")).toBe("Home · Avatar Institut");
  });
});
