import { describe, expect, it } from "vitest";
import {
  assertCanMutateStudentPass,
  canMutateStudentPass,
  hasActiveStudentPass,
  isStudentPassManualSource,
  STUDENT_PASS_PRICE_EUR,
  STUDENT_PASS_PRICE_LABEL,
} from "@/lib/admin/student-pass/types";
import {
  activateStudentPass,
  cancelStudentPass,
  deactivateStudentPass,
} from "@/lib/admin/student-pass/mutations";
import { isAdminRole } from "@/lib/admin/guards";

type SubRow = {
  id: string;
  profile_id: string;
  status: string;
  started_at: string;
  expires_at: string | null;
  cancelled_at: string | null;
  source: string | null;
};

function createMockClient(seed: SubRow[] = []) {
  const rows = new Map<string, SubRow>(
    seed.map((row) => [row.profile_id, { ...row }]),
  );

  return {
    rows,
    client: {
      from(_table: string) {
        return {
          select(_columns: string) {
            return {
              eq(column: string, value: string) {
                return {
                  maybeSingle: async () => {
                    if (column !== "profile_id") {
                      return { data: null, error: { message: "bad eq" } };
                    }
                    const row = rows.get(value) ?? null;
                    return { data: row, error: null };
                  },
                };
              },
            };
          },
          insert(payload: Record<string, unknown>) {
            return Promise.resolve().then(() => {
              const profileId = String(payload.profile_id);
              if (rows.has(profileId)) {
                return {
                  data: null,
                  error: { message: "duplicate profile_id" },
                };
              }
              const row: SubRow = {
                id: `sub-${rows.size + 1}`,
                profile_id: profileId,
                status: String(payload.status ?? "inactive"),
                started_at: String(payload.started_at),
                expires_at: (payload.expires_at as string | null) ?? null,
                cancelled_at: (payload.cancelled_at as string | null) ?? null,
                source: (payload.source as string | null) ?? null,
              };
              rows.set(profileId, row);
              return { data: row, error: null };
            });
          },
          update(payload: Record<string, unknown>) {
            return {
              eq(column: string, value: string) {
                return Promise.resolve().then(() => {
                  if (column !== "id") {
                    return { data: null, error: { message: "bad update eq" } };
                  }
                  const existing = [...rows.values()].find((r) => r.id === value);
                  if (!existing) {
                    return { data: null, error: { message: "not found" } };
                  }
                  const next: SubRow = {
                    ...existing,
                    status:
                      payload.status !== undefined
                        ? String(payload.status)
                        : existing.status,
                    started_at:
                      payload.started_at !== undefined
                        ? String(payload.started_at)
                        : existing.started_at,
                    expires_at:
                      payload.expires_at !== undefined
                        ? ((payload.expires_at as string | null) ?? null)
                        : existing.expires_at,
                    cancelled_at:
                      payload.cancelled_at !== undefined
                        ? ((payload.cancelled_at as string | null) ?? null)
                        : existing.cancelled_at,
                    source:
                      payload.source !== undefined
                        ? ((payload.source as string | null) ?? null)
                        : existing.source,
                  };
                  rows.set(next.profile_id, next);
                  return { data: next, error: null };
                });
              },
            };
          },
        };
      },
    },
  };
}

describe("hasActiveStudentPass", () => {
  const now = new Date("2026-08-08T12:00:00.000Z");

  it("returns true for active with null expires_at", () => {
    expect(
      hasActiveStudentPass({ status: "active", expires_at: null }, now),
    ).toBe(true);
  });

  it("returns true for active with future expires_at", () => {
    expect(
      hasActiveStudentPass(
        { status: "active", expires_at: "2026-09-01T00:00:00.000Z" },
        now,
      ),
    ).toBe(true);
  });

  it("returns false when expired (past expires_at)", () => {
    expect(
      hasActiveStudentPass(
        { status: "active", expires_at: "2026-07-01T00:00:00.000Z" },
        now,
      ),
    ).toBe(false);
  });

  it("returns false when status is cancelled", () => {
    expect(
      hasActiveStudentPass({ status: "cancelled", expires_at: null }, now),
    ).toBe(false);
  });

  it("returns false when status is inactive", () => {
    expect(
      hasActiveStudentPass({ status: "inactive", expires_at: null }, now),
    ).toBe(false);
  });

  it("returns false when status is expired", () => {
    expect(
      hasActiveStudentPass({ status: "expired", expires_at: null }, now),
    ).toBe(false);
  });

  it("returns false for missing subscription", () => {
    expect(hasActiveStudentPass(null, now)).toBe(false);
    expect(hasActiveStudentPass(undefined, now)).toBe(false);
  });
});

describe("Student Pass price socle", () => {
  it("documents the 12 EUR / month offer", () => {
    expect(STUDENT_PASS_PRICE_EUR).toBe(12);
    expect(STUDENT_PASS_PRICE_LABEL).toBe("12 €/month");
  });
});

describe("Student Pass mutation policy", () => {
  it("forbids student mutations", () => {
    expect(canMutateStudentPass("student")).toBe(false);
    expect(() => assertCanMutateStudentPass("student")).toThrow(
      /STUDENT_PASS_MUTATION_FORBIDDEN/,
    );
  });

  it("allows admin and service_role mutations", () => {
    expect(canMutateStudentPass("admin")).toBe(true);
    expect(canMutateStudentPass("service_role")).toBe(true);
    expect(isAdminRole("admin")).toBe(true);
    expect(isAdminRole("student")).toBe(false);
  });

  it("accepts only manual or offline activation sources", () => {
    expect(isStudentPassManualSource("manual")).toBe(true);
    expect(isStudentPassManualSource("offline")).toBe(true);
    expect(isStudentPassManualSource("stripe")).toBe(false);
  });
});

describe("admin Student Pass mutations", () => {
  const now = new Date("2026-08-08T12:00:00.000Z");

  it("activates a new subscription with source = manual", async () => {
    const mock = createMockClient();
    const result = await activateStudentPass({
      client: mock.client as never,
      profileId: "profile-1",
      source: "manual",
      context: "admin",
      now,
    });

    expect(result).toEqual({
      ok: true,
      profileId: "profile-1",
      status: "active",
    });
    const row = mock.rows.get("profile-1");
    expect(row?.status).toBe("active");
    expect(row?.source).toBe("manual");
    expect(row?.expires_at).toBeNull();
    expect(row?.cancelled_at).toBeNull();
    expect(hasActiveStudentPass(row!, now)).toBe(true);
  });

  it("activates with source = offline", async () => {
    const mock = createMockClient();
    const result = await activateStudentPass({
      client: mock.client as never,
      profileId: "profile-2",
      source: "offline",
      context: "admin",
      now,
    });
    expect(result.ok).toBe(true);
    expect(mock.rows.get("profile-2")?.source).toBe("offline");
  });

  it("deactivates an active pass", async () => {
    const mock = createMockClient([
      {
        id: "sub-1",
        profile_id: "profile-1",
        status: "active",
        started_at: "2026-08-01T00:00:00.000Z",
        expires_at: null,
        cancelled_at: null,
        source: "manual",
      },
    ]);

    const result = await deactivateStudentPass({
      client: mock.client as never,
      profileId: "profile-1",
      context: "admin",
    });

    expect(result).toEqual({
      ok: true,
      profileId: "profile-1",
      status: "inactive",
    });
    const row = mock.rows.get("profile-1")!;
    expect(row.status).toBe("inactive");
    expect(row.cancelled_at).toBeNull();
    expect(hasActiveStudentPass(row, now)).toBe(false);
  });

  it("cancels a pass and sets cancelled_at", async () => {
    const mock = createMockClient([
      {
        id: "sub-1",
        profile_id: "profile-1",
        status: "active",
        started_at: "2026-08-01T00:00:00.000Z",
        expires_at: null,
        cancelled_at: null,
        source: "manual",
      },
    ]);

    const result = await cancelStudentPass({
      client: mock.client as never,
      profileId: "profile-1",
      context: "admin",
      now,
    });

    expect(result.ok).toBe(true);
    const row = mock.rows.get("profile-1")!;
    expect(row.status).toBe("cancelled");
    expect(row.cancelled_at).toBe(now.toISOString());
    expect(hasActiveStudentPass(row, now)).toBe(false);
  });

  it("rejects student context on activate", async () => {
    const mock = createMockClient();
    await expect(
      activateStudentPass({
        client: mock.client as never,
        profileId: "profile-1",
        source: "manual",
        context: "student",
        now,
      }),
    ).rejects.toThrow(/STUDENT_PASS_MUTATION_FORBIDDEN/);
    expect(mock.rows.size).toBe(0);
  });

  it("rejects invalid activation source", async () => {
    const mock = createMockClient();
    const result = await activateStudentPass({
      client: mock.client as never,
      profileId: "profile-1",
      source: "stripe",
      context: "admin",
      now,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/manual or offline/i);
    }
  });
});
