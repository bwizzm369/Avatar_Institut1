-- Avatar Institut — Administrative email verification (Lot 1)
-- Idempotent local migration. Apply manually in Supabase when approved.
-- Do not run remotely from this repository without explicit approval.
--
-- This is administrative email verification, not Supabase AAL2 / TOTP.
-- The table stores only a cryptographic fingerprint of the 6-digit code.
-- The plaintext code must never be written to SQL, logs, or URLs.

-- ---------------------------------------------------------------------------
-- admin_email_verification_challenges
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.admin_email_verification_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_sent_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  consumed_at TIMESTAMPTZ,
  superseded_at TIMESTAMPTZ,
  locked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT admin_email_verification_challenges_session_id_len
    CHECK (char_length(btrim(session_id)) BETWEEN 1 AND 200),
  CONSTRAINT admin_email_verification_challenges_code_hash_sha256
    CHECK (code_hash ~ '^[0-9a-f]{64}$'),
  CONSTRAINT admin_email_verification_challenges_attempts_nonneg
    CHECK (attempt_count >= 0)
);

CREATE INDEX IF NOT EXISTS admin_email_verification_challenges_profile_idx
  ON public.admin_email_verification_challenges (profile_id, created_at DESC);

CREATE INDEX IF NOT EXISTS admin_email_verification_challenges_active_idx
  ON public.admin_email_verification_challenges (profile_id, session_id, expires_at)
  WHERE consumed_at IS NULL
    AND superseded_at IS NULL
    AND locked_at IS NULL;

COMMENT ON TABLE public.admin_email_verification_challenges IS
  'Administrative email verification challenges. Stores HMAC-SHA256 fingerprints only. Service role only. Not Supabase AAL2/TOTP.';

COMMENT ON COLUMN public.admin_email_verification_challenges.code_hash IS
  'HMAC-SHA256 hex digest of the one-time code. Never store or log the plaintext code.';

COMMENT ON COLUMN public.admin_email_verification_challenges.session_id IS
  'Auth session identifier bound to the signed verification cookie.';

-- ---------------------------------------------------------------------------
-- Grants — no browser / JWT access
-- ---------------------------------------------------------------------------

REVOKE ALL ON TABLE public.admin_email_verification_challenges FROM PUBLIC;
REVOKE ALL ON TABLE public.admin_email_verification_challenges FROM anon;
REVOKE ALL ON TABLE public.admin_email_verification_challenges FROM authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
  ON TABLE public.admin_email_verification_challenges
  TO service_role;

-- ---------------------------------------------------------------------------
-- RLS — enabled, zero policies for anon/authenticated
-- Even profiles.role = admin cannot read hashes via the user JWT.
-- service_role bypasses RLS (server-only secret key).
-- ---------------------------------------------------------------------------

ALTER TABLE public.admin_email_verification_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_email_verification_challenges FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_email_verification_challenges_no_anon"
  ON public.admin_email_verification_challenges;
DROP POLICY IF EXISTS "admin_email_verification_challenges_no_authenticated"
  ON public.admin_email_verification_challenges;
