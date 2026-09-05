import type { AdminVerificationChallengeState } from "@/lib/admin/email-verification/policy";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";

export type AdminVerificationChallengeInsert = Omit<
  AdminVerificationChallengeState,
  "consumedAt" | "supersededAt" | "lockedAt"
> & {
  consumedAt?: Date | null;
  supersededAt?: Date | null;
  lockedAt?: Date | null;
};

export type AdminVerificationStore = {
  findLatestForProfile(
    profileId: string,
  ): Promise<AdminVerificationChallengeState | null>;
  insert(row: AdminVerificationChallengeInsert): Promise<void>;
  supersedeOpenForProfile(profileId: string, now: Date): Promise<void>;
  incrementAttempts(id: string, attemptCount: number): Promise<void>;
  lock(id: string, attemptCount: number, now: Date): Promise<void>;
  consume(id: string, now: Date): Promise<void>;
};

type ChallengeRow = {
  id: string;
  profile_id: string;
  session_id: string;
  code_hash: string;
  expires_at: string;
  attempt_count: number;
  last_sent_at: string;
  consumed_at: string | null;
  superseded_at: string | null;
  locked_at: string | null;
};

function mapRow(row: ChallengeRow): AdminVerificationChallengeState {
  return {
    id: row.id,
    profileId: row.profile_id,
    sessionId: row.session_id,
    codeHash: row.code_hash,
    expiresAt: new Date(row.expires_at),
    attemptCount: row.attempt_count,
    lastSentAt: new Date(row.last_sent_at),
    consumedAt: row.consumed_at ? new Date(row.consumed_at) : null,
    supersededAt: row.superseded_at ? new Date(row.superseded_at) : null,
    lockedAt: row.locked_at ? new Date(row.locked_at) : null,
  };
}

export function createSupabaseAdminVerificationStore(): AdminVerificationStore {
  const client = createServiceRoleSupabaseClient();

  return {
    async findLatestForProfile(profileId) {
      const { data, error } = await client
        .from("admin_email_verification_challenges")
        .select(
          "id, profile_id, session_id, code_hash, expires_at, attempt_count, last_sent_at, consumed_at, superseded_at, locked_at",
        )
        .eq("profile_id", profileId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        return null;
      }
      return mapRow(data as ChallengeRow);
    },

    async insert(row) {
      const { error } = await client
        .from("admin_email_verification_challenges")
        .insert({
          id: row.id,
          profile_id: row.profileId,
          session_id: row.sessionId,
          code_hash: row.codeHash,
          expires_at: row.expiresAt.toISOString(),
          attempt_count: row.attemptCount,
          last_sent_at: row.lastSentAt.toISOString(),
          consumed_at: row.consumedAt?.toISOString() ?? null,
          superseded_at: row.supersededAt?.toISOString() ?? null,
          locked_at: row.lockedAt?.toISOString() ?? null,
        });
      if (error) {
        throw new Error("ADMIN_VERIFICATION_STORE_INSERT_FAILED");
      }
    },

    async supersedeOpenForProfile(profileId, now) {
      const { error } = await client
        .from("admin_email_verification_challenges")
        .update({ superseded_at: now.toISOString() })
        .eq("profile_id", profileId)
        .is("consumed_at", null)
        .is("superseded_at", null);
      if (error) {
        throw new Error("ADMIN_VERIFICATION_STORE_SUPERSEDE_FAILED");
      }
    },

    async incrementAttempts(id, attemptCount) {
      const { error } = await client
        .from("admin_email_verification_challenges")
        .update({ attempt_count: attemptCount })
        .eq("id", id);
      if (error) {
        throw new Error("ADMIN_VERIFICATION_STORE_ATTEMPT_FAILED");
      }
    },

    async lock(id, attemptCount, now) {
      const { error } = await client
        .from("admin_email_verification_challenges")
        .update({
          attempt_count: attemptCount,
          locked_at: now.toISOString(),
        })
        .eq("id", id);
      if (error) {
        throw new Error("ADMIN_VERIFICATION_STORE_LOCK_FAILED");
      }
    },

    async consume(id, now) {
      const { error } = await client
        .from("admin_email_verification_challenges")
        .update({ consumed_at: now.toISOString() })
        .eq("id", id)
        .is("consumed_at", null);
      if (error) {
        throw new Error("ADMIN_VERIFICATION_STORE_CONSUME_FAILED");
      }
    },
  };
}

export function createMemoryAdminVerificationStore(
  seed: AdminVerificationChallengeState[] = [],
): AdminVerificationStore & { rows: AdminVerificationChallengeState[] } {
  const rows = seed.map((row) => ({ ...row }));

  return {
    rows,
    async findLatestForProfile(profileId) {
      const match = rows
        .filter((row) => row.profileId === profileId)
        .sort((a, b) => b.lastSentAt.getTime() - a.lastSentAt.getTime())[0];
      return match ? { ...match } : null;
    },
    async insert(row) {
      rows.unshift({
        consumedAt: null,
        supersededAt: null,
        lockedAt: null,
        ...row,
      });
    },
    async supersedeOpenForProfile(profileId, now) {
      for (const row of rows) {
        if (row.profileId === profileId && !row.consumedAt && !row.supersededAt) {
          row.supersededAt = now;
        }
      }
    },
    async incrementAttempts(id, attemptCount) {
      const row = rows.find((item) => item.id === id);
      if (row) {
        row.attemptCount = attemptCount;
      }
    },
    async lock(id, attemptCount, now) {
      const row = rows.find((item) => item.id === id);
      if (row) {
        row.attemptCount = attemptCount;
        row.lockedAt = now;
      }
    },
    async consume(id, now) {
      const row = rows.find((item) => item.id === id);
      if (row && !row.consumedAt) {
        row.consumedAt = now;
      }
    },
  };
}
