import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { decideAdminConsoleAccess, decideAdminLogin, resolveSafeAdminRedirect } from "@/lib/admin/auth-policy";
import {
  adminEmailVerificationCopy,
  formatAdminVerificationWait,
} from "@/lib/admin/email-verification/copy";
import {
  CODE_TTL_MS,
  MAX_ATTEMPTS,
} from "@/lib/admin/email-verification/constants";
import {
  adminVerificationCookieOptions,
  adminVerificationCookieName,
} from "@/lib/admin/email-verification/cookie";
import {
  cookieMatchesSession,
  generateAdminVerificationCode,
  hashAdminVerificationCode,
  hashesMatch,
  readAdminVerificationCookie,
  signAdminVerificationCookie,
} from "@/lib/admin/email-verification/crypto";
import {
  attemptsAfterFailure,
  canRequestAdminVerificationCode,
} from "@/lib/admin/email-verification/policy";
import {
  getAdminVerificationSecret,
  resolveAdminVerificationConfirmSecret,
  resolveAdminVerificationIssueSecret,
} from "@/lib/admin/email-verification/env";
import {
  isAdminVerificationEmailConfigured,
  sendAdminVerificationEmail,
} from "@/lib/admin/email-verification/send";
import {
  issueAdminVerificationChallenge,
  verifyAdminVerificationChallenge,
} from "@/lib/admin/email-verification/service";
import { createMemoryAdminVerificationStore } from "@/lib/admin/email-verification/store";
import { extractAuthSessionId } from "@/lib/admin/email-verification/session";
import { ADMIN_HOME_PATH, ADMIN_LOGIN_PATH, ADMIN_VERIFY_PATH } from "@/lib/admin/paths";

const SECRET = "test-admin-email-verification-secret";
const ADMIN = {
  profileId: "11111111-1111-1111-1111-111111111111",
  role: "admin" as const,
  sessionId: "session-admin-1",
  email: "admin@example.com",
};
const STUDENT = {
  profileId: "22222222-2222-2222-2222-222222222222",
  role: "student" as const,
  sessionId: "session-student-1",
  email: "student@example.com",
};

function source(rel: string): string {
  return readFileSync(path.resolve(process.cwd(), rel), "utf8");
}

function createDeps(now: Date, sent: string[], code = "654321") {
  const store = createMemoryAdminVerificationStore();
  return {
    store,
    sent,
    deps: {
      store,
      secret: SECRET,
      now: () => now,
      createCode: () => code,
      send: async (input: { code: string; to: string }) => {
        sent.push(input.code);
        return { ok: true as const };
      },
    },
  };
}

describe("administrative email verification — login policy", () => {
  it("asks an admin for a verification code after password success", () => {
    const decision = decideAdminLogin({
      authenticated: true,
      role: "admin",
      nextPath: "/admin",
    });
    expect(decision.outcome).toBe("challenge");
    if (decision.outcome === "challenge") {
      expect(decision.redirectTo).toBe(ADMIN_VERIFY_PATH);
    }
  });

  it("refuses a student before any admin code can be issued", async () => {
    expect(canRequestAdminVerificationCode("student")).toBe(false);
    const decision = decideAdminLogin({
      authenticated: true,
      role: "student",
      nextPath: "/admin",
    });
    expect(decision.outcome).toBe("deny");

    const sent: string[] = [];
    const { deps } = createDeps(new Date("2026-09-05T09:00:00.000Z"), sent);
    const issued = await issueAdminVerificationChallenge(
      { ...STUDENT, locale: "en", forceNew: true },
      deps,
    );
    expect(issued).toEqual({ ok: false, reason: "not_admin" });
    expect(sent).toEqual([]);
    expect(deps.store.rows).toHaveLength(0);
  });
});

describe("administrative email verification — codes", () => {
  it("accepts a correct unused code", async () => {
    const now = new Date("2026-09-05T09:00:00.000Z");
    const sent: string[] = [];
    const { deps } = createDeps(now, sent);
    const issued = await issueAdminVerificationChallenge(
      { ...ADMIN, locale: "en", forceNew: true },
      deps,
    );
    expect(issued.ok).toBe(true);
    expect(sent).toHaveLength(1);
    expect(JSON.stringify(issued)).not.toContain(sent[0]);

    const verified = await verifyAdminVerificationChallenge(
      { ...ADMIN, code: sent[0] },
      deps,
    );
    expect(verified).toEqual({
      ok: true,
      userId: ADMIN.profileId,
      sessionId: ADMIN.sessionId,
    });
  });

  it("rejects a wrong code without revealing the secret", async () => {
    const now = new Date("2026-09-05T09:00:00.000Z");
    const sent: string[] = [];
    const { deps } = createDeps(now, sent);
    await issueAdminVerificationChallenge(
      { ...ADMIN, locale: "en", forceNew: true },
      deps,
    );

    const verified = await verifyAdminVerificationChallenge(
      { ...ADMIN, code: "000000" },
      deps,
    );
    expect(sent[0]).toBe("654321");
    expect(verified).toEqual({ ok: false, reason: "invalid" });
    expect(JSON.stringify(verified)).not.toMatch(/\d{6}/);
    expect(deps.store.rows[0]?.attemptCount).toBe(1);
  });

  it("rejects an expired code after 10 minutes", async () => {
    const issuedAt = new Date("2026-09-05T09:00:00.000Z");
    const { deps: validDeps, sent: validSent } = createDeps(
      issuedAt,
      [],
      "246810",
    );
    await issueAdminVerificationChallenge(
      { ...ADMIN, locale: "en", forceNew: true },
      validDeps,
    );
    const almost = await verifyAdminVerificationChallenge(
      { ...ADMIN, code: validSent[0] },
      {
        ...validDeps,
        now: () => new Date(issuedAt.getTime() + CODE_TTL_MS - 1000),
      },
    );
    expect(almost.ok).toBe(true);

    const { deps: expiredDeps, sent: expiredSent } = createDeps(
      issuedAt,
      [],
      "135790",
    );
    await issueAdminVerificationChallenge(
      { ...ADMIN, locale: "en", forceNew: true },
      expiredDeps,
    );
    const expired = await verifyAdminVerificationChallenge(
      { ...ADMIN, code: expiredSent[0] },
      {
        ...expiredDeps,
        now: () => new Date(issuedAt.getTime() + CODE_TTL_MS + 1000),
      },
    );
    expect(expired).toEqual({ ok: false, reason: "expired" });
  });

  it("locks immediately on the fifth incorrect attempt", async () => {
    expect(attemptsAfterFailure(3)).toEqual({ attemptCount: 4, locked: false });
    expect(attemptsAfterFailure(4)).toEqual({ attemptCount: 5, locked: true });

    const now = new Date("2026-09-05T09:00:00.000Z");
    const sent: string[] = [];
    const { deps } = createDeps(now, sent);
    await issueAdminVerificationChallenge(
      { ...ADMIN, locale: "en", forceNew: true },
      deps,
    );

    for (let index = 0; index < MAX_ATTEMPTS - 1; index += 1) {
      const result = await verifyAdminVerificationChallenge(
        { ...ADMIN, code: "111111" },
        deps,
      );
      expect(result).toEqual({ ok: false, reason: "invalid" });
      expect(deps.store.rows[0]?.attemptCount).toBe(index + 1);
      expect(deps.store.rows[0]?.lockedAt).toBeNull();
    }

    const fifth = await verifyAdminVerificationChallenge(
      { ...ADMIN, code: "111111" },
      deps,
    );
    expect(fifth).toEqual({ ok: false, reason: "locked" });
    expect(JSON.stringify(fifth)).not.toMatch(/\d{6}/);
    expect(deps.store.rows[0]?.attemptCount).toBe(MAX_ATTEMPTS);
    expect(deps.store.rows[0]?.lockedAt).not.toBeNull();

    const afterLock = await verifyAdminVerificationChallenge(
      { ...ADMIN, code: sent[0] },
      deps,
    );
    expect(afterLock).toEqual({ ok: false, reason: "locked" });
  });

  it("still accepts a correct code after four incorrect attempts", async () => {
    const now = new Date("2026-09-05T09:00:00.000Z");
    const sent: string[] = [];
    const { deps } = createDeps(now, sent);
    await issueAdminVerificationChallenge(
      { ...ADMIN, locale: "en", forceNew: true },
      deps,
    );

    for (let index = 0; index < MAX_ATTEMPTS - 1; index += 1) {
      const result = await verifyAdminVerificationChallenge(
        { ...ADMIN, code: "111111" },
        deps,
      );
      expect(result).toEqual({ ok: false, reason: "invalid" });
    }

    const fifthCorrect = await verifyAdminVerificationChallenge(
      { ...ADMIN, code: sent[0] },
      deps,
    );
    expect(fifthCorrect).toEqual({
      ok: true,
      userId: ADMIN.profileId,
      sessionId: ADMIN.sessionId,
    });
  });

  it("refuses reuse of a consumed code", async () => {
    const now = new Date("2026-09-05T09:00:00.000Z");
    const sent: string[] = [];
    const { deps } = createDeps(now, sent);
    await issueAdminVerificationChallenge(
      { ...ADMIN, locale: "en", forceNew: true },
      deps,
    );
    const first = await verifyAdminVerificationChallenge(
      { ...ADMIN, code: sent[0] },
      deps,
    );
    expect(first.ok).toBe(true);

    const reused = await verifyAdminVerificationChallenge(
      { ...ADMIN, code: sent[0] },
      deps,
    );
    expect(reused).toEqual({ ok: false, reason: "reused" });
  });

  it("invalidates the previous code after a resend", async () => {
    let now = new Date("2026-09-05T09:00:00.000Z");
    const sent: string[] = [];
    const codes = ["111111", "222222"];
    const store = createMemoryAdminVerificationStore();
    const deps = {
      store,
      secret: SECRET,
      now: () => now,
      createCode: () => codes[sent.length] ?? "333333",
      send: async (input: { code: string }) => {
        sent.push(input.code);
        return { ok: true as const };
      },
    };

    await issueAdminVerificationChallenge(
      { ...ADMIN, locale: "en", forceNew: true },
      deps,
    );
    const firstCode = sent[0];

    now = new Date(now.getTime() + 61_000);
    await issueAdminVerificationChallenge(
      { ...ADMIN, locale: "en", forceNew: true },
      deps,
    );
    expect(sent).toHaveLength(2);
    expect(store.rows[1]?.supersededAt).not.toBeNull();

    const oldCode = await verifyAdminVerificationChallenge(
      { ...ADMIN, code: firstCode },
      deps,
    );
    expect(oldCode.ok).toBe(false);

    const newCode = await verifyAdminVerificationChallenge(
      { ...ADMIN, code: sent[1] },
      deps,
    );
    expect(newCode.ok).toBe(true);
  });
});

describe("administrative email verification — access and logout", () => {
  it("refuses direct /admin access before verification", () => {
    const gate = decideAdminConsoleAccess({
      status: "needs_verification",
      pathname: "/admin",
    });
    expect(gate).toEqual({
      outcome: "redirect_verify",
      redirectTo: ADMIN_VERIFY_PATH,
    });
    expect(gate.outcome).not.toBe("allow");
  });

  it("clears the verification cookie on admin logout", () => {
    const actions = source("src/lib/admin/actions.ts");
    expect(actions).toMatch(/clearAdminVerificationCookie/);
    expect(actions.indexOf("clearAdminVerificationCookie")).toBeLessThan(
      actions.indexOf("signOut"),
    );
    expect(ADMIN_LOGIN_PATH).toBe("/admin/login");
  });

  it("refuses external redirects after verification", () => {
    expect(resolveSafeAdminRedirect("https://evil.example")).toBe(ADMIN_HOME_PATH);
    expect(resolveSafeAdminRedirect("//evil.example")).toBe(ADMIN_HOME_PATH);
    expect(resolveSafeAdminRedirect("/dashboard")).toBe(ADMIN_HOME_PATH);
    expect(resolveSafeAdminRedirect("/admin/students")).toBe("/admin/students");
  });
});

describe("administrative email verification — EN/AR", () => {
  it("names the flow administrative email verification in both languages", () => {
    expect(adminEmailVerificationCopy("en").title).toBe(
      "Administrative email verification",
    );
    expect(adminEmailVerificationCopy("ar").title).toBe(
      "التحقق الإداري بالبريد الإلكتروني",
    );
    expect(adminEmailVerificationCopy("en").title.toLowerCase()).not.toContain("aal2");
    expect(adminEmailVerificationCopy("en").title.toLowerCase()).not.toContain("totp");
    expect(formatAdminVerificationWait("en", 60)).toContain("60");
    expect(formatAdminVerificationWait("ar", 60)).toContain("60");
  });
});

describe("administrative email verification — crypto and cookie", () => {
  it("stores only a fingerprint and never the plaintext code", () => {
    const code = generateAdminVerificationCode();
    expect(code).toMatch(/^\d{6}$/);
    const digest = hashAdminVerificationCode({
      secret: SECRET,
      profileId: ADMIN.profileId,
      sessionId: ADMIN.sessionId,
      code,
    });
    expect(digest).toMatch(/^[0-9a-f]{64}$/);
    expect(digest).not.toContain(code);
    expect(
      hashesMatch(
        digest,
        hashAdminVerificationCode({
          secret: SECRET,
          profileId: ADMIN.profileId,
          sessionId: ADMIN.sessionId,
          code,
        }),
      ),
    ).toBe(true);
  });

  it("signs a cookie bound to the user and session", () => {
    const issuedAt = new Date("2026-09-05T09:00:00.000Z");
    const value = signAdminVerificationCookie({
      secret: SECRET,
      userId: ADMIN.profileId,
      sessionId: ADMIN.sessionId,
      issuedAt,
    });
    expect(value).not.toContain(ADMIN.profileId);
    const payload = readAdminVerificationCookie(value, SECRET);
    expect(payload).toMatchObject({
      v: 1,
      sub: ADMIN.profileId,
      sid: ADMIN.sessionId,
    });
    expect(cookieMatchesSession(payload!, ADMIN.profileId, ADMIN.sessionId)).toBe(
      true,
    );
    expect(
      cookieMatchesSession(payload!, ADMIN.profileId, "other-session"),
    ).toBe(false);
    expect(readAdminVerificationCookie(value, "wrong-secret")).toBeNull();

    const options = adminVerificationCookieOptions(true);
    expect(adminVerificationCookieName()).toBe("ai_admin_ev");
    expect(options).toEqual({
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
    });
  });

  it("reads the Auth session id from a JWT payload", () => {
    const payload = Buffer.from(
      JSON.stringify({ sub: ADMIN.profileId, session_id: "sid-9" }),
      "utf8",
    ).toString("base64url");
    expect(extractAuthSessionId(`aaa.${payload}.bbb`)).toBe("sid-9");
  });
});

describe("administrative email verification — dedicated HMAC secret", () => {
  it("never derives the HMAC secret from the Supabase secret key", () => {
    const supabaseOnly = {
      SUPABASE_SECRET_KEY: "sb_secret_test_placeholder_value",
      SUPABASE_SERVICE_ROLE_KEY: "sb_service_role_test_placeholder",
    };
    expect(getAdminVerificationSecret(supabaseOnly)).toBeNull();
    expect(getAdminVerificationSecret({})).toBeNull();
    expect(
      getAdminVerificationSecret({
        ADMIN_EMAIL_VERIFICATION_SECRET: "your_admin_email_verification_secret",
      }),
    ).toBeNull();
    expect(
      getAdminVerificationSecret({
        NEXT_PUBLIC_ADMIN_EMAIL_VERIFICATION_SECRET: SECRET,
      }),
    ).toBeNull();

    const dedicated = getAdminVerificationSecret({
      ADMIN_EMAIL_VERIFICATION_SECRET: SECRET,
      ...supabaseOnly,
    });
    expect(dedicated).toBe(SECRET);
    expect(dedicated).not.toBe(supabaseOnly.SUPABASE_SECRET_KEY);
  });

  it("fails closed without exposing configuration details when the secret is missing", () => {
    const issue = resolveAdminVerificationIssueSecret({
      SUPABASE_SECRET_KEY: "sb_secret_test_placeholder_value",
    });
    const confirm = resolveAdminVerificationConfirmSecret({
      SUPABASE_SECRET_KEY: "sb_secret_test_placeholder_value",
    });
    expect(issue).toEqual({ ok: false, reason: "email_unavailable" });
    expect(confirm).toEqual({ ok: false, reason: "invalid" });
    expect(JSON.stringify(issue)).not.toMatch(/secret|supabase|missing|ADMIN_/i);
    expect(JSON.stringify(confirm)).not.toMatch(/secret|supabase|missing|ADMIN_/i);
  });
});

describe("administrative email verification — wiring and safety", () => {
  it("wires Resend without claiming Supabase AAL2 and never logs codes", async () => {
    expect(isAdminVerificationEmailConfigured({})).toBe(false);
    const sendSource = source("src/lib/admin/email-verification/send.ts");
    const envSource = source("src/lib/admin/email-verification/env.ts");
    expect(envSource).toMatch(/RESEND_API_KEY/);
    expect(envSource).toMatch(/RESEND_EMAIL_DOMAIN/);
    expect(envSource).not.toMatch(/NEXT_PUBLIC_RESEND/);
    expect(envSource).not.toMatch(/SUPABASE_SECRET_KEY|SUPABASE_SERVICE_ROLE_KEY|getSupabaseSecretKey/);
    expect(source("src/lib/admin/email-verification/runtime.ts")).not.toMatch(
      /SUPABASE_SECRET_KEY|SUPABASE_SERVICE_ROLE_KEY|getSupabaseSecretKey|ADMIN_VERIFICATION_SECRET_MISSING/,
    );
    expect(source("src/lib/admin/email-verification/constants.ts")).toMatch(
      /api\.resend\.com\/emails/,
    );
    expect(sendSource).toMatch(/RESEND_EMAILS_URL/);
    expect(sendSource).toMatch(/email_unavailable/);
    expect(sendSource).not.toMatch(/console\.(log|info|debug|error|warn)/);
    expect(source("package.json")).not.toMatch(/"resend"|"nodemailer"|"@sendgrid\/mail"/);

    const service = source("src/lib/admin/email-verification/service.ts");
    expect(service).not.toMatch(/console\.(log|info|debug|error|warn)/);
    expect(service).not.toMatch(/AAL2|TOTP/);

    const fetchImpl = async () => ({ ok: true }) as Response;
    const sent: string[] = [];
    const now = new Date("2026-09-05T09:00:00.000Z");
    const store = createMemoryAdminVerificationStore();
    const issued = await issueAdminVerificationChallenge(
      { ...ADMIN, locale: "en", forceNew: true },
      {
        store,
        secret: SECRET,
        now: () => now,
        createCode: () => "654321",
        send: async (input) => {
          sent.push(input.code);
          return sendAdminVerificationEmail(input, {
            env: {
              RESEND_API_KEY: "re_test_placeholder_key",
              RESEND_EMAIL_DOMAIN: "mail.avatarinstitut.com",
            },
            fetchImpl,
          });
        },
      },
    );
    expect(issued).toEqual({ ok: true, issued: true, retryAfterSeconds: 60 });
    expect(JSON.stringify(issued)).not.toContain("654321");
    expect(sent).toEqual(["654321"]);
  });

  it("keeps student auth files free of admin verification", () => {
    expect(source("src/lib/auth/actions.ts")).not.toMatch(
      /admin_email_verification|AdminEmailVerification/,
    );
    expect(source("src/app/login/page.tsx")).not.toMatch(
      /admin\/verify|adminEmailVerification/,
    );
  });

  it("gates the console and logout through verification", () => {
    const layout = source("src/app/admin/(console)/layout.tsx");
    expect(layout).toMatch(/redirect_verify/);
    expect(source("src/app/admin/login/page.tsx")).toMatch(/needs_verification/);
    expect(source("src/app/admin/verify/page.tsx")).toMatch(
      /requestAdminEmailVerification/,
    );
  });
});
